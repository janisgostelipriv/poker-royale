/**
 * Mini-Server fuer lokalen PWA-Test (Service Worker brauchen http:// oder https://).
 * Start:  node tools/serve.js        -> http://localhost:8099/
 * Mit Unterpfad wie GitHub Pages:    node tools/serve.js --base /poker-royale/
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT || 8099);
const baseIdx = process.argv.indexOf('--base');
const BASE = baseIdx > -1 ? process.argv[baseIdx + 1] : '/';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.css': 'text/css; charset=utf-8',
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (BASE !== '/' && urlPath.startsWith(BASE)) urlPath = '/' + urlPath.slice(BASE.length);
  if (urlPath.endsWith('/')) urlPath += 'index.html';

  const file = path.join(ROOT, urlPath);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('403'); }

  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('404 ' + urlPath); }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(buf);
  });
}).listen(PORT, () => {
  console.log('Server laeuft: http://localhost:' + PORT + BASE);
});

