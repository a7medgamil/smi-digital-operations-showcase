import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, execute, allowedActions, metrics, queue, seededState, STATUSES, stamp } from '../engine.mjs';

const intake = (extra = {}) => ({ type: 'submit', role: 'learner', key: 'intake-1', journey: 'new', ...extra });
const move = (state, to, reason, extra = {}) => execute(state, { type: 'transition', role: 'staff', caseId: state.cases[0].id, expectedVersion: state.cases[0].version, to, reason, ...extra });
const submitted = () => execute(initialState(), intake()).state;
const reviewing = () => move(submitted(), 'under-review', 'review-started').state;
const freeze = value => { Object.freeze(value); for (const item of Object.values(value)) if (item && typeof item === 'object') freeze(item); return value; };
function unchanged(state, command, code) {
  const before = JSON.stringify(state);
  const result = execute(freeze(state), command);
  assert.equal(result.ok, false); assert.equal(result.code, code);
  assert.equal(result.state, state); assert.equal(JSON.stringify(state), before);
}

test('new intake generates only a synthetic name, exact state and event', () => {
  const state = execute(initialState(), intake()).state;
  assert.deepEqual(state.cases[0], { id: 'CASE-001', name: 'Demo 01', journey: 'new', status: 'submitted', version: 1, createdTick: 1, updatedTick: 1 });
  assert.deepEqual(state.audit[0], { sequence: 1, at: 'V+0001m', caseId: 'CASE-001', role: 'learner', from: null, to: 'submitted', reason: 'intake-submitted', version: 1 });
});
test('returning journey is distinct, with no prior real record lookup', () => {
  const state = execute(initialState(), intake({ journey: 'returning' })).state;
  assert.equal(state.cases[0].journey, 'returning'); assert.equal(state.cases[0].status, 'submitted');
});
test('exact replay preserves state identity, clock, version and audit', () => {
  const state = freeze(submitted()); const result = execute(state, intake());
  assert.equal(result.state, state); assert.equal(result.replayed, true); assert.equal(result.caseId, 'CASE-001');
});
test('replay after terminal decision still returns original case', () => {
  const state = move(reviewing(), 'approved', 'criteria-met').state;
  assert.equal(execute(state, intake()).state, state);
});
test('same key with changed payload conflicts atomically', () => unchanged(submitted(), intake({ journey: 'returning' }), 'IDEMPOTENCY_CONFLICT'));
test('distinct keys generate distinct cases even for same journey', () => {
  const state = execute(submitted(), intake({ key: 'intake-2' })).state;
  assert.equal(state.cases.length, 2); assert.equal(state.cases[1].name, 'Demo 02');
});
for (const role of ['staff', 'admin', '', null]) test(`${String(role)} cannot submit as learner`, () => unchanged(initialState(), intake({ role }), 'FORBIDDEN'));
for (const extra of [{ journey: 'other' }, { key: '' }, { key: 'not-an-intake-key' }, { key: 1 }, { contact: 'not accepted' }]) {
  test(`intake rejects non-schema input ${JSON.stringify(extra)}`, () => unchanged(initialState(), intake(extra), 'INVALID_INTAKE'));
}
test('unknown and malformed commands reject without mutation', () => {
  for (const command of [null, [], {}, { type: 'erase', role: 'staff' }]) {
    const state = freeze(submitted()); assert.equal(execute(state, command).ok, false); assert.equal(execute(state, command).state, state);
  }
});
test('staff starts review then approves with exact version progression', () => {
  const state = move(freeze(reviewing()), 'approved', 'criteria-met').state;
  assert.equal(state.cases[0].version, 3); assert.equal(state.cases[0].status, 'approved'); assert.equal(state.tick, 3);
});
test('learner cannot review even by calling the engine directly', () => {
  const state = submitted(); const before = JSON.stringify(state);
  const result = move(freeze(state), 'under-review', 'review-started', { role: 'learner' });
  assert.equal(result.code, 'FORBIDDEN'); assert.equal(result.state, state); assert.equal(JSON.stringify(state), before);
});
test('role and status permission matrix has exactly the documented actions', () => {
  const expected = { submitted: ['under-review'], 'under-review': ['approved', 'needs-info', 'rejected'], approved: [], 'needs-info': [], rejected: [] };
  for (const status of STATUSES) {
    assert.deepEqual(allowedActions('staff', status).map(a => a.to), expected[status]);
    assert.deepEqual(allowedActions('learner', status).map(a => a.to), status === 'needs-info' ? ['submitted'] : []);
    assert.deepEqual(allowedActions('admin', status), []);
  }
  assert.deepEqual(allowedActions('staff', 'constructor'), []);
});
test('every matrix-advertised action executes for its role and rejects the other role', () => {
  const base = reviewing();
  const states = [submitted(), base, ...['approved', 'needs-info', 'rejected'].map(to => move(base, to, ({ approved: 'criteria-met', 'needs-info': 'evidence-missing', rejected: 'criteria-not-met' })[to]).state)];
  for (const state of states) for (const role of ['staff', 'learner']) for (const action of allowedActions(role, state.cases[0].status)) {
    assert.equal(move(freeze(state), action.to, action.reason, { role }).ok, true);
    assert.equal(move(state, action.to, action.reason, { role: role === 'staff' ? 'learner' : 'staff' }).code, 'FORBIDDEN');
  }
});
test('cannot skip review or use unknown/prototype status', () => {
  for (const to of ['approved', 'made-up', 'constructor', '__proto__']) {
    const state = submitted(); assert.equal(move(freeze(state), to, 'criteria-met').code, 'INVALID_TRANSITION'); assert.equal(state.tick, 1);
  }
});
test('both terminal outcomes refuse every outgoing state atomically', () => {
  for (const [to, reason] of [['approved', 'criteria-met'], ['rejected', 'criteria-not-met']]) {
    const state = freeze(move(reviewing(), to, reason).state);
    for (const target of STATUSES) { const result = move(state, target, reason); assert.equal(result.code, 'INVALID_TRANSITION'); assert.equal(result.state, state); }
  }
});
test('needs-info accepts only learner evidence and returns to submitted', () => {
  const state = move(reviewing(), 'needs-info', 'evidence-missing').state;
  assert.equal(move(state, 'submitted', 'evidence-added').code, 'FORBIDDEN');
  const result = move(state, 'submitted', 'evidence-added', { role: 'learner' });
  assert.equal(result.state.cases[0].status, 'submitted'); assert.equal(result.state.cases[0].version, 4);
  assert.equal(move(result.state, 'under-review', 'review-started').ok, true);
});
test('invalid decision reason fails atomically', () => {
  const state = reviewing(); unchanged(state, { type: 'transition', role: 'staff', caseId: 'CASE-001', expectedVersion: 2, to: 'approved', reason: 'evidence-missing' }, 'INVALID_REASON');
});
test('compare-and-swap rejects a stale reviewer without partial updates', () => {
  const state = reviewing();
  const command = { type: 'transition', role: 'staff', caseId: 'CASE-001', expectedVersion: 2, to: 'approved', reason: 'criteria-met' };
  const accepted = execute(state, command); unchanged(accepted.state, command, 'VERSION_CONFLICT');
});
test('invalid versions cannot bypass comparison', () => {
  for (const expectedVersion of ['1', 0, -1, 1.5, NaN, Infinity]) assert.equal(move(submitted(), 'under-review', 'review-started', { expectedVersion }).code, 'VERSION_CONFLICT');
});
test('unknown case fails atomically', () => {
  const state = submitted(); const result = move(freeze(state), 'under-review', 'review-started', { caseId: 'CASE-999' });
  assert.equal(result.code, 'NOT_FOUND'); assert.equal(result.state, state);
});
test('accepted commands never mutate their input, including nested arrays', () => {
  const state = freeze(submitted()); const before = JSON.stringify(state);
  const next = move(state, 'under-review', 'review-started').state;
  assert.equal(JSON.stringify(state), before); assert.notEqual(next, state); assert.equal(state.audit.length, 1); assert.equal(next.audit.length, 2);
});
test('two independent engines have independent deterministic clocks', () => {
  const left = move(submitted(), 'under-review', 'review-started').state; const right = initialState();
  assert.equal(left.tick, 2); assert.equal(right.tick, 0); assert.deepEqual(seededState(), seededState());
  assert.equal(stamp(10001), 'V+10001m');
});
test('seed has exact status metrics, with open plus resolved equal total', () => {
  assert.deepEqual(metrics(seededState(), 'staff'), { ok: true, total: 6, counts: { submitted: 2, 'under-review': 1, approved: 1, 'needs-info': 1, rejected: 1 }, open: 4, resolved: 2 });
  assert.equal(metrics(initialState(), 'staff').total, 0);
});
test('queue and metrics reject all roles other than staff', () => {
  for (const role of ['learner', 'admin', null]) { assert.equal(queue(seededState(), role).code, 'FORBIDDEN'); assert.equal(metrics(seededState(), role).code, 'FORBIDDEN'); }
});
test('active status, journey and search filters intersect; input order is stable', () => {
  const state = freeze(seededState());
  assert.deepEqual(queue(state, 'staff', { status: 'submitted' }).records.map(c => c.id), ['CASE-001', 'CASE-006']);
  assert.deepEqual(queue(state, 'staff', { status: 'submitted', journey: 'returning', search: '  demo 06 ' }).records.map(c => c.id), ['CASE-006']);
  assert.equal(queue(state, 'staff', { search: 'case-004' }).records[0].name, 'Demo 04');
  assert.equal(queue(state, 'staff', { status: 'approved', journey: 'returning' }).records.length, 0);
  assert.equal(queue(state, 'staff', { status: 'unknown' }).code, 'INVALID_FILTER');
  assert.equal(queue(state, 'staff', { journey: 'unknown' }).code, 'INVALID_FILTER');
});
test('audit invariants hold through multiple evidence/review loops and replay storms', () => {
  let state = submitted();
  for (let i = 0; i < 25; i++) {
    state = move(state, 'under-review', 'review-started').state;
    state = move(state, 'needs-info', 'evidence-missing').state;
    state = move(state, 'submitted', 'evidence-added', { role: 'learner' }).state;
    for (let j = 0; j < 10; j++) assert.equal(execute(state, intake()).state, state);
    assert.equal(state.tick, state.audit.length); assert.equal(state.cases[0].version, state.audit.length);
  }
  let previous = null;
  state.audit.forEach((event, index) => { assert.equal(event.sequence, index + 1); assert.equal(event.at, stamp(index + 1)); assert.equal(event.from, previous); previous = event.to; });
  assert.equal(previous, state.cases[0].status); assert.equal(state.receipts.length, 1);
});
