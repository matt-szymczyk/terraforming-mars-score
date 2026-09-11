import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve(process.env.SITE_DIRECTORY || 'site');
const base = '/terraforming-mars-score/';
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === base.slice(0, -1) || url.pathname === '/') {
      response.writeHead(302, { location: base }).end();
      return;
    }
    if (!url.pathname.startsWith(base)) throw new Error('Not found');
    const path = resolve(root, '.' + decodeURIComponent(url.pathname.slice(base.length - 1)), url.pathname.endsWith('/') ? 'index.html' : '');
    if (!path.startsWith(root + sep)) throw new Error('Not found');
    const body = await readFile(path);
    response.writeHead(200, { 'content-type': mime[extname(path)] || 'application/octet-stream', 'cache-control': 'no-store' }).end(body);
  } catch { response.writeHead(404).end('Not found'); }
});
server.listen(Number(process.env.PORT || 4173), '127.0.0.1', () => console.log('Local: http://127.0.0.1:' + server.address().port + base));
