// Pure validation helpers — no I/O, so they're easy to unit test (Milestone 3).

export const VALID_STATUS = ['todo', 'doing', 'done'];

/** Title must be a non-empty string after trimming. */
export function validateTitle(title) {
  if (typeof title !== 'string' || title.trim() === '') {
    return { ok: false, error: 'title is required' };
  }
  return { ok: true, value: title.trim() };
}

/** Status must be one of the allowed values. */
export function validateStatus(status) {
  if (!VALID_STATUS.includes(status)) {
    return { ok: false, error: `status must be one of ${VALID_STATUS.join(', ')}` };
  }
  return { ok: true, value: status };
}

/** Due date is optional; if present it must be a real YYYY-MM-DD date. */
export function validateDueDate(dueDate) {
  if (dueDate === null || dueDate === undefined || dueDate === '') {
    return { ok: true, value: null };
  }
  if (typeof dueDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return { ok: false, error: 'due_date must be in YYYY-MM-DD format' };
  }
  const d = new Date(`${dueDate}T00:00:00Z`);
  // Guard against invalid calendar dates like 2026-02-31 (which JS rolls over).
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== dueDate) {
    return { ok: false, error: 'due_date is not a valid calendar date' };
  }
  return { ok: true, value: dueDate };
}

/** Validate a full task payload (used by create/update). */
export function validateTaskInput({ title, status = 'todo', due_date = null }) {
  const t = validateTitle(title);
  if (!t.ok) return t;
  const s = validateStatus(status);
  if (!s.ok) return s;
  const d = validateDueDate(due_date);
  if (!d.ok) return d;
  return { ok: true, value: { title: t.value, status: s.value, due_date: d.value } };
}
