const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};
http
  .createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    const relative = path.relative(root, file);
    if (
      !['GET', 'HEAD'].includes(req.method) ||
      relative.startsWith('..') ||
      path.isAbsolute(relative) ||
      !/^(?:index\.html|login\.html|signup\.html|dashboard\.html|staff\.html|(?:journey|assets)[\\/].+)$/.test(
        relative,
      )
    ) {
      res.writeHead(404).end();
      return;
    }
    fs.readFile(file, (error, body) => {
      if (error) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, {
        'Content-Type': types[path.extname(file)] || 'application/octet-stream',
      });
      res.end(req.method === 'HEAD' ? undefined : body);
    });
  })
  .listen(Number(process.env.PORT || 3000), '127.0.0.1', () =>
    console.log('Static preview: http://localhost:' + (process.env.PORT || 3000)),
  );
