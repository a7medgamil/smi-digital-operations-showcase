import { seededState, execute, queue, metrics, allowedActions, REASONS, stamp } from './engine.mjs';

const $ = id => document.getElementById(id);
const label = status => ({ submitted: 'Submitted', 'under-review': 'Under review', approved: 'Approved', 'needs-info': 'Needs info', rejected: 'Rejected' })[status];
const actionLabel = to => ({ 'under-review': 'Start review', approved: 'Approve', 'needs-info': 'Request info', rejected: 'Reject', submitted: 'Add synthetic evidence' })[to];
const badge = status => `<span class="badge ${status}">${label(status)}</span>`;
let state = seededState();
let role = 'staff';
let selected = 'CASE-001';
let snapshot = null;
let lastIntake = null;
let nextKey = 8;
let draftKey = 'intake-7';
let draftSubmitted = false;
const errors = {
  FORBIDDEN: 'This simulated role cannot perform that action. Switch roles to continue.',
  VERSION_CONFLICT: 'Version conflict: another simulated reviewer changed this case. Nothing was written. Refresh the case before deciding.',
  INVALID_TRANSITION: 'This state no longer allows that decision. Nothing was written. Refresh the case.',
  IDEMPOTENCY_CONFLICT: 'This intake key already belongs to a different journey. Nothing was written.',
};
function notice(message, error = false) {
  $('notice').textContent = message;
  $('notice').classList.toggle('error', error);
}
function send(command, success, keepSnapshot = false) {
  const result = execute(state, command);
  if (!result.ok) { notice(errors[result.code] ?? `${result.code}: no change was made.`, true); return result; }
  state = result.state;
  if (!keepSnapshot) snapshot = null;
  notice(typeof success === 'function' ? success(result) : success);
  render();
  return result;
}
function filters() { return { status: $('status-filter').value, journey: $('journey-filter').value, search: $('search').value }; }
function renderMetrics() {
  const m = metrics(state, role);
  if (!m.ok) { $('metrics').innerHTML = '<p class="metric-private">Queue metrics are available in the simulated staff role. Switch to Staff to inspect all fictional records.</p>'; return; }
  const entries = [ ['All cases', m.total, 'Fictional intake records'], ['Open work', m.open, 'Submitted + review + needs info'], ['Approved', m.counts.approved, 'Synthetic decisions only'], ['Resolved', m.resolved, `${m.counts.approved} approved · ${m.counts.rejected} rejected`] ];
  $('metrics').innerHTML = entries.map(([title, value, hint]) => `<div class="metric"><span class="label">${title}</span><strong class="value">${value}</strong><small>${hint}</small></div>`).join('');
}
function renderQueue() {
  const result = queue(state, role, filters());
  $('filters').disabled = role !== 'staff';
  $('queue-count').textContent = result.ok ? `${result.records.length} / ${state.cases.length}` : 'Staff role';
  if (!result.ok) {
    $('queue').innerHTML = '<p class="empty">Switch to Staff to open the review queue.</p>';
    $('detail').innerHTML = '<p class="empty">Staff decisions are gated by the domain engine.</p>';
    return;
  }
  // A hidden record must never remain selected after an active filter changes.
  if (!result.records.some(c => c.id === selected)) { selected = result.records[0]?.id ?? null; snapshot = null; }
  $('queue').innerHTML = result.records.length ? result.records.map(c => `<button class="case" data-case="${c.id}" aria-pressed="${c.id === selected}"><span class="case-top"><strong>${c.name}</strong><small>${c.id}</small></span><span class="case-bottom">${badge(c.status)}<span>${c.journey === 'new' ? 'New' : 'Returning'}</span></span></button>`).join('') : '<p class="empty">No fictional cases match these filters. Change a filter to see more.</p>';
  renderDetail();
}
function renderDetail() {
  const current = state.cases.find(c => c.id === selected);
  if (!current) { $('detail').innerHTML = '<p class="empty">Select a matching case to inspect its audit trail.</p>'; return; }
  if (!snapshot || snapshot.id !== selected) snapshot = { ...current };
  const stale = snapshot.version !== current.version;
  const actions = allowedActions(role, snapshot.status);
  const events = state.audit.filter(e => e.caseId === selected);
  $('detail').innerHTML = `<div class="identity"><span class="eyebrow">CASE FILE</span>${badge(snapshot.status)}</div><h3 tabindex="-1" id="detail-title">${snapshot.name}</h3><p class="meta">${snapshot.id} · ${snapshot.journey === 'new' ? 'New applicant' : 'Returning applicant'}<br>Captured version <strong>v${snapshot.version}</strong> · created ${stamp(snapshot.createdTick)}</p><p class="small">${snapshot.journey === 'new' ? 'Starter' : 'Continuation'} checklist: fixed synthetic criteria only.</p>
    ${stale ? '<p class="experiment">Snapshot is stale. A competing review was accepted. Your next decision will test version protection.</p>' : ''}
    <div class="actions">${actions.map(a => `<button data-to="${a.to}" data-reason="${a.reason}" class="${a.to === 'rejected' ? '' : 'primary'}">${actionLabel(a.to)}</button>`).join('') || '<p class="small">No staff action available. Terminal cases stay closed; needs-info awaits a learner response.</p>'}</div>
    <button id="refresh-case" class="quiet full">Refresh case snapshot</button>
    ${snapshot.status === 'submitted' && !stale ? '<div class="experiment">Try optimistic concurrency: move this case in another simulated review while holding your snapshot.<button id="compete">Simulate competing review</button></div>' : ''}
    <hr><h3 class="timeline-title">Audit timeline</h3><p class="small">Accepted events only · virtual minutes</p><ol class="timeline">${events.map(e => `<li><strong>${label(e.to)}</strong><small>${e.at} · ${e.role} · v${e.version}</small><small>${REASONS[e.reason] ?? 'Fictional intake submitted'}</small></li>`).join('')}</ol>`;
}
function renderFollowup() {
  $('learner-followup').hidden = role !== 'learner';
  $('followup-cases').innerHTML = state.cases.filter(c => c.status === 'needs-info').map(c => `<button data-followup="${c.id}">${c.name} · Add synthetic evidence</button>`).join('') || '<p class="small">No needs-info cases are waiting.</p>';
}
function render() {
  $('clock').textContent = stamp(state.tick);
  $('intake-fields').disabled = role !== 'learner';
  for (const radio of document.querySelectorAll('input[name=journey]')) radio.disabled = draftSubmitted;
  $('new-applicant').disabled = role !== 'learner' || !draftSubmitted;
  $('intake-role-help').textContent = role !== 'learner' ? 'Switch to Learner to submit an intake.' : draftSubmitted ? 'Submitted. Repeating Submit safely replays this draft. Start another fictional applicant for a new case.' : 'Ready to generate a fictional record. No contact details are accepted.';
  $('retry').disabled = role !== 'learner' || !lastIntake;
  $('receipt').textContent = lastIntake ? `${lastIntake.key} · ${lastIntake.journey} journey` : 'No submission in this session yet.';
  renderMetrics(); renderQueue(); renderFollowup();
}
$('role').addEventListener('change', () => { role = $('role').value; snapshot = null; render(); notice(`Simulated ${role} role active. Permissions are enforced in the domain engine.`); });
$('reset').addEventListener('click', () => {
  state = seededState(); selected = 'CASE-001'; snapshot = null; lastIntake = null; nextKey = 8; draftKey = 'intake-7'; draftSubmitted = false;
  $('intake-form').reset();
  $('journey-help').textContent = 'New: a synthetic starter checklist will be reviewed.';
  $('status-filter').value = 'all'; $('journey-filter').value = 'all'; $('search').value = '';
  render(); notice('Simulation reset to the same six fictional cases and virtual clock.');
});
$('intake-form').addEventListener('change', () => { $('journey-help').textContent = document.querySelector('input[name=journey]:checked').value === 'new' ? 'New: a synthetic starter checklist will be reviewed.' : 'Returning: a synthetic continuation checklist will be reviewed. No real prior record is retrieved.'; });
$('intake-form').addEventListener('submit', event => {
  event.preventDefault();
  const command = { type: 'submit', role, key: draftKey, journey: document.querySelector('input[name=journey]:checked').value };
  const result = send(command, r => r.replayed ? `Replay accepted: ${r.caseId} already exists. No duplicate case, event or clock advance.` : `${r.caseId} submitted. A fictional name and one audit event were generated.`);
  if (result.ok) { draftSubmitted = true; lastIntake = command; selected = result.caseId; render(); }
});
$('new-applicant').addEventListener('click', () => {
  draftKey = `intake-${nextKey++}`; draftSubmitted = false; render();
  notice(`New fictional draft ready with key ${draftKey}. Choose a journey and submit.`);
  document.querySelector('input[name=journey]:checked').focus();
});
$('retry').addEventListener('click', () => { if (lastIntake) send({ ...lastIntake, role }, r => `Replay accepted: ${r.caseId} already exists. No duplicate case, event or clock advance.`); });
for (const id of ['status-filter', 'journey-filter', 'search']) $(id).addEventListener(id === 'search' ? 'input' : 'change', () => { snapshot = null; renderQueue(); });
$('queue').addEventListener('click', event => { const button = event.target.closest('[data-case]'); if (button) { selected = button.dataset.case; snapshot = null; renderQueue(); $('detail-title')?.focus(); } });
$('detail').addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || !snapshot) return;
  if (button.id === 'refresh-case') { snapshot = null; renderDetail(); notice('Case snapshot refreshed to the current version.'); $('detail-title')?.focus(); return; }
  if (button.id === 'compete') {
    send({ type: 'transition', role, caseId: snapshot.id, expectedVersion: snapshot.version, to: 'under-review', reason: 'review-started' }, 'Competing review accepted. Your captured version is held; try Start review to see an atomic conflict.', true);
    $('detail-title')?.focus(); return;
  }
  if (button.dataset.to) {
    send({ type: 'transition', role, caseId: snapshot.id, expectedVersion: snapshot.version, to: button.dataset.to, reason: button.dataset.reason }, 'Decision accepted. Version, virtual clock and audit timeline updated together.');
    $('detail-title')?.focus();
  }
});
$('followup-cases').addEventListener('click', event => {
  const button = event.target.closest('[data-followup]');
  if (!button) return;
  const record = state.cases.find(c => c.id === button.dataset.followup);
  send({ type: 'transition', role, caseId: record.id, expectedVersion: record.version, to: 'submitted', reason: 'evidence-added' }, 'Fixed synthetic evidence added. Case returned to Submitted for a fresh review.');
  $('followup-title').tabIndex = -1; $('followup-title').focus();
});
render();
