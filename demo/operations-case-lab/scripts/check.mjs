import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.filter(e => !['qa-artifacts', '.chrome-qa-profile'].includes(e.name)).map(e => e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)]));
  return nested.flat();
}
const all = await files(root);
const repo = path.resolve(root, '../..');
const scanFiles = [...all.filter(f => /\.(mjs|html|css|md|json|svg)$/.test(f)),
  path.join(repo, 'README.md'), path.join(repo, 'docs/INDEPENDENT-OPERATIONS-ENGINEERING.md'),
  path.join(repo, '.github/workflows/operations-case-lab.yml')];
const failures = [];
for (const file of all.filter(f => f.endsWith('.mjs'))) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) failures.push(`${path.relative(root, file)}: ${result.stderr}`);
}
const runtime = ['engine.mjs', 'app.mjs', 'index.html', 'styles.css', 'server.mjs'];
const patterns = [
  ['credential marker', /-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:gh[pousr]_[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{16})\b/],
  ['email-like data', /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
  ['phone-like data', /\+\d[\d ()-]{8,}\d/],
];
for (const file of scanFiles) {
  const source = await readFile(file, 'utf8');
  for (const [name, pattern] of patterns) {
    if (pattern.test(source)) failures.push(`${path.relative(root, file)}: ${name}`);
  }
}
for (const file of runtime) {
  const source = await readFile(path.join(root, file), 'utf8');
  if (/https?:\/\//.test(source.replaceAll('http://127.0.0.1:', ''))) failures.push(`${file}: non-loopback URL`);
  if (/\b(fetch|XMLHttpRequest|localStorage|sessionStorage|indexedDB|WebSocket|EventSource|getUserMedia)\b|document\.cookie|Math\.random|\bnew Date\b|Date\.now/.test(source)) failures.push(`${file}: prohibited runtime I/O, persistence or nondeterminism`);
}
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
if (new Set(ids).size !== ids.length) failures.push('Duplicate HTML IDs');
if (!html.includes('Independent synthetic operations proof — fictional records, not SMI production')) failures.push('Missing evidence boundary');
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
if (pkg.dependencies || pkg.devDependencies) failures.push('Unexpected dependencies');
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`PASS: syntax (${all.filter(f => f.endsWith('.mjs')).length} modules), HTML IDs, boundary, dependency policy; scoped credential/PII scan (${scanFiles.length} text files), runtime endpoint/persistence/nondeterminism scan (${runtime.length} files).`);
