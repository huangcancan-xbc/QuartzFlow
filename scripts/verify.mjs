import { readFileSync } from "node:fs";
// Normalize: strip /* */ comments (incl. multi-line), drop blank lines, trim.
function norm(p) {
  const t = readFileSync(p, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  return t.split("\n").map((l) => l.trim()).filter((l) => l !== "");
}
const a = norm(process.argv[2]);
const b = norm(process.argv[3]);
const sa = [...a].sort().join("\n");
const sb = [...b].sort().join("\n");
console.log("orig lines:", a.length, "| built lines:", b.length);
console.log(sa === sb ? "PASS: identical content (order-insensitive)" : "FAIL: content mismatch");
if (sa !== sb) {
  const ca = {}, cb = {};
  a.forEach((l) => (ca[l] = (ca[l] || 0) + 1));
  b.forEach((l) => (cb[l] = (cb[l] || 0) + 1));
  for (const l of new Set([...a, ...b])) {
    if ((ca[l] || 0) !== (cb[l] || 0)) {
      console.log("diff x" + (ca[l] || 0) + " -> x" + (cb[l] || 0) + ": " + l.slice(0, 120));
    }
  }
}
