// Optional dependency-free Chrome QA. Always launches a new temporary profile.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { createServer } from '../server.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'qa-artifacts');
const chromePath = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profile = await mkdtemp(path.join(tmpdir(), 'operations-case-lab-chrome-'));
const server = createServer();
let chrome, socket;
const results = [];
const errors = [];
const outbound = [];
const pending = new Map();
let sequence = 0;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function call(method, params = {}) {
  if (process.env.BROWSER_QA_DEBUG) console.log(`CDP send: ${method}`);
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 10000);
    pending.set(id, { resolve: result => { clearTimeout(timer); resolve(result); }, reject: error => { clearTimeout(timer); reject(error); } });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function expect(expression, description) {
  assert.equal(await evaluate(expression), true, description); results.push(description);
}
async function click(selector) { await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`); }
async function set(id, value, event = 'change') {
  await evaluate(`(()=>{const el=document.getElementById(${JSON.stringify(id)});el.value=${JSON.stringify(value)};el.dispatchEvent(new Event(${JSON.stringify(event)},{bubbles:true}));})()`);
}
try {
  await mkdir(out, { recursive: true });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  chrome = spawn(chromePath, [
    '--headless=new', `--user-data-dir=${profile}`, '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1',
    '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--disable-component-update',
    '--disable-sync', '--disable-default-apps', '--disable-extensions', '--disable-crash-reporter',
    '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1', 'about:blank',
  ], { stdio: 'ignore', windowsHide: true });
  let launchError; chrome.on('error', error => { launchError = error; });
  let port;
  for (let i = 0; i < 100; i++) {
    if (launchError) throw launchError;
    try { port = Number((await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); break; } catch { await delay(100); }
  }
  assert.ok(port, 'Fresh Chrome debugging endpoint became available');
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await once(socket, 'open');
  socket.addEventListener('message', event => {
    if (process.env.BROWSER_QA_DEBUG) console.log(`CDP received: ${String(event.data).slice(0, 160)}`);
    const message = JSON.parse(event.data);
    if (message.id) {
      const item = pending.get(message.id); pending.delete(message.id);
      if (message.error) item?.reject(new Error(JSON.stringify(message.error))); else item?.resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
    if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') errors.push(message.params.entry.text);
    if (message.method === 'Network.requestWillBeSent') {
      const url = message.params.request.url;
      if (!url.startsWith(base + '/') && !url.startsWith('data:') && url !== 'about:blank') outbound.push(url);
    }
    if (message.method === 'Fetch.requestPaused') {
      const { requestId, request } = message.params;
      const method = request.url.startsWith(base + '/') || request.url.startsWith('data:') ? 'Fetch.continueRequest' : 'Fetch.failRequest';
      void call(method, method === 'Fetch.continueRequest' ? { requestId } : { requestId, errorReason: 'BlockedByClient' }).catch(error => errors.push(error.message));
    }
  });
  const version = await call('Browser.getVersion');
  await call('Runtime.enable'); await call('Page.enable'); await call('Network.enable'); await call('Log.enable');
  await call('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  for (const [width, height] of [[1440, 1000], [390, 844]]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await call('Page.navigate', { url: base + '/' });
    let ready = false;
    for (let i = 0; i < 100; i++) {
      if (await evaluate(`document.querySelectorAll('.case').length === 6`)) { ready = true; break; }
      await delay(50);
    }
    assert.ok(ready, 'UI loaded');
    await expect(`document.documentElement.scrollWidth <= innerWidth`, `${width}: no initial horizontal overflow`);
    await expect(`document.querySelector('#clock').textContent === 'V+0013m'`, `${width}: deterministic seed clock`);
    await expect(`document.querySelectorAll('.metric .value')[0].textContent === '6'`, `${width}: exact initial total`);
    await expect(`matchMedia('(prefers-reduced-motion: reduce)').matches`, `${width}: reduced-motion preference`);
    await click('#compete');
    const clock = await evaluate(`document.querySelector('#clock').textContent`);
    await click('[data-to="under-review"]');
    await expect(`document.querySelector('#notice').textContent.includes('Version conflict') && document.querySelector('#clock').textContent === ${JSON.stringify(clock)} && document.querySelectorAll('.timeline li').length === 2`, `${width}: stale action fails with coherent timeline and clock`);
    await click('#refresh-case'); await click('[data-to="approved"]');
    await expect(`document.querySelectorAll('.metric .value')[2].textContent === '2' && document.querySelectorAll('.timeline li').length === 3`, `${width}: approval changes metrics and audit`);
    await set('status-filter', 'needs-info'); await set('journey-filter', 'returning');
    await expect(`document.querySelectorAll('.case').length === 1 && document.querySelector('#detail-title').textContent === 'Demo 04'`, `${width}: active filters intersect and update selected detail`);
    await set('search', 'Demo 99', 'input');
    await expect(`document.querySelectorAll('.case').length === 0 && !document.querySelector('#detail-title')`, `${width}: empty filter clears hidden selected case`);
    await click('#reset'); await set('role', 'learner');
    await expect(`document.querySelector('#filters').disabled && document.querySelectorAll('[data-to]').length === 0 && !document.querySelector('#intake-fields').disabled`, `${width}: learner role gates staff controls`);
    await click('[data-followup="CASE-004"]');
    await expect(`document.querySelectorAll('[data-followup]').length === 0`, `${width}: learner synthetic evidence returns case to queue`);
    await click('#intake-form button[type="submit"]');
    await expect(`document.querySelector('#notice').textContent.includes('CASE-007 submitted')`, `${width}: new applicant submits`);
    const intakeClock = await evaluate(`document.querySelector('#clock').textContent`);
    await click('#intake-form button[type="submit"]');
    await expect(`document.querySelector('#clock').textContent === ${JSON.stringify(intakeClock)} && document.querySelector('#notice').textContent.includes('No duplicate')`, `${width}: repeated Submit safely reuses the draft key`);
    await click('#retry');
    await expect(`document.querySelector('#clock').textContent === ${JSON.stringify(intakeClock)} && document.querySelector('#notice').textContent.includes('No duplicate')`, `${width}: duplicate replay does not advance clock`);
    await click('#new-applicant'); await click('input[value="returning"]'); await click('#intake-form button[type="submit"]');
    await expect(`document.querySelector('#notice').textContent.includes('CASE-008 submitted') && document.querySelector('#receipt').textContent.includes('returning')`, `${width}: returning applicant submits distinct journey`);
    await set('role', 'staff');
    await expect(`document.querySelectorAll('.case').length === 8 && document.querySelectorAll('.metric .value')[0].textContent === '8'`, `${width}: queue and metrics use live synthetic records`);
    await click('[data-case="CASE-007"]'); await click('[data-to="under-review"]'); await click('[data-to="needs-info"]');
    await expect(`document.querySelectorAll('.timeline li').length === 3 && document.querySelector('.detail .badge').textContent === 'Needs info'`, `${width}: request-info action and audit work`);
    await click('[data-case="CASE-008"]'); await click('[data-to="under-review"]'); await click('[data-to="rejected"]');
    await expect(`document.querySelector('.detail .badge').textContent === 'Rejected' && document.querySelectorAll('[data-to]').length === 0`, `${width}: rejection closes case`);
    await evaluate(`document.getElementById('role').focus()`);
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await expect(`document.activeElement.id === 'reset' && getComputedStyle(document.activeElement).outlineStyle !== 'none'`, `${width}: keyboard tab flow and visible focus`);
    await expect(`document.documentElement.scrollWidth <= innerWidth`, `${width}: no overflow after all interactions`);
    await click('#reset');
    await evaluate('window.scrollTo(0,0)');
    const screenshot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    await writeFile(path.join(out, `operations-${width}.png`), Buffer.from(screenshot.data, 'base64'));
  }
  assert.deepEqual(errors, [], 'No browser runtime or console errors');
  assert.deepEqual(outbound, [], 'No page outbound requests');
  const report = { result: 'PASS', browser: version.product, node: process.version, viewports: ['1440x1000', '390x844'], freshTemporaryProfile: true, reducedMotion: true, assertions: results, browserErrors: errors, pageOutboundRequests: outbound, scope: 'Page network monitored and non-loopback page requests blocked. Chrome process background traffic is not a packet capture.' };
  await writeFile(path.join(out, 'browser-results.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`PASS: ${results.length} browser assertions; ${version.product}; fresh temporary Chrome profile; 2 screenshots; no page outbound requests or browser errors.`);
} catch (error) {
  await mkdir(out, { recursive: true });
  await writeFile(path.join(out, 'browser-results.json'), JSON.stringify({ result: 'FAIL_OR_BLOCKED', error: error.stack, assertionsCompleted: results, browserErrors: errors, pageOutboundRequests: outbound }, null, 2) + '\n');
  console.error(error); process.exitCode = 1;
} finally {
  if (socket?.readyState === WebSocket.OPEN) { try { await call('Browser.close'); } catch { /* Chrome may close the socket before replying. */ } }
  socket?.close();
  if (chrome && chrome.exitCode === null) { chrome.kill(); await Promise.race([once(chrome, 'exit'), delay(2000)]); }
  await new Promise(resolve => server.close(resolve));
  // Only delete the exact temporary profile created above, after checking its boundary.
  const parent = path.resolve(tmpdir());
  if (path.dirname(path.resolve(profile)) === parent && path.basename(profile).startsWith('operations-case-lab-chrome-')) {
    try { await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); }
    catch (error) { console.error(`Temporary profile cleanup failed: ${error.message}`); process.exitCode = 1; }
  }
}
