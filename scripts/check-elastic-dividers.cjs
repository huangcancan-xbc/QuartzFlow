// Run with: node scripts/check-elastic-dividers.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const listeners = new Map();
let enabled = true;
let reduced = false;
let frame;
let clock = 0;
let observer;
const classes = new Set();
const path = { setAttribute(name, value) { this[name] = value; } };
const svg = { style: {}, setAttribute() {}, appendChild() {}, remove() { this.removed = true; } };
const handle = {
  isConnected: true,
  classList: { add: (name) => classes.add(name), remove: (name) => classes.delete(name) },
  closest: () => handle,
  getBoundingClientRect: () => ({ width: 3, height: 800, top: 0 }),
  appendChild() { svg.removed = false; },
};
const context = {
  module: { exports: {} },
  require: () => ({ Plugin: class {
    registerDomEvent(target, name, fn) { listeners.set(name, fn); }
    register(fn) { this.cleanup = fn; }
  } }),
  document: { body: {}, createElementNS: (_, tag) => tag === "svg" ? svg : path },
  window: { matchMedia: () => ({ get matches() { return reduced; } }) },
  MutationObserver: class {
    constructor(fn) { observer = fn; }
    observe() {}
    disconnect() {}
  },
  getComputedStyle: () => ({ borderLeftWidth: "1px", getPropertyValue: () => enabled ? "1" : "" }),
  performance: { now: () => clock },
  requestAnimationFrame: (fn) => { frame = fn; return 1; },
  cancelAnimationFrame: () => { frame = null; },
};
vm.runInNewContext(fs.readFileSync(require.resolve("../src/plugins/elastic-dividers/main.js"), "utf8"), context);
const plugin = new context.module.exports();
plugin.onload();
const dispatch = (name, extra = {}) => listeners.get(name)({
  target: handle, button: 0, buttons: 1, pointerId: 1, clientX: 300, clientY: 400, ...extra,
});
const tick = (ms) => { clock += ms; const fn = frame; frame = null; fn?.(clock); };
dispatch("pointerdown");
dispatch("pointermove", { clientX: 340 });
assert.equal(plugin.drag.bend, 0, "pointer events should update the target without snapping the painted line");
tick(16);
const firstFrame = plugin.drag.bend;
assert.ok(firstFrame > 0 && firstFrame < 12, "the first frame should ease into the bend");
for (let i = 0; i < 12; i++) tick(16);
const right = plugin.drag.bend;
assert.ok(right > 20 && right <= 42, "rightward drag must settle into a bounded bend");
assert.equal(path["stroke-width"], "3", "preserve native line thickness");
dispatch("pointermove", { clientX: 320 });
assert.equal(plugin.drag.bend, right, "reversal must preserve the current painted position");
tick(16);
assert.ok(plugin.drag.bend > 0 && plugin.drag.bend < right, "reversal should pass smoothly through the resting line");
for (let i = 0; i < 30; i++) tick(16);
assert.ok(plugin.drag.bend < 0, "the curve must follow the new drag direction");
const released = plugin.drag.bend;
dispatch("pointerup", { buttons: 0 });
tick(196);
assert.ok(plugin.drag.bend * released < 0, "release must spring past the resting line");
assert.ok(Math.abs(plugin.drag.bend / released) > 0.35, "rebound should remain clearly visible");
tick(1200);
assert.equal(plugin.drag, null);
assert.ok(svg.removed && classes.size === 0 && !frame, "settling must remove decoration and animation");
dispatch("pointerdown");
dispatch("pointermove", { clientX: 340 });
tick(16);
const movingBend = plugin.drag.bend;
const movingVelocity = plugin.drag.velocity;
assert.ok(movingVelocity > 0, "moving line should carry velocity");
dispatch("pointerup", { buttons: 0 });
tick(0.1);
assert.ok(Math.abs((plugin.drag.bend - movingBend) / 0.0001 - movingVelocity) < 1,
  "release must preserve velocity instead of stopping abruptly");
plugin.stop();
const followAtRate = (interval) => {
  dispatch("pointerdown");
  dispatch("pointermove", { clientX: 340 });
  for (let elapsed = 0; elapsed < 160; elapsed += interval) tick(interval);
  const bend = plugin.drag.bend;
  plugin.stop();
  return bend;
};
assert.ok(Math.abs(followAtRate(16) - followAtRate(8)) < 0.001,
  "follow speed must be independent of display refresh rate");
// Check the rendered curve's curvature, including pulls at and beyond both ends.
const curvature = (points, t) => {
  const velocity = [0, 1].map(axis => 3 * (
    (1 - t) ** 2 * (points[1][axis] - points[0][axis])
    + 2 * t * (1 - t) * (points[2][axis] - points[1][axis])
    + t ** 2 * (points[3][axis] - points[2][axis])));
  const acceleration = [0, 1].map(axis => 6 * (
    (1 - t) * (points[2][axis] - 2 * points[1][axis] + points[0][axis])
    + t * (points[3][axis] - 2 * points[2][axis] + points[1][axis])));
  return Math.abs(velocity[0] * acceleration[1] - velocity[1] * acceleration[0])
    / Math.hypot(...velocity) ** 3;
};
for (const y of [-20, 0, 8, 40, 120, 240, 400, 560, 680, 760, 792, 800, 820]) {
  for (const direction of [-1, 1]) {
    dispatch("pointerdown", { clientY: y });
    dispatch("pointermove", { clientX: 300 + direction * 1000, clientY: y });
    tick(600);
    const coordinates = path.d.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi).map(Number);
    const points = Array.from({ length: 7 }, (_, i) => coordinates.slice(i * 2, i * 2 + 2));
    assert.deepEqual(points[0], [1.5, 0]);
    assert.deepEqual(points[6], [1.5, 800]);
    for (const segment of [points.slice(0, 4), points.slice(3)]) {
      for (let step = 0; step <= 24; step++) {
        assert.ok(curvature(segment, step / 24) < 1 / 240,
          `pull at y=${y} must not create a tight local fold`);
      }
    }
    if (y === 400) {
      assert.equal(points[3][1], 400, "preserve the middle grab position");
      assert.ok(Math.abs(points[3][0] - 1.5) > 41, "preserve the middle bend strength");
    }
    plugin.stop();
  }
}
dispatch("pointerdown");
dispatch("pointercancel");
assert.equal(plugin.drag, null);
dispatch("pointerdown");
enabled = false;
observer();
assert.equal(plugin.drag, null, "disabling the setting must stop an active drag");
dispatch("pointerdown");
assert.equal(plugin.drag, null, "disabled feature must preserve the native divider");
enabled = true;
reduced = true;
dispatch("pointerdown");
assert.equal(plugin.drag, null, "reduced motion must disable the effect");
reduced = false;
dispatch("pointerdown", { button: 2 });
assert.equal(plugin.drag, null, "secondary clicks must not start a drag");
dispatch("pointerdown");
plugin.cleanup();
assert.equal(plugin.drag, null, "unloading must restore the native divider");
console.log("Elastic divider checks passed: endpoint curvature, smooth reversal, momentum, frame rate, thickness, cleanup, settings, reduced motion.");
