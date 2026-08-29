// QuartzFlow 静态审计：扫描 src/ 模块，输出合规/死代码信号（markdown 报告到 stdout）。
// 用法：
//   node scripts/audit.mjs                    基础审计
//   node scripts/audit.mjs --app-css <path>   追加：选择器类名与 Obsidian app.css 对比
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC = join(ROOT, "src");
const FONTS = join(ROOT, "QuartzFlow", "fonts");
const MANIFEST = join(ROOT, "QuartzFlow", "manifest.json");
const i = process.argv.indexOf("--app-css");
const APP_CSS = i > -1 ? process.argv[i + 1] : null;

function collect(dir) {
  const files = [];
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...collect(full));
    else if (entry.endsWith(".css")) files.push(full);
  }
  return files;
}

// 注释替换为空格（保留换行，行号不变）
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
}

// 迷你 CSS 扫描器：返回规则帧 {selector, line, decls:[{prop,value,important,line}], isAt}
// 感知字符串与 url()：引号内及 url(...) 内的 ; : { } 不作为语法符号，
// 避免 data-URI SVG 把声明切碎（如 content/url('data:image/svg+xml;utf8,<svg...')）。
function parseCss(text) {
  const rules = [];
  const stack = [];
  let buf = "", bufLine = 1, line = 1;
  const flush = () => {
    const stmt = buf.trim();
    buf = "";
    const frame = stack[stack.length - 1];
    if (!stmt || !frame || !stmt.includes(":")) return;
    const ci = stmt.indexOf(":");
    frame.decls.push({
      prop: stmt.slice(0, ci).trim().toLowerCase(),
      value: stmt.slice(ci + 1).trim(),
      important: /!important\s*$/i.test(stmt),
      line: bufLine,
    });
  };
  const n = text.length;
  let k = 0;
  while (k < n) {
    const ch = text[k];
    if (!buf.trim()) {
      const rest = text.slice(k);
      const um = rest.match(/^url\(\s*(["'])/i);
      if (um) {
        // 整个 url(...) 作为普通文本吞掉，其内部特殊字符不生效
        bufLine = line;
        const m = rest.match(/^url\(\s*(["'])(?:(?!\1).|\n)*?\1\s*\)/i);
        const tok = m ? m[0] : rest;
        for (const c of tok) { if (c === "\n") line++; buf += c; }
        k += tok.length;
        continue;
      }
    }
    if (ch === "\n") { line++; buf += ch; k++; continue; }
    if (ch === '"' || ch === "'") {
      // 字符串：原样收集直到同种引号闭合（或行尾，容错未闭合字符串）
      if (!buf.trim()) bufLine = line;
      buf += ch;
      k++;
      while (k < n && text[k] !== ch) {
        if (text[k] === "\n") { line++; buf += text[k++]; break; }
        buf += text[k++];
      }
      if (k < n && text[k] === ch) { buf += text[k++]; }
      continue;
    }
    if (ch === "{") {
      const prelude = buf.replace(/\s+/g, " ").trim();
      buf = "";
      const frame = { selector: prelude, line: bufLine, decls: [], isAt: prelude.startsWith("@") };
      stack.push(frame);
      rules.push(frame);
      k++;
    } else if (ch === ";") {
      flush();
      k++;
    } else if (ch === "}") {
      flush();
      stack.pop();
      k++;
    } else {
      if (ch.trim() && !buf.trim()) bufLine = line;
      buf += ch;
      k++;
    }
  }
  return rules;
}

const modules = collect(SRC).map((f) => {
  const raw = readFileSync(f, "utf8");
  const text = stripComments(raw);
  return { rel: relative(SRC, f).replaceAll("\\", "/"), raw, text, rules: parseCss(text) };
});

const F = {
  braces: [], important: [], deep: [], remote: [], appScheme: [], relativeUrls: [],
  importRules: [], dupDecls: [], unusedTokens: [], unknownClasses: [],
  fonts: [], fontDeadFiles: [], fontMissing: [], fontUsage: [], settings: null, manifest: null,
};

for (const m of modules) {
  let d = 0;
  for (const ch of m.text) { if (ch === "{") d++; else if (ch === "}") d--; }
  if (d !== 0) F.braces.push({ file: m.rel, balance: d });

  const sm = m.raw.match(/\/\*\s*@settings\s*\n([\s\S]*?)\*\//);
  if (sm) F.settings = {
    file: m.rel,
    hasId: /^id:\s*\S+/m.test(sm[1]),
    hasName: /^name:\s*\S+/m.test(sm[1]),
    hasSettings: /^settings:/m.test(sm[1]),
  };

  // @import 是无花括号语句，规则帧扫描器不会成帧：直接对去注释文本按行做语句级检测（换行保留，行号不变）
  m.text.split("\n").forEach((ln, idx) => {
    if (/^\s*@import\b/.test(ln)) F.importRules.push({ file: m.rel, line: idx + 1 });
  });

  for (const r of m.rules) {
    for (const dec of r.decls) {
      if (dec.important) F.important.push({ file: m.rel, line: dec.line, selector: r.selector, prop: dec.prop });
      for (const u of dec.value.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
        const url = u[1];
        if (/^https?:\/\//i.test(url)) F.remote.push({ file: m.rel, line: dec.line, url });
        else if (url.startsWith("app://")) F.appScheme.push({ file: m.rel, line: dec.line, url });
        else if (!url.startsWith("data:")) F.relativeUrls.push({ file: m.rel, line: dec.line, url });
      }
    }

    const seen = new Map();
    for (const dec of r.decls) {
      if (seen.has(dec.prop)) F.dupDecls.push({ file: m.rel, selector: r.selector, prop: dec.prop, deadLine: seen.get(dec.prop), overriddenBy: dec.line });
      seen.set(dec.prop, dec.line);
    }

    if (!r.isAt) {
      const classCount = (r.selector.match(/\.[A-Za-z_][\w-]*/g) || []).length;
      const chainLen = r.selector.split(/\s+/).filter(Boolean).length;
      if (classCount >= 5 || chainLen >= 5) F.deep.push({ file: m.rel, line: r.line, selector: r.selector });
    }
  }
}

// 自定义属性：定义但未引用（需人工确认是否暴露给 Style Settings/用户 snippet）
const defined = new Map();
const used = new Set();
for (const m of modules) for (const r of m.rules) for (const dec of r.decls) {
  if (dec.prop.startsWith("--") && !defined.has(dec.prop)) defined.set(dec.prop, { file: m.rel, line: dec.line });
  for (const v of dec.value.matchAll(/var\(\s*(--[A-Za-z0-9_-]+)/g)) used.add(v[1]);
}
F.unusedTokens = [...defined.entries()].filter(([n]) => !used.has(n)).map(([name, w]) => ({ name, ...w }));

// 字体：@font-face 清单、死文件、缺失文件、字体族实际使用点
const diskFonts = readdirSync(FONTS);
for (const m of modules) for (const r of m.rules) if (r.selector === "@font-face") {
  const get = (p) => (r.decls.find((x) => x.prop === p) || {}).value || "";
  F.fonts.push({
    file: m.rel, line: r.line,
    family: get("font-family").replace(/["']/g, ""),
    weight: get("font-weight"), style: get("font-style"),
    srcFile: (get("src").match(/\/([^"/']+\.woff2?)[)"']/) || [])[1] || null,
  });
}
const referenced = new Set(F.fonts.map((f) => f.srcFile).filter(Boolean));
F.fontDeadFiles = diskFonts.filter((f) => !referenced.has(f));
F.fontMissing = [...referenced].filter((f) => !diskFonts.includes(f));
const families = [...new Set(F.fonts.map((f) => f.family))];
for (const m of modules) for (const r of m.rules) {
  if (r.selector === "@font-face") continue;
  for (const dec of r.decls) {
    if (dec.prop.includes("font"))
      for (const fam of families) if (dec.value.includes(fam)) F.fontUsage.push({ family: fam, file: m.rel, line: dec.line });
  }
}

// 选择器类名与 Obsidian app.css 对比（可选）
if (APP_CSS) {
  const appText = readFileSync(APP_CSS, "utf8");
  const appClasses = new Set([...appText.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((x) => x[1]));
  const themeSel = modules.flatMap((m) => m.rules).filter((r) => !r.isAt).map((r) => r.selector).join("\n");
  const themeClasses = new Set([...themeSel.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((x) => x[1]));
  const pluginPrefixes = ["n-", "cm-", "u-", "kanban-", "excalidraw-", "calendar-", "dataview-"];
  F.unknownClasses = [...themeClasses]
    .filter((c) => !appClasses.has(c) && !c.startsWith("quartzflow") && c !== "theme-light" && c !== "theme-dark")
    .map((c) => ({ class: c, likelyPlugin: pluginPrefixes.some((p) => c.startsWith(p)) }));
}

// manifest 检查
const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
F.manifest = {
  name: manifest.name, nameMatchesFolder: manifest.name === "QuartzFlow",
  version: manifest.version, semverOk: /^\d+\.\d+\.\d+$/.test(manifest.version),
  minAppVersion: manifest.minAppVersion,
};

// 报告
const out = [];
const h = (s) => out.push(`\n## ${s}\n`);
const rows = (arr, cols) => {
  if (!arr.length) { out.push("（无）"); return; }
  out.push(`| ${cols.join(" | ")} |`, `| ${cols.map(() => "---").join(" | ")} |`);
  for (const a of arr) out.push(`| ${cols.map((c) => String(a[c] ?? "")).join(" | ")} |`);
};
out.push("# QuartzFlow 审计报告", `\n生成时间：${new Date().toISOString()}\n`);
h(`1. 花括号配对异常（${F.braces.length}）`);
rows(F.braces, ["file", "balance"]);
h(`2. !important 清单（${F.important.length}）`);
rows(F.important, ["file", "line", "prop", "selector"]);
h(`3. 深层/高特异性选择器（启发式，${F.deep.length}）`);
rows(F.deep, ["file", "line", "selector"]);
h(`4. 远程请求（${F.remote.length}）—— 必须为 0`);
rows(F.remote, ["file", "line", "url"]);
h(`5. @import（${F.importRules.length}）—— 必须为 0`);
rows(F.importRules, ["file", "line"]);
h(`6. app:// 绝对路径引用（${F.appScheme.length}）`);
rows(F.appScheme.slice(0, 5), ["file", "line"]);
if (F.appScheme.length > 5) out.push(`…（共 ${F.appScheme.length} 处，其余略）`);
h(`6b. 相对路径 url 引用（${F.relativeUrls.length}）—— 相对路径在 Obsidian 中会 404（base URL 是 vault 根）`);
rows(F.relativeUrls, ["file", "line", "url"]);
h(`7. 块内重复声明（前者被覆盖，${F.dupDecls.length}）`);
rows(F.dupDecls, ["file", "selector", "prop", "deadLine", "overriddenBy"]);
h(`8. 定义未引用的自定义属性（${F.unusedTokens.length}，需人工确认）`);
rows(F.unusedTokens, ["name", "file", "line"]);
h(`9. 字体清单（${F.fonts.length} 条 @font-face）`);
rows(F.fonts, ["family", "weight", "style", "srcFile", "file", "line"]);
h(`10. 磁盘有但未被 @font-face 引用的字体文件（${F.fontDeadFiles.length}）`);
rows(F.fontDeadFiles.map((f) => ({ file: f })), ["file"]);
h(`11. @font-face 引用但磁盘缺失的文件（${F.fontMissing.length}）—— 必须为 0`);
rows(F.fontMissing.map((f) => ({ file: f })), ["file"]);
h(`12. 字体族在主题中的实际使用点（${F.fontUsage.length}）`);
rows(F.fontUsage, ["family", "file", "line"]);
h("13. Style Settings 块");
out.push(F.settings ? `- 位置：${F.settings.file}\n- name: ${F.settings.hasName ? "OK" : "缺失"}\n- id: ${F.settings.hasId ? "OK" : "缺失"}\n- settings: ${F.settings.hasSettings ? "OK" : "缺失"}` : "未找到 @settings 块");
h("14. manifest.json");
out.push(`- name=${F.manifest.name}（与文件夹名一致：${F.manifest.nameMatchesFolder}）\n- version=${F.manifest.version}（semver：${F.manifest.semverOk}）\n- minAppVersion=${F.manifest.minAppVersion}`);
if (APP_CSS) {
  h(`15. 主题使用但 app.css 中不存在的类名（${F.unknownClasses.length}，疑似失效或插件类）`);
  rows(F.unknownClasses, ["class", "likelyPlugin"]);
}
console.log(out.join("\n"));
