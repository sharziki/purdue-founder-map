'use strict';
// Stateless MCP server (Streamable HTTP, JSON responses) over the public alumni export.
const { alumni } = require('../public/alumni.json');

const SITE = 'https://purdue-founder-map.vercel.app';
const VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26'];
const SUFFIX = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'phd', 'md', 'mba', 'pe', 'dds', 'esq', 'cpa', 'dvm', 'pharmd']);
const MAX_BODY = 64 * 1024;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const KINDS = ['Founder', 'Investor', 'Operator'];

const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function surname(name) {
  const toks = name.replace(/\(.*?\)/g, ' ').replace(/".*?"/g, ' ').split(/[\s,]+/).filter(Boolean);
  while (toks.length > 1 && SUFFIX.has(toks[toks.length - 1].toLowerCase().replace(/\./g, ''))) toks.pop();
  return toks.pop() || name;
}

const shelf = alumni.map(p => {
  const last = surname(p.name);
  return {
    p, last: fold(last),
    letter: (fold(last).replace(/[^a-z]/g, '')[0] || fold(p.name).replace(/[^a-z]/g, '')[0] || 'x').toUpperCase(),
    name: fold(p.name),
    hay: fold([p.name, p.organization, p.role, p.region, p.kind, p.connection, (p.tags || []).join(' '), p.company_sector, p.company, p.why_relevant].join(' ')),
  };
}).sort((a, b) => a.last.localeCompare(b.last) || a.name.localeCompare(b.name));
const byId = new Map(shelf.map(s => [s.p.id, s]));

const card = s => ({
  id: s.p.id, name: s.p.name, role: s.p.role, organization: s.p.organization, kind: s.p.kind,
  region: s.p.region, purdue: s.p.connection, volume: s.letter,
  page: `${SITE}/library?person=${encodeURIComponent(s.p.id)}`, source: s.p.source_url,
});

const TOOLS = [
  {
    name: 'search_people',
    title: 'Search the Purdue Founder Map',
    description: `Search ${alumni.length.toLocaleString('en-US')} public, source-backed Purdue founders, investors and operators by name, company, role, field, place or tag. Every word must match. Returns short cards; call get_person with an id for the full entry and its sources.`,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Words to match, e.g. "satellite founder", "Notion", "Chicago investor".' },
        kind: { type: 'string', enum: KINDS, description: 'Optional: only founders, investors or operators.' },
        limit: { type: 'integer', minimum: 1, maximum: 25, default: 10 },
      },
      required: ['query'],
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'get_person',
    title: 'Open an entry',
    description: 'Return the full public record for one person: roles, Purdue connection, education, company and funding facts, highlights, and the source URL behind each claim. Roles can be historical; role_as_of gives the source year.',
    inputSchema: { type: 'object', properties: { id: { type: 'string', description: 'The id from search_people or browse_volume.' } }, required: ['id'] },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'browse_volume',
    title: 'Browse a volume',
    description: 'List everyone shelved under one surname letter, A to Z, in surname order.',
    inputSchema: {
      type: 'object',
      properties: {
        letter: { type: 'string', pattern: '^[A-Za-z]$', description: 'A single letter.' },
        offset: { type: 'integer', minimum: 0, default: 0 },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
      },
      required: ['letter'],
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
];

const clamp = (n, lo, hi, d) => (Number.isFinite(+n) ? Math.min(hi, Math.max(lo, Math.floor(+n))) : d);
const text = data => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 1) }] });
const fail = message => ({ content: [{ type: 'text', text: message }], isError: true });

function callTool(name, args = {}) {
  if (!object(args)) return fail('arguments must be an object.');
  if (args.limit !== undefined && (!Number.isInteger(args.limit) || args.limit < 1 || args.limit > (name === 'browse_volume' ? 100 : 25))) return fail('limit is outside the supported range.');
  if (name === 'search_people') {
    if (typeof args.query !== 'string' || args.query.length > 500) return fail('query must be a string of at most 500 characters.');
    const toks = fold(args.query).split(/\s+/).filter(Boolean);
    if (!toks.length) return fail('query is required.');
    if (args.kind && !KINDS.includes(args.kind)) return fail(`kind must be one of ${KINDS.join(', ')}.`);
    const first = toks[0];
    const hits = shelf.filter(s => (!args.kind || s.p.kind === args.kind) && toks.every(t => s.hay.includes(t)))
      .map(s => [s, s.last.startsWith(first) ? 0 : s.name.startsWith(first) ? 1 : s.name.includes(first) ? 2 : fold(s.p.organization).includes(first) ? 3 : 4])
      .sort((a, b) => a[1] - b[1]).map(([s]) => s);
    const limit = clamp(args.limit, 1, 25, 10);
    return text({ total: hits.length, showing: Math.min(limit, hits.length), people: hits.slice(0, limit).map(card) });
  }
  if (name === 'get_person') {
    if (typeof args.id !== 'string') return fail('id must be a string.');
    const s = byId.get(String(args.id || ''));
    if (!s) return fail(`No entry with id "${args.id}". Use search_people to find one.`);
    return text({ ...s.p, volume: s.letter, page: card(s).page, note: 'Public sources only. A listing does not imply availability for introductions; check the source before outreach.' });
  }
  if (name === 'browse_volume') {
    if (typeof args.letter !== 'string') return fail('letter must be a string.');
    if (args.offset !== undefined && (!Number.isInteger(args.offset) || args.offset < 0)) return fail('offset must be a nonnegative integer.');
    const letter = String(args.letter || '').toUpperCase();
    if (!/^[A-Z]$/.test(letter)) return fail('letter must be a single letter A to Z.');
    const vol = shelf.filter(s => s.letter === letter);
    const offset = clamp(args.offset, 0, 1e6, 0), limit = clamp(args.limit, 1, 100, 50);
    return text({
      volume: letter, total: vol.length, offset,
      people: vol.slice(offset, offset + limit).map(s => ({ id: s.p.id, name: s.p.name, organization: s.p.organization, kind: s.p.kind })),
    });
  }
  return null;
}

