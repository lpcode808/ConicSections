// Page runtime for explorable modules.
//
// Each module page declares its state, controls, drag behavior, and a render
// function; this runtime owns the boilerplate: URL state, slider/output
// binding, reset, the world<->screen mapper (single source for both render
// and drag), the animation loop, the progress strip, and debug mounting.
//
// Minimal new-module usage:
//
//   createExplorable({
//     id: "p7-topic",
//     moduleId: "07-topic",
//     defaults: { k: 1 },
//     url: { k: 2 },
//     view: { unitsWide: 24 },
//     params: [{ key: "k", slider: "kRange", output: "kOut" }],
//     drag: { onMove({ world, state }) { state.k = world.x; } },
//     render({ ctx, mapper, rect, state }) { ... }
//   });
import { readUrlState, writeUrlState, makeDraggable } from "./interaction.js";
import { createDebugger, mountDebugPanel } from "./debug.js";
import { setupHiDPICanvas, worldToScreenFactory } from "./draw-utils.js";
import { mountProgressStrip } from "./modules.js";

function serializeValue(value, spec) {
  if (spec === "flag") return value ? 1 : 0;
  if (spec === "raw") return value;
  if (typeof spec === "number") return Number(value).toFixed(spec);
  return value;
}

export function createExplorable({
  id,
  moduleId,
  canvas: canvasId = "scene",
  defaults,
  url = {},
  view = { unitsWide: 24 },
  params = [],
  drag,
  render,
  onReset,
  getDebugState,
  smoke = []
}) {
  const logger = createDebugger(id);
  const state = readUrlState(defaults);
  const canvas = typeof canvasId === "string" ? document.getElementById(canvasId) : canvasId;

  const boundParams = params.map((p) => ({
    ...p,
    sliderEl: typeof p.slider === "string" ? document.getElementById(p.slider) : p.slider,
    outputEl: typeof p.output === "string" ? document.getElementById(p.output) : p.output
  }));

  function persist() {
    const out = {};
    for (const [key, spec] of Object.entries(url)) {
      out[key] = serializeValue(state[key], spec);
    }
    writeUrlState(out);
    logger.dbg("state.persist", state);
  }

  function syncControls() {
    for (const p of boundParams) {
      if (!p.sliderEl) continue;
      p.sliderEl.value = state[p.key];
      if (p.outputEl) {
        const v = Number(state[p.key]);
        p.outputEl.textContent = p.format ? p.format(v) : v.toFixed(p.precision ?? 2);
      }
    }
  }

  function setValues(values) {
    Object.assign(state, values);
    syncControls();
    persist();
  }

  function currentView() {
    return typeof view === "function" ? view(state) : view;
  }

  function currentMapper() {
    const rect = canvas.getBoundingClientRect();
    const v = currentView();
    const mapper = worldToScreenFactory(rect.width, rect.height, rect.width / v.unitsWide, v.center);
    return { mapper, rect };
  }

  const api = { state, logger, persist, syncControls, setValues, currentMapper };

  for (const p of boundParams) {
    if (!p.sliderEl) continue;
    p.sliderEl.addEventListener("input", () => {
      state[p.key] = Number(p.sliderEl.value);
      p.onChange?.(state[p.key], api);
      syncControls();
      persist();
    });
  }
  syncControls();
  persist();

  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      setValues({ ...defaults });
      for (const p of boundParams) p.onChange?.(state[p.key], api);
      syncControls();
      onReset?.(api);
      persist();
      logger.event("reset.defaults", { ...state });
    });
  }

  if (drag && canvas) {
    if (drag.cursor !== null) canvas.style.cursor = drag.cursor || "crosshair";
    const handle = (callback) => (pos, ev) => {
      const { mapper, rect } = currentMapper();
      callback?.({ world: mapper.toWorld(pos), screen: pos, mapper, rect, state, ev, api });
      syncControls();
      persist();
    };
    makeDraggable({
      element: canvas,
      onStart: handle(drag.onStart || drag.onMove),
      onMove: handle(drag.onMove)
    });
  }

  if (moduleId) mountProgressStrip(moduleId);

  mountDebugPanel({
    target: document.getElementById("debugHost") || document.body,
    namespace: id,
    getState: getDebugState || (() => ({ ...state }))
  });

  logger.info("page.init", { ...state });
  // Deferred so smoke checks can reference bindings the page module creates
  // from this function's return value.
  if (smoke.length) queueMicrotask(() => logger.smoke(smoke));

  if (render && canvas) {
    let last = performance.now();
    function frame(ts) {
      const { mapper, rect } = currentMapper();
      const ctx = setupHiDPICanvas(canvas);
      const dt = Math.min(0.05, (ts - last) / 1000);
      last = ts;
      render({ ctx, mapper, rect, state, dt, api });
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  return api;
}
