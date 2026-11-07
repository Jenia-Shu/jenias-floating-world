/**
 * Calendar-correct life counting for the private birthday.
 *
 * Dates are handled as local calendar days (year, month, day) and converted to
 * UTC midnights only for subtraction, so daylight-saving shifts can never add or
 * remove a day. Leap-day birthdays are clamped to the last day of the month.
 */

export type LifeSpan = {
  totalDays: number;
  years: number;
  months: number;
  days: number;
};

const DAY_MS = 86_400_000;

function daysInMonth(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

function toUtcDay(y: number, m: number, d: number): number {
  return Date.UTC(y, m - 1, d);
}

function localParts(date: Date): { y: number; m: number; d: number } {
  return { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate() };
}

/** `YYYY-MM-DD`, a real calendar date, not in the future. */
export function parseBirthday(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (y < 1900 || y > 2200 || m < 1 || m > 12) return null;
  if (d < 1 || d > daysInMonth(y, m)) return null;
  const today = localParts(new Date());
  if (toUtcDay(y, m, d) > toUtcDay(today.y, today.m, today.d)) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function addYearsClamped(
  y: number,
  m: number,
  d: number,
  add: number,
): { y: number; m: number; d: number } {
  const ny = y + add;
  return { y: ny, m, d: Math.min(d, daysInMonth(ny, m)) };
}

function addMonthsClamped(y: number, m: number, d: number): { y: number; m: number; d: number } {
  const index = y * 12 + m; // one month after (y, m), both 1-based
  const ny = Math.floor(index / 12);
  const nm = (index % 12) + 1;
  return { y: ny, m: nm, d: Math.min(d, daysInMonth(ny, nm)) };
}

/**
 * Total days lived plus the calendar breakdown (17 years, 5 months, 16 days).
 * Returns null for a missing or invalid birthday.
 */
export function lifeSpan(birthday: string | null | undefined, now = new Date()): LifeSpan | null {
  const iso = parseBirthday(birthday);
  if (!iso) return null;
  const [by, bm, bd] = iso.split("-").map(Number) as [number, number, number];
  const today = localParts(now);

  const totalDays = Math.floor(
    (toUtcDay(today.y, today.m, today.d) - toUtcDay(by, bm, bd)) / DAY_MS,
  );

  let years = today.y - by;
  let anchor = addYearsClamped(by, bm, bd, years);
  if (toUtcDay(anchor.y, anchor.m, anchor.d) > toUtcDay(today.y, today.m, today.d)) {
    years -= 1;
    anchor = addYearsClamped(by, bm, bd, years);
  }

  let months = 0;
  let cursor = anchor;
  for (let i = 0; i < 12; i++) {
    const next = addMonthsClamped(cursor.y, cursor.m, cursor.d);
    if (toUtcDay(next.y, next.m, next.d) > toUtcDay(today.y, today.m, today.d)) break;
    cursor = next;
    months += 1;
  }

  const days = Math.floor(
    (toUtcDay(today.y, today.m, today.d) - toUtcDay(cursor.y, cursor.m, cursor.d)) / DAY_MS,
  );

  return { totalDays, years, months, days };
}

/** Which 1000-day milestone this life has reached (0 before the first 1000 days). */
export function milestoneIndex(totalDays: number): number {
  return Math.floor(totalDays / 1000);
}