const ok = (id, result) => ({ jsonrpc: '2.0', id, result });
const err = (id, code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });

function handle(msg) {
  if (!object(msg) || msg.jsonrpc !== '2.0') return err(null, -32600, 'Invalid request');
  const id = msg.id;
  if (id !== undefined && typeof id !== 'string' && !(typeof id === 'number' && Number.isFinite(id))) return err(null, -32600, 'Invalid request id');
  if (typeof msg.method !== 'string') {
    if (id !== undefined && ('result' in msg || object(msg.error))) return null;
    return err(id ?? null, -32600, 'method is required');
  }
  if (msg.params !== undefined && !object(msg.params)) return err(id ?? null, -32602, 'params must be an object');
  const { method, params = {} } = msg;
  if (id === undefined) return null;
  switch (method) {
    case 'initialize':
      if (typeof params.protocolVersion !== 'string') return err(id, -32602, 'protocolVersion is required');
      return ok(id, {
        protocolVersion: VERSIONS.includes(params.protocolVersion) ? params.protocolVersion : VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'purdue-founder-map', title: 'Purdue Founder Map', version: '1.0.0', websiteUrl: `${SITE}/library` },
        instructions: 'An independent, open-source directory of Purdue founders, investors and operators built from public sources. Search first, then open entries by id. Cite source URLs, and treat roles as of the year given.',
      });
    case 'ping':
      return ok(id, {});
    case 'tools/list':
      return ok(id, { tools: TOOLS });
    case 'tools/call': {
      if (typeof params.name !== 'string') return err(id, -32602, 'Tool name is required');
      const result = callTool(params.name, params.arguments === undefined ? {} : params.arguments);
      return result ? ok(id, result) : err(id, -32602, `Unknown tool: ${params.name}`);
    }
    default:
      return err(id, -32601, `Method not found: ${method}`);
  }
}

async function readBody(req) {
  const tooLarge = () => { const error = new Error('Request body too large'); error.status = 413; throw error; };
  if (req.body !== undefined) {
    const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(raw) > MAX_BODY) tooLarge();
    return JSON.parse(raw);
  }
  const chunks = []; let bytes = 0;
  for await (const c of req) { bytes += c.length; if (bytes > MAX_BODY) tooLarge(); chunks.push(c); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function send(res, status, body) {
  res.statusCode = status;
  if (body === undefined) return res.end();
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin;
  const origins = new Set([SITE, 'https://claude.ai']);
  if (process.env.VERCEL_URL) origins.add('https://' + process.env.VERCEL_URL);
  let allowed = !origin || origins.has(origin);
  if (!allowed && process.env.NODE_ENV !== 'production') {
    try { const u = new URL(origin); allowed = u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname); } catch {}
  }
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'Origin');
  if (!allowed) return send(res, 403, err(null, -32000, 'Origin not allowed'));
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Mcp-Protocol-Version');
  if (req.method === 'OPTIONS') return send(res, 204);
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return send(res, 405, err(null, -32000, 'Use an MCP client to POST JSON-RPC to this endpoint.'));
  }
  if (req.headers['mcp-protocol-version'] && !VERSIONS.includes(req.headers['mcp-protocol-version'])) return send(res, 400, err(null, -32000, 'Unsupported protocol version'));
  if (!(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) return send(res, 415, err(null, -32000, 'Content-Type must be application/json'));
  const accept = req.headers.accept || '';
  if (!accept.includes('application/json') || !accept.includes('text/event-stream')) return send(res, 406, err(null, -32000, 'Accept must include application/json and text/event-stream'));
  let body;
  try { body = await readBody(req); } catch (e) { return send(res, e.status || 400, err(null, e.status ? -32600 : -32700, e.status ? e.message : 'Parse error')); }
  if (!object(body)) return send(res, 400, err(null, -32600, 'Expected one JSON-RPC message'));
  const reply = handle(body);
  if (!reply) return send(res, 202);
  return send(res, reply.error?.code === -32600 ? 400 : 200, reply);
};

module.exports.handle = handle;
