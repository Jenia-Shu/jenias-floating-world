import { describe, expect, it } from "vitest";
import { emptyState, evaluate, recordEgg, recordVisit } from "./store";
import type { AchievementStats } from "./types";
import type { Session } from "@/lib/user";

const stats = (over: Partial<AchievementStats> = {}): AchievementStats => ({
  lifetimeDays: null,
  totalVisits: 0,
  totalCollections: 0,
  totalCards: 20,
  discoveredCards: 0,
  musicCards: 0,
  placeCards: 0,
  exploredCategories: 0,
  discoveredEasterEggs: 0,
  discoveredAnimals: 0,
  exploredAreas: 0,
  completedSections: 0,
  totalSections: 5,
  worldCompletion: 0,
  distinctSurprises: 0,
  journalMoments: 0,
  journalHappiness: 0,
  journalIdeas: 0,
  journalGrowth: 0,
  plannedEvent: false,
  organizedEvent: false,
  dogFound: false,
  ...over,
});

const user = (en: string): Session => ({ en, zh: en });

describe("achievement rules", () => {
  it("counts one visit per page load, not per render", () => {
    const u = user("visit-once");
    recordVisit(u);
    const again = recordVisit(u);
    expect(again.visits).toBe(1);
  });

  it("keeps each hidden thing once", () => {
    const u = user("egg-once");
    recordEgg(u, "gallery-plinth");
    const state = recordEgg(u, "gallery-plinth");
    expect(state.eggs).toEqual(["gallery-plinth"]);
  });

  it("unlocks the lifetime counter only with a real birthday", () => {
    const state = emptyState();
    const noBirthday = evaluate(state, stats({ discoveredCards: 0 }));
    expect(noBirthday.newly).not.toContain("lifetime-counter");

    const withBirthday = evaluate(state, stats({ lifetimeDays: 1000 }));
    expect(withBirthday.newly).toContain("lifetime-counter");
  });

  it("needs ten cards for World Collector", () => {
    expect(evaluate(emptyState(), stats({ discoveredCards: 9 })).newly).not.toContain(
      "world-collector",
    );
    expect(evaluate(emptyState(), stats({ discoveredCards: 10 })).newly).toContain(
      "world-collector",
    );
  });

  it("treats explored areas differently from finished tasks", () => {
    const opened = evaluate(emptyState(), stats({ exploredAreas: 5, completedSections: 0 }));
    expect(opened.newly).toContain("world-waiting");
    expect(opened.newly).not.toContain("completionist");

    const unfinished = evaluate(emptyState(), stats({ exploredAreas: 4, completedSections: 5 }));
    expect(unfinished.newly).not.toContain("world-waiting");
    expect(unfinished.newly).toContain("completionist");
  });
});
