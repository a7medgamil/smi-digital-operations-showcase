import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { createServer, HEADERS } from '../server.mjs';

test('static server access contract', async t => {
  const server = createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const address = server.address(); assert.equal(address.address, '127.0.0.1');
  function request(route, method = 'GET', host = `127.0.0.1:${address.port}`) {
    return new Promise((resolve, reject) => {
      const req = http.request({ hostname: '127.0.0.1', port: address.port, path: route, method, headers: { Host: host } }, res => {
        let body = ''; res.setEncoding('utf8'); res.on('data', chunk => body += chunk); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      }); req.on('error', reject); req.end();
    });
  }
  await t.test('five exact assets accessible, correct MIME, safe headers on every asset', async () => {
    for (const [route, type] of [['/', 'text/html'], ['/styles.css', 'text/css'], ['/app.mjs', 'text/javascript'], ['/engine.mjs', 'text/javascript'], ['/favicon.svg', 'image/svg+xml']]) {
      const result = await request(route); assert.equal(result.status, 200); assert.ok(result.body.length > 0);
      assert.ok(result.headers['content-type'].startsWith(type));
      for (const [name, value] of Object.entries(HEADERS)) assert.equal(result.headers[name.toLowerCase()], value);
    }
  });
  await t.test('HEAD serves same metadata without body', async () => { const result = await request('/', 'HEAD'); assert.equal(result.status, 200); assert.equal(result.body, ''); });
  await t.test('source docs, dotfiles, directories, traversal, query and encoded paths are denied', async () => {
    for (const route of ['/server.mjs', '/package.json', '/README.md', '/test/server.test.mjs', '/.git/config', '/../README.md', '/%2e%2e/README.md', '/%65ngine.mjs', '/engine.mjs?x=1', '//engine.mjs', '/demo/', '/favicon.ico']) {
      const result = await request(route); assert.equal(result.status, 404, route); assert.equal(result.body, 'Not found'); assert.equal(result.headers['cache-control'], 'no-store');
    }
  });
  await t.test('mutating and OPTIONS methods are denied', async () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) { const result = await request('/', method); assert.equal(result.status, 405); assert.equal(result.headers.allow, 'GET, HEAD'); }
  });
  await t.test('foreign and localhost Host values denied', async () => {
    for (const host of ['example.invalid', 'localhost:4173', '127.0.0.1.evil.invalid:4173']) assert.equal((await request('/', 'GET', host)).status, 403);
  });
});
