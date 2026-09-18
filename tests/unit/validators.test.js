import { describe, it, expect } from 'vitest';
import {
  validateTitle,
  validateStatus,
  validateDueDate,
  validateTaskInput,
  VALID_STATUS,
} from '../../src/validators.js';

/** Milestone 3 — unit tests for the pure validation logic (equivalence partitioning + BVA). */

describe('validateTitle', () => {
  it('accepts a normal title and trims it', () => {
    expect(validateTitle('  Buy milk  ')).toEqual({ ok: true, value: 'Buy milk' });
  });
  it.each([['', 'empty'], ['   ', 'whitespace only'], [undefined, 'undefined'], [null, 'null'], [42, 'non-string']])(
    'rejects %s (%s)',
    (input) => {
      expect(validateTitle(input).ok).toBe(false);
    },
  );
});

describe('validateStatus', () => {
  it.each(VALID_STATUS)('accepts valid status "%s"', (s) => {
    expect(validateStatus(s)).toEqual({ ok: true, value: s });
  });
  it.each(['open', 'DONE', 'in-progress', '', undefined])('rejects invalid status %s', (s) => {
    expect(validateStatus(s).ok).toBe(false);
  });
});

describe('validateDueDate', () => {
  it('treats empty/null/undefined as no due date', () => {
    expect(validateDueDate(null)).toEqual({ ok: true, value: null });
    expect(validateDueDate('')).toEqual({ ok: true, value: null });
    expect(validateDueDate(undefined)).toEqual({ ok: true, value: null });
  });
  it('accepts a valid YYYY-MM-DD date', () => {
    expect(validateDueDate('2026-10-05')).toEqual({ ok: true, value: '2026-10-05' });
  });
  it.each([
    ['2026-2-5', 'not zero-padded'],
    ['05-10-2026', 'wrong order'],
    ['2026/10/05', 'wrong separator'],
    ['October 5', 'free text'],
  ])('rejects malformed date %s (%s)', (input) => {
    expect(validateDueDate(input).ok).toBe(false);
  });
  it.each([
    ['2026-02-31', 'Feb 31 does not exist'],
    ['2026-13-01', 'month 13'],
    ['2026-00-10', 'month 0'],
    ['2026-04-31', 'April has 30 days'],
  ])('rejects impossible calendar date %s (%s)', (input) => {
    expect(validateDueDate(input).ok).toBe(false);
  });
});

describe('validateTaskInput', () => {
  it('accepts a full valid payload with defaults', () => {
    const r = validateTaskInput({ title: 'Task' });
    expect(r).toEqual({ ok: true, value: { title: 'Task', status: 'todo', due_date: null } });
  });
  it('fails fast on the first invalid field (title before status)', () => {
    const r = validateTaskInput({ title: '', status: 'bogus' });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/title/i);
  });
  it('propagates a due_date error', () => {
    const r = validateTaskInput({ title: 'ok', due_date: '2026-02-31' });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/date/i);
  });
});
