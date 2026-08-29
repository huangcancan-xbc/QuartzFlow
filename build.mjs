// QuartzFlow build: concatenates src/**/*.css (sorted by path) into QuartzFlow/theme.css.
// Usage:
//   node build.mjs                                build once
//   node build.mjs --watch                        rebuild on any src change
//   node build.mjs --deploy --vault="<vault dir>" build + copy theme.css into <vault dir>/.obsidian/themes/QuartzFlow/
//   node build.mjs --deploy                       same, reading the vault path from the .vault file at repo root
import { readdirSync, readFileSync, writeFileSync, statSync, watch, copyFileSync, mkdirSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const SRC = join(ROOT, "src");
const OUT = join(ROOT, "QuartzFlow", "theme.css");

function collect(dir) {
  const files = [];
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...collect(full));
    else if (entry.endsWith(".css")) files.push(full);
  }
  return files;
}

function deploy(vault) {
  const dest = join(vault, ".obsidian", "themes", "QuartzFlow");
  mkdirSync(dest, { recursive: true });
  copyFileSync(OUT, join(dest, "theme.css"));
  console.log(`[deploy] copied theme.css -> ${dest}`);
}

const MIME = { woff2: "font/woff2", woff: "font/woff" };
function inlineFonts(css) {
  return css.replace(/url\("\.\/fonts\/([^"]+)"\)/g, (m, name) => {
    const p = join(ROOT, "QuartzFlow", "fonts", name);
    if (!existsSync(p)) throw new Error(`字体文件缺失: ${name}`);
    const mime = MIME[name.split(".").pop().toLowerCase()];
    if (!mime) throw new Error(`未知字体格式: ${name}`);
    return `url("data:${mime};base64,${readFileSync(p).toString("base64")}")`;
  });
}

function build() {
  const files = collect(SRC);
  const banner = (f) =>
    `\n/* ============================================================\n` +
    `   src/${relative(SRC, f).replaceAll("\\", "/")}\n` +
    `   ============================================================ */\n`;
  const css =
    `/* GENERATED FILE — do not edit directly.\n` +
    `   Edit modules under src/ and run: node build.mjs */\n` +
    files.map((f) => banner(f) + readFileSync(f, "utf8").trim()).join("\n") +
    "\n";
  const final = inlineFonts(css);
  if (/url\(\s*["']?(\.\/)?fonts\//.test(final)) {
    throw new Error("产物中残留未内嵌的字体引用（检查 01-fonts.css 的 url() 写法）");
  }
  writeFileSync(OUT, final, "utf8");
  console.log(`[build] ${files.length} modules -> ${relative(ROOT, OUT)} (${Buffer.byteLength(final, "utf8")} bytes)`);
}

function resolveVault() {
  const eq = process.argv.find((a) => a.startsWith("--vault="));
  if (eq) return eq.slice("--vault=".length);
  const i = process.argv.indexOf("--vault");
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1];
  if (!process.argv.includes("--deploy")) return null;
  const vaultFile = join(ROOT, ".vault");
  const vault = existsSync(vaultFile) ? readFileSync(vaultFile, "utf8").trim() : "";
  if (vault) return vault;
  console.error(
    "[deploy] 未指定目标库路径。用法：node build.mjs --deploy --vault=\"<库路径>\"，" +
      "或在仓库根目录创建 .vault 文件（单行写入库路径）。"
  );
  process.exit(1);
}

const vaultArg = resolveVault();

build();
if (vaultArg) deploy(vaultArg);
if (vaultArg && process.argv.includes("--watch")) {
  let timer = null;
  watch(SRC, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => { build(); deploy(vaultArg); }, 100);
  });
  console.log("[watch] watching src/ for changes (build + deploy)...");
} else if (process.argv.includes("--watch")) {
  let timer = null;
  watch(SRC, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(build, 100);
  });
  console.log("[watch] watching src/ for changes...");
}
