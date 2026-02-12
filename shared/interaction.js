export function pointerPositionInElement(ev, element) {
  const rect = element.getBoundingClientRect();
  return {
    x: ev.clientX - rect.left,
    y: ev.clientY - rect.top
  };
}

export function makeDraggable({
  element,
  onStart,
  onMove,
  onEnd,
  hitTest = () => true,
  preventDefault = true
}) {
  let dragging = false;
  let pointerId = null;

  const down = (ev) => {
    if (preventDefault) ev.preventDefault();
    const pos = pointerPositionInElement(ev, element);
    if (!hitTest(pos, ev)) return;
    dragging = true;
    pointerId = ev.pointerId;
    element.setPointerCapture(pointerId);
    onStart?.(pos, ev);
  };

  const move = (ev) => {
    if (!dragging || ev.pointerId !== pointerId) return;
    if (preventDefault) ev.preventDefault();
    const pos = pointerPositionInElement(ev, element);
    onMove?.(pos, ev);
  };

  const up = (ev) => {
    if (!dragging || ev.pointerId !== pointerId) return;
    if (preventDefault) ev.preventDefault();
    const pos = pointerPositionInElement(ev, element);
    dragging = false;
    onEnd?.(pos, ev);
    try {
      element.releasePointerCapture(pointerId);
    } catch {
      // no-op
    }
    pointerId = null;
  };

  element.addEventListener("pointerdown", down);
  element.addEventListener("pointermove", move);
  element.addEventListener("pointerup", up);
  element.addEventListener("pointercancel", up);

  return () => {
    element.removeEventListener("pointerdown", down);
    element.removeEventListener("pointermove", move);
    element.removeEventListener("pointerup", up);
    element.removeEventListener("pointercancel", up);
  };
}

export function readUrlState(defaults) {
  const url = new URL(window.location.href);
  const out = { ...defaults };
  for (const [key, value] of Object.entries(defaults)) {
    if (!url.searchParams.has(key)) continue;
    const raw = url.searchParams.get(key);
    if (typeof value === "number") {
      const parsed = Number(raw);
      if (!Number.isNaN(parsed)) out[key] = parsed;
    } else if (typeof value === "boolean") {
      out[key] = raw === "1" || raw === "true";
    } else {
      out[key] = raw;
    }
  }
  return out;
}

export function writeUrlState(state, replace = true) {
  const url = new URL(window.location.href);
  Object.entries(state).forEach(([k, v]) => {
    if (v === null || v === undefined || v === "") url.searchParams.delete(k);
    else url.searchParams.set(k, String(v));
  });

  if (replace) {
    window.history.replaceState({}, "", url);
  } else {
    window.history.pushState({}, "", url);
  }
}

export function bindSliderWithNumber({
  slider,
  output,
  onInput,
  precision = 2,
  format
}) {
  const sync = () => {
    const value = Number(slider.value);
    if (output) output.textContent = format ? format(value) : value.toFixed(precision);
    onInput?.(value);
  };
  slider.addEventListener("input", sync);
  sync();
  return sync;
}
