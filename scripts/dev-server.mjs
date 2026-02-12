import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const portArgIdx = args.findIndex((a) => a === '--port');
const port = portArgIdx >= 0 ? Number(args[portArgIdx + 1]) : 4173;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

function safePathname(urlPathname) {
  const decoded = decodeURIComponent(urlPathname);
  const normalized = path.normalize(decoded).replace(/^\/+/, '');
  const resolved = path.resolve(root, normalized);
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

const server = http.createServer((req, res) => {
  try {
    const reqUrl = new URL(req.url || '/', `http://${req.headers.host}`);
    let requested = safePathname(reqUrl.pathname);
    if (!requested) {
      send(res, 400, 'Bad request');
      return;
    }

    if (fs.existsSync(requested) && fs.statSync(requested).isDirectory()) {
      requested = path.join(requested, 'index.html');
    }

    if (!fs.existsSync(requested)) {
      send(res, 404, 'Not found');
      return;
    }

    const ext = path.extname(requested).toLowerCase();
    const contentType = mime[ext] || 'application/octet-stream';
    const stream = fs.createReadStream(requested);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store'
    });
    stream.pipe(res);
  } catch (err) {
    send(res, 500, `Server error: ${String(err)}`);
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`[dev-server] serving ${root} at http://127.0.0.1:${port}`);
});
