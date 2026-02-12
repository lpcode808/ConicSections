const DEFAULT_NAMESPACE = "conic";
const STORAGE_KEY = "conic:telemetry:v1";
const MAX_RECORDS = 1200;
const INTERACTION_THROTTLE_MS = 250;

function now() {
  return new Date().toISOString();
}

function safeStringify(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify(String(value));
  }
}

function safeParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function loadRecords() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = safeParse(raw, []);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecords(records) {
  try {
    window.localStorage.setItem(STORAGE_KEY, safeStringify(records));
  } catch {
    // localStorage is optional; keep runtime-only logs if unavailable.
  }
}

function getRuntime() {
  if (!window.__conicTelemetryRuntime) {
    window.__conicTelemetryRuntime = {
      sessionId: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      handlersInstalled: false,
      records: loadRecords(),
      interactionTicks: new Map()
    };
  }
  return window.__conicTelemetryRuntime;
}

function trimRecords(records) {
  if (records.length <= MAX_RECORDS) return records;
  return records.slice(records.length - MAX_RECORDS);
}

function normalizeData(data) {
  if (data === undefined) return null;
  if (data === null) return null;
  if (typeof data === "string" || typeof data === "number" || typeof data === "boolean") return data;
  return safeParse(safeStringify(data), String(data));
}

function pushRecord(namespace, level, message, data = null) {
  const runtime = getRuntime();
  const record = {
    ts: now(),
    sessionId: runtime.sessionId,
    namespace,
    level,
    message,
    data: normalizeData(data),
    url: window.location.href
  };
  runtime.records.push(record);
  runtime.records = trimRecords(runtime.records);
  saveRecords(runtime.records);
  window.__CONIC_LOGS__ = runtime.records;
  return record;
}

function describeTarget(target) {
  if (!target || !(target instanceof Element)) return null;
  const id = target.id ? `#${target.id}` : "";
  const nameAttr = target.getAttribute("name");
  const name = nameAttr ? `[name=${nameAttr}]` : "";
  const tag = target.tagName.toLowerCase();
  const type = target.getAttribute("type");
  const role = target.getAttribute("role");
  const value = "value" in target ? target.value : null;
  return {
    tag,
    id,
    name,
    type,
    role,
    text: (target.textContent || "").trim().slice(0, 80),
    value: typeof value === "string" ? value.slice(0, 120) : value
  };
}

function installGlobalHandlers(namespace) {
  const runtime = getRuntime();
  if (runtime.handlersInstalled) return;
  runtime.handlersInstalled = true;

  window.addEventListener("error", (ev) => {
    pushRecord(namespace, "error", "window.error", {
      message: ev.message,
      source: ev.filename,
      line: ev.lineno,
      column: ev.colno
    });
  });

  window.addEventListener("unhandledrejection", (ev) => {
    pushRecord(namespace, "error", "window.unhandledrejection", {
      reason: String(ev.reason)
    });
  });

  const logInteraction = (kind, ev) => {
    const target = ev.target;
    const desc = describeTarget(target);
    if (!desc) return;
    const key = `${kind}:${desc.tag}${desc.id}:${desc.name}:${desc.type || ""}`;
    const t = performance.now();
    const last = runtime.interactionTicks.get(key) || 0;
    if (t - last < INTERACTION_THROTTLE_MS) return;
    runtime.interactionTicks.set(key, t);
    pushRecord(namespace, "interaction", kind, desc);
  };

  document.addEventListener("click", (ev) => logInteraction("click", ev), true);
  document.addEventListener("input", (ev) => logInteraction("input", ev), true);
  document.addEventListener("change", (ev) => logInteraction("change", ev), true);
}

export function getTelemetryRecords() {
  const runtime = getRuntime();
  return [...runtime.records];
}

export function clearTelemetryRecords() {
  const runtime = getRuntime();
  runtime.records = [];
  saveRecords(runtime.records);
  window.__CONIC_LOGS__ = runtime.records;
}

