(function () {
  var current = document.currentScript;
  if (!current) return;

  var moduleSrc = current.getAttribute('data-module');
  if (!moduleSrc) return;

  var protocol = window.location.protocol;
  if (protocol === 'file:') {
    var container = document.createElement('div');
    container.style.cssText = [
      'position: fixed',
      'inset: 12px',
      'z-index: 99999',
      'background: #111827',
      'color: #e5e7eb',
      'border: 1px solid #334155',
      'border-radius: 12px',
      'padding: 16px',
      'font-family: ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
      'line-height: 1.45'
    ].join(';');

    container.innerHTML = [
      '<h2 style="margin:0 0 8px 0;font-size:1.05rem;">Local File Mode Detected</h2>',
      '<p style="margin:0 0 8px 0;">This page uses JavaScript ES modules, which browsers block from <code>file://</code> for security (CORS origin <code>null</code>).</p>',
      '<p style="margin:0 0 8px 0;">Run a local server from the project root instead:</p>',
      '<pre style="margin:0;padding:8px;border-radius:8px;background:#0b1221;border:1px solid #334155;">python3 -m http.server 4173</pre>',
      '<p style="margin:8px 0 0 0;">Then open <code>http://localhost:4173</code>.</p>'
    ].join('');

    document.body.appendChild(container);
    console.error('[bootstrap] Blocked module startup on file://. Start a local HTTP server instead.');
    return;
  }

  // Resolve page app modules relative to the HTML document URL, not bootstrap.js.
  var baseUrl = new URL(moduleSrc, document.baseURI).toString();
  var script = document.createElement('script');
  script.type = 'module';
  script.src = baseUrl;
  document.body.appendChild(script);
})();
