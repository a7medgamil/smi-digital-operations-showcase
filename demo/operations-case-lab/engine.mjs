// Original synthetic workflow. No I/O, wall clock, randomness or hidden mutable state.
export const STATUSES = Object.freeze(['submitted', 'under-review', 'approved', 'needs-info', 'rejected']);
export const JOURNEYS = Object.freeze(['new', 'returning']);
export const REASONS = Object.freeze({
  'review-started': 'Review started',
  'criteria-met': 'Synthetic checklist complete',
  'evidence-missing': 'Synthetic evidence missing',
  'criteria-not-met': 'Synthetic criteria not met',
  'evidence-added': 'Synthetic evidence added',
});
const RULES = Object.freeze({
  submitted: { 'under-review': ['staff', 'review-started'] },
  'under-review': {
    approved: ['staff', 'criteria-met'],
    'needs-info': ['staff', 'evidence-missing'],
    rejected: ['staff', 'criteria-not-met'],
  },
  'needs-info': { submitted: ['learner', 'evidence-added'] },
  approved: {}, rejected: {},
});
export const initialState = () => ({ tick: 0, cases: [], receipts: [], audit: [] });
export const stamp = tick => `V+${String(tick).padStart(4, '0')}m`;
const fail = (state, code) => ({ ok: false, state, code });
const exactKeys = (object, keys) => Object.keys(object).length === keys.length && keys.every(k => Object.hasOwn(object, k));

export function allowedActions(role, status) {
  return Object.entries(Object.hasOwn(RULES, status) ? RULES[status] : {}).filter(([, rule]) => rule[0] === role)
    .map(([to, [, reason]]) => ({ to, reason }));
}

export function execute(state, command) {
  if (!command || typeof command !== 'object' || Array.isArray(command)) return fail(state, 'INVALID_COMMAND');
  if (!['learner', 'staff'].includes(command.role)) return fail(state, 'FORBIDDEN');
  if (command.type === 'submit') {
    if (command.role !== 'learner') return fail(state, 'FORBIDDEN');
    if (!exactKeys(command, ['type', 'role', 'key', 'journey']) ||
        !JOURNEYS.includes(command.journey) || typeof command.key !== 'string' ||
        !/^intake-[0-9]{1,6}$/.test(command.key)) return fail(state, 'INVALID_INTAKE');
    const receipt = state.receipts.find(r => r.key === command.key);
    if (receipt) {
      if (receipt.journey !== command.journey) return fail(state, 'IDEMPOTENCY_CONFLICT');
      return { ok: true, state, caseId: receipt.caseId, replayed: true };
    }
    const id = `CASE-${String(state.cases.length + 1).padStart(3, '0')}`;
    const record = { id, name: `Demo ${String(state.cases.length + 1).padStart(2, '0')}`,
      journey: command.journey, status: 'submitted', version: 1, createdTick: state.tick + 1, updatedTick: state.tick + 1 };
    const tick = state.tick + 1;
    return { ok: true, caseId: id, replayed: false, state: {
      tick, cases: [...state.cases, record],
      receipts: [...state.receipts, { key: command.key, journey: command.journey, caseId: id }],
      audit: [...state.audit, { sequence: tick, at: stamp(tick), caseId: id, role: command.role,
        from: null, to: 'submitted', reason: 'intake-submitted', version: 1 }],
    } };
  }
  if (command.type !== 'transition' || !exactKeys(command, ['type', 'role', 'caseId', 'expectedVersion', 'to', 'reason'])) {
    return fail(state, 'INVALID_COMMAND');
  }
  const record = state.cases.find(c => c.id === command.caseId);
  if (!record) return fail(state, 'NOT_FOUND');
  if (!Number.isSafeInteger(command.expectedVersion) || command.expectedVersion !== record.version) return fail(state, 'VERSION_CONFLICT');
  const rule = Object.hasOwn(RULES[record.status], command.to) ? RULES[record.status][command.to] : null;
  if (!rule) return fail(state, 'INVALID_TRANSITION');
  if (rule[0] !== command.role) return fail(state, 'FORBIDDEN');
  if (command.reason !== rule[1]) return fail(state, 'INVALID_REASON');
  const tick = state.tick + 1;
  const updated = { ...record, status: command.to, version: record.version + 1, updatedTick: tick };
  return { ok: true, caseId: record.id, state: {
    ...state, tick, cases: state.cases.map(c => c.id === record.id ? updated : c),
    audit: [...state.audit, { sequence: tick, at: stamp(tick), caseId: record.id,
      role: command.role, from: record.status, to: command.to, reason: command.reason, version: updated.version }],
  } };
}

export function queue(state, role, { status = 'all', journey = 'all', search = '' } = {}) {
  if (role !== 'staff') return { ok: false, code: 'FORBIDDEN', records: [] };
  if ((status !== 'all' && !STATUSES.includes(status)) || (journey !== 'all' && !JOURNEYS.includes(journey)) || typeof search !== 'string') {
    return { ok: false, code: 'INVALID_FILTER', records: [] };
  }
  const term = search.trim().toLowerCase();
  return { ok: true, records: state.cases.filter(c => (status === 'all' || c.status === status) &&
    (journey === 'all' || c.journey === journey) && `${c.name} ${c.id}`.toLowerCase().includes(term)) };
}

export function metrics(state, role) {
  if (role !== 'staff') return { ok: false, code: 'FORBIDDEN' };
  const counts = Object.fromEntries(STATUSES.map(s => [s, state.cases.filter(c => c.status === s).length]));
  return { ok: true, total: state.cases.length, counts,
    open: counts.submitted + counts['under-review'] + counts['needs-info'],
    resolved: counts.approved + counts.rejected };
}

export function seededState() {
  let state = initialState();
  for (let i = 1; i <= 6; i++) {
    const result = execute(state, { type: 'submit', role: 'learner', key: `intake-${i}`, journey: i % 2 ? 'new' : 'returning' });
    state = result.state;
    const move = (to, reason) => {
      const record = state.cases.find(c => c.id === result.caseId);
      state = execute(state, { type: 'transition', role: 'staff', caseId: record.id, expectedVersion: record.version, to, reason }).state;
    };
    if (i >= 2 && i <= 5) move('under-review', 'review-started');
    if (i === 3) move('approved', 'criteria-met');
    if (i === 4) move('needs-info', 'evidence-missing');
    if (i === 5) move('rejected', 'criteria-not-met');
  }
  return state;
}