function downloadTelemetry(namespace = DEFAULT_NAMESPACE) {
  const payload = {
    exportedAt: now(),
    namespace,
    records: getTelemetryRecords()
  };
  const blob = new Blob([safeStringify(payload)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  a.href = url;
  a.download = `${namespace}-telemetry-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function createDebugger(namespace = DEFAULT_NAMESPACE) {
  const debug = new URL(window.location.href).searchParams.get("debug");
  const enabled = debug === "1" || debug === "true";
  const prefix = `[${namespace}]`;

  installGlobalHandlers(namespace);

  const log = (...args) => {
    console.log(prefix, ...args);
    pushRecord(namespace, "log", "log", args);
  };

  const info = (...args) => {
    console.info(prefix, ...args);
    pushRecord(namespace, "info", "info", args);
  };

  const warn = (...args) => {
    console.warn(prefix, ...args);
    pushRecord(namespace, "warn", "warn", args);
  };

  const error = (...args) => {
    console.error(prefix, ...args);
    pushRecord(namespace, "error", "error", args);
  };

  const dbg = (...args) => {
    if (enabled) {
      console.debug(prefix, ...args);
      pushRecord(namespace, "debug", "debug", args);
    }
  };

  const event = (name, payload) => {
    pushRecord(namespace, "event", name, payload);
    if (enabled) console.debug(prefix, `EVENT:${name}`, payload);
  };

  function assert(name, condition, detail = "") {
    if (condition) {
      info(`CHECK PASS: ${name}`, detail);
      return true;
    }
    error(`CHECK FAIL: ${name}`, detail);
    return false;
  }

  function smoke(tests) {
    let pass = 0;
    let fail = 0;
    for (const t of tests) {
      let ok = false;
      try {
        ok = Boolean(t.run());
      } catch (e) {
        ok = false;
        error(`Smoke test threw: ${t.name}`, String(e));
      }
      if (assert(t.name, ok)) pass += 1;
      else fail += 1;
    }
    info(`Smoke summary: ${pass} passed, ${fail} failed @ ${now()}`);
  }

  return {
    enabled,
    log,
    info,
    warn,
    error,
    dbg,
    event,
    assert,
    smoke
  };
}

export function mountDebugPanel({ target = document.body, getState, namespace = DEFAULT_NAMESPACE }) {
  const logger = createDebugger(namespace);
  const wrap = document.createElement("details");
  wrap.className = "debug-panel";
  if (logger.enabled) wrap.open = true;
  wrap.innerHTML = `
    <summary>Debug Panel</summary>
    <div class="debug-controls">
      <button type="button" data-action="snapshot">Log state snapshot</button>
      <button type="button" data-action="toggle">Toggle debug query param</button>
      <button type="button" data-action="download">Download telemetry JSON</button>
      <button type="button" data-action="clear">Clear telemetry history</button>
      <p class="debug-hint">Enable with <code>?debug=1</code></p>
      <p class="debug-hint" data-role="count"></p>
    </div>
  `;

  const countNode = wrap.querySelector('[data-role="count"]');
  const refreshCount = () => {
    countNode.textContent = `Stored records: ${getTelemetryRecords().length}`;
  };

  wrap.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button");
    if (!btn) return;
    const action = btn.getAttribute("data-action");

    if (action === "snapshot") {
      const snapshot = getState?.() ?? null;
      logger.event("state.snapshot", snapshot);
      logger.log("STATE SNAPSHOT", snapshot);
      refreshCount();
    }

    if (action === "toggle") {
      const url = new URL(window.location.href);
      const current = url.searchParams.get("debug");
      if (current === "1" || current === "true") url.searchParams.delete("debug");
      else url.searchParams.set("debug", "1");
      window.location.href = url.toString();
    }

    if (action === "download") {
      downloadTelemetry(namespace);
      logger.event("telemetry.download", { count: getTelemetryRecords().length });
      refreshCount();
    }

    if (action === "clear") {
      clearTelemetryRecords();
      logger.event("telemetry.clear", null);
      refreshCount();
    }
  });

  refreshCount();
  target.appendChild(wrap);
  return wrap;
}
