import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4285);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };
const publicPaths = new Set(['/index.html', '/src/app.js', '/src/engine.js', '/src/styles.css', '/data/places.js', '/assets/compass.svg', '/assets/adventure.svg', '/assets/countryside.svg']);
for (const file of ['/classic/index.html', '/classic/src/app.js', '/classic/src/styles.css', '/classic/data/places.js']) publicPaths.add(file);
const server = http.createServer((req, res) => {
  const send = (status, body, type = 'text/plain; charset=utf-8') => {
    res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'self'; connect-src 'self'; img-src 'self'; script-src 'self'; style-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'" });
    res.end(req.method === 'HEAD' ? undefined : body);
  };
  if (!['GET', 'HEAD'].includes(req.method)) { send(405, 'Method not allowed'); return; }
  let url;
  try { url = decodeURIComponent((req.url || '/').split('?')[0]); }
  catch { send(400, 'Invalid URL'); return; }
  if (url === '/') url = '/index.html';
  if (url === '/classic/' || url === '/classic') url = '/classic/index.html';
  if (!publicPaths.has(url)) { send(404, 'Not found'); return; }
  fs.readFile(path.join(root, url), (error, data) => {
    if (error) { send(404, 'Not found'); return; }
    send(200, data, types[path.extname(url)]);
  });
});
server.on('error', error => { console.error(`Nem indult el a helyi demo (${error.code}). Valassz masik PORT erteket.`); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Random Adventure modern helyi MVP: http://127.0.0.1:${port}`));
