import { describe, expect, it } from "vitest";
import { lifeSpan, milestoneIndex, parseBirthday } from "./life";

describe("life counting", () => {
  it("keeps leap-day birthdays honest", () => {
    // 2000-02-29 + 24 years clamps to 2024-02-29 (2024 is a leap year).
    expect(lifeSpan("2000-02-29", new Date(2024, 1, 29))).toEqual({
      totalDays: 8766,
      years: 24,
      months: 0,
      days: 0,
    });
    // In 2025 the anniversary clamps to 2025-02-28.
    expect(lifeSpan("2000-02-29", new Date(2025, 1, 28))).toEqual({
      totalDays: 9131,
      years: 25,
      months: 0,
      days: 0,
    });
  });

  it("breaks the span into calendar years, months and days", () => {
    expect(lifeSpan("2025-12-31", new Date(2026, 2, 1))).toEqual({
      totalDays: 60,
      years: 0,
      months: 2,
      days: 1,
    });
  });

  it("rejects impossible or future dates", () => {
    expect(parseBirthday("2025-02-30")).toBeNull();
    expect(parseBirthday("2000-2-9")).toBeNull();
    expect(parseBirthday("2999-01-01")).toBeNull();
    expect(parseBirthday(null)).toBeNull();
  });

  it("only marks real 1000-day milestones", () => {
    expect(milestoneIndex(999)).toBe(0);
    expect(milestoneIndex(1000)).toBe(1);
    expect(milestoneIndex(2999)).toBe(2);
  });
});
