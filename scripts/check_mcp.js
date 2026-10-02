const assert = require('node:assert/strict');
const http = require('node:http');
const handler = require('../api/mcp.js');
const { alumni } = require('../public/alumni.json');
async function main() {
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/mcp`;
  const headers = {'Content-Type':'application/json', Accept:'application/json, text/event-stream'};
  const post = (msg, extra = {}) => fetch(url, {method:'POST',headers:{...headers,...extra},body: typeof msg === 'string' ? msg : JSON.stringify(msg)});
  const rpc = async (method, params={}) => (await post({jsonrpc:'2.0',id:1,method,params})).json();
  const tool = async (name,args) => (await rpc('tools/call',{name,arguments:args})).result;
  try {
    assert.equal((await rpc('initialize',{protocolVersion:'2025-11-25'})).result.protocolVersion,'2025-11-25');
    assert.equal((await rpc('initialize',{protocolVersion:'unknown'})).result.protocolVersion,'2025-11-25');
    assert.equal((await rpc('tools/list')).result.tools.length,3);
    const result=JSON.parse((await tool('search_people',{query:'gedmark'})).content[0].text);
    assert(result.people.some(p=>p.id==='john-gedmark'));
    const person=JSON.parse((await tool('get_person',{id:'john-gedmark'})).content[0].text);
    assert.equal(person.source_url,alumni.find(p=>p.id===person.id).source_url);
    let total=0;
    for(const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      const data=JSON.parse((await tool('browse_volume',{letter})).content[0].text);total+=data.total;
    }
    assert.equal(total,alumni.length);
    assert((await tool('search_people',{query:[]})).isError);
    assert((await tool('search_people',null)).isError);
    assert((await tool('browse_volume',{letter:'A',offset:-1})).isError);
    assert((await tool('get_person',{id:'not-a-person'})).isError);
    assert.equal((await rpc('no-such-method')).error.code,-32601);
    assert.equal((await post('{')).status,400);
    assert.equal((await post([])).status,400);
    assert.equal((await post({jsonrpc:'2.0',id:1,method:'tools/call',params:null})).status,200);
    assert.equal((await post({jsonrpc:'2.0',method:'notifications/initialized'})).status,202);
    assert.equal((await post({jsonrpc:'2.0',id:1,result:{}})).status,202);
    assert.equal((await post({jsonrpc:'2.0',id:1,method:'ping'},{Origin:'https://evil.example'})).status,403);
    assert.equal((await post({jsonrpc:'2.0',id:1,method:'ping'},{'Mcp-Protocol-Version':'nope'})).status,400);
    assert.equal((await post(' '.repeat(70000))).status,413);
    assert.equal((await fetch(url)).status,405);
    console.log(`MCP checks passed; all ${total} people reachable across 26 volumes.`);
  } finally { server.closeAllConnections(); await new Promise(resolve=>server.close(resolve)); }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
