// Local static site + the same MCP handler Vercel deploys. No dependencies.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const handler = require('../api/mcp.js');
const root = path.resolve(__dirname, '../public');
const types = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.webp':'image/webp', '.png':'image/png', '.woff2':'font/woff2', '.ttf':'font/ttf', '.ics':'text/calendar'};
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (['/mcp','/api/mcp'].includes(url.pathname)) return await handler(req, res);
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
    let file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end('Not found'); }
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  } catch { if (!res.headersSent) res.writeHead(400); res.end('Invalid request'); }
}).listen(Number(process.env.PORT || 4320), '127.0.0.1', () => console.log('Local site: http://127.0.0.1:' + (process.env.PORT || 4320)));
