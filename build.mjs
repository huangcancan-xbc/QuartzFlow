// QuartzFlow build: concatenates src/**/*.css (sorted by path) into QuartzFlow/theme.css.
// Usage:
//   node build.mjs                        build once
//   node build.mjs --watch                rebuild on any src change
//   node build.mjs --vault "D:\path"      build + copy theme.css into <vault>/.obsidian/themes/QuartzFlow/
import { readdirSync, readFileSync, writeFileSync, statSync, watch, copyFileSync, mkdirSync } from "node:fs";
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
  writeFileSync(OUT, css, "utf8");
  console.log(`[build] ${files.length} modules -> ${relative(ROOT, OUT)} (${css.length} bytes)`);
}

const vaultArg = process.argv.find((a) => a.startsWith("--vault="))?.slice(8)
  ?? (process.argv.includes("--deploy") ? "D:\\Coding\\博客" : null);

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
