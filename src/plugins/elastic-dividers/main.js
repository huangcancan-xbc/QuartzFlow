const { Plugin } = require("obsidian");

const HANDLE = ".workspace-split:is(.mod-left-split, .mod-right-split) > .workspace-leaf-resize-handle";
const ACTIVE = "quartzflow-elastic-active";

module.exports = class ElasticDividers extends Plugin {
  onload() {
    this.drag = null;
    this.frame = null;
    this.motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Observe native resizing without capturing the pointer or changing panel widths.
    this.registerDomEvent(document, "pointerdown", (event) => this.start(event), true);
    this.registerDomEvent(window, "pointermove", (event) => this.move(event), { passive: true });
    this.registerDomEvent(window, "pointerup", (event) => {
      if (this.drag?.pointerId !== event.pointerId || this.drag.released != null) return;
      this.drag.released = performance.now();
      this.drag.releaseBend = this.drag.bend;
      this.drag.releaseVelocity = this.drag.velocity;
      this.schedule();
    });
    this.registerDomEvent(window, "pointercancel", (event) => {
      if (this.drag?.pointerId === event.pointerId) this.stop();
    });
    this.registerDomEvent(window, "blur", () => this.stop());
    this.registerDomEvent(this.motion, "change", () => this.stop());
    const observer = new MutationObserver(() => {
      if (this.drag && !this.enabled(this.drag.handle)) this.stop();
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    this.register(() => { observer.disconnect(); this.stop(); });
  }

  enabled(handle) {
    return handle.isConnected && !this.motion.matches
      && getComputedStyle(handle).getPropertyValue("--quartzflow-elastic-enabled").trim() === "1";
  }

  start(event) {
    if (event.button !== 0) return;
    const handle = event.target.closest?.(HANDLE);
    if (!handle || !this.enabled(handle)) return;
    this.stop();
    const rect = handle.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    svg.setAttribute("class", "quartzflow-elastic-line");
    svg.setAttribute("aria-hidden", "true");
    svg.style.width = `${rect.width}px`;
    svg.style.left = `${-parseFloat(getComputedStyle(handle).borderLeftWidth)}px`;
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-width", String(rect.width));
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("vector-effect", "non-scaling-stroke");
    svg.appendChild(path);
    handle.appendChild(svg);
    handle.classList.add(ACTIVE);
    this.drag = {
      handle, svg, path, pointerId: event.pointerId,
      origin: event.clientX, lastX: event.clientX, y: event.clientY,
      targetY: event.clientY, direction: 0, bend: 0, targetBend: 0,
      velocity: 0, time: performance.now(), released: null,
    };
    this.schedule();
  }

  move(event) {
    const drag = this.drag;
    if (!drag || drag.pointerId !== event.pointerId || drag.released != null) return;
    const delta = event.clientX - drag.lastX;
    if (delta) {
      const direction = Math.sign(delta);
      if (direction !== drag.direction) drag.origin = drag.lastX;
      drag.direction = direction;
      drag.lastX = event.clientX;
      // Soft resistance keeps long drags from stretching the curve across the text.
      drag.targetBend = 42 * Math.tanh((event.clientX - drag.origin) / 55);
    }
    drag.targetY = event.clientY;
    this.schedule();
  }

  schedule() {
    if (this.frame == null) this.frame = requestAnimationFrame((time) => this.draw(time));
  }

  draw(time) {
    this.frame = null;
    const drag = this.drag;
    if (!drag) return;
    if (!this.enabled(drag.handle)) return this.stop();
    const rect = drag.handle.getBoundingClientRect();
    if (!rect.width || !rect.height) return this.stop();
    if (drag.released != null) {
      const elapsed = Math.max(0, (time - drag.released) / 1000);
      if (elapsed >= 1.25 || (Math.abs(drag.releaseBend) < 0.1 && Math.abs(drag.releaseVelocity) < 1)) return this.stop();
      // Carry the moving line's velocity into a slower, damped rebound.
      drag.bend = Math.exp(-4.8 * elapsed) * (drag.releaseBend * Math.cos(16 * elapsed)
        + (drag.releaseVelocity + 4.8 * drag.releaseBend) / 16 * Math.sin(16 * elapsed));
      this.schedule();
    } else {
      // Time-based following keeps reversals soft at different refresh rates.
      const follow = 1 - Math.exp(-Math.max(0, time - drag.time) / 55);
      drag.time = time;
      drag.bend += (drag.targetBend - drag.bend) * follow;
      drag.y += (drag.targetY - drag.y) * follow;
      drag.velocity = (drag.targetBend - drag.bend) / 0.055;
      if (Math.abs(drag.targetBend - drag.bend) > 0.02 || Math.abs(drag.targetY - drag.y) > 0.1) {
        this.schedule();
      } else {
        drag.bend = drag.targetBend;
        drag.y = drag.targetY;
        drag.velocity = 0;
      }
    }
    const middle = rect.width / 2;
    const position = Math.max(0, Math.min(1, (drag.y - rect.top) / rect.height));
    const edgeZone = 0.3;
    const edgeDistance = Math.min(position, 1 - position);
    const edgeProgress = Math.min(edgeDistance / edgeZone, 1);
    // Near fixed ends, spread the bend over more line and ease down its strength.
    // Both mappings join the unchanged middle region with a continuous slope.
    const span = edgeDistance < edgeZone
      ? edgeZone / 2 + edgeDistance ** 2 / (2 * edgeZone) : edgeDistance;
    const y = rect.height * (position < 0.5 ? span : 1 - span);
    const bend = drag.bend * (0.35 + 0.65 * edgeProgress ** 2 * (3 - 2 * edgeProgress));
    const bow = middle + bend;
    const shoulder = middle + bend * 2 / 3;
    // Angled ends avoid S-shaped shoulders; equal join handles keep curvature continuous.
    const join = Math.min(y, rect.height - y) / 3;
    drag.svg.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
    drag.svg.setAttribute("preserveAspectRatio", "none");
    drag.path.setAttribute("d", `M ${middle} 0 C ${shoulder} ${y / 3}, ${bow} ${y - join}, ${bow} ${y} C ${bow} ${y + join}, ${shoulder} ${rect.height - (rect.height - y) / 3}, ${middle} ${rect.height}`);
  }

  stop() {
    if (this.frame != null) cancelAnimationFrame(this.frame);
    this.frame = null;
    if (this.drag) {
      this.drag.handle.classList.remove(ACTIVE);
      this.drag.svg.remove();
      this.drag = null;
    }
  }
};
