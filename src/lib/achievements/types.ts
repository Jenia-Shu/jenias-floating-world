/** Shared vocabulary for the Achievement Wall. */

export type Bi = { en: string; zh: string };

export type BadgeGroup = "collection" | "growth" | "milestones";

export type EmblemKey =
  | "globe"
  | "music"
  | "compass"
  | "eye"
  | "sun"
  | "quill"
  | "lens"
  | "plane"
  | "wand"
  | "flag"
  | "sprout"
  | "horizon"
  | "hourglass"
  | "treasure"
  | "constellation"
  | "keyhole"
  | "eggs"
  | "book"
  | "gauge"
  | "paw"
  | "clover"
  | "percent";

export type BadgeId =
  | "world-collector"
  | "universe-of-music"
  | "beyond-the-map"
  | "ten-treasures"
  | "five-worlds"
  | "little-things"
  | "little-happiness"
  | "inspiration"
  | "unexpected-discoverer"
  | "beyond-the-plan"
  | "behind-scenes"
  | "making-it-happen"
  | "no-standard-answer"
  | "world-waiting"
  | "lifetime-counter"
  | "secret-finder"
  | "egg-hunter"
  | "no-page-left"
  | "completionist"
  | "dog-tracker"
  | "unexpected-luck"
  | "one-percent";

/** Everything the wall reads. All numbers come from real local records. */
export type AchievementStats = {
  lifetimeDays: number | null;
  totalVisits: number;
  totalCollections: number;
  totalCards: number;
  discoveredCards: number;
  musicCards: number;
  placeCards: number;
  exploredCategories: number;
  discoveredEasterEggs: number;
  discoveredAnimals: number;
  /** Main areas the visitor has actually opened (not necessarily finished). */
  exploredAreas: number;
  completedSections: number;
  totalSections: number;
  worldCompletion: number;
  distinctSurprises: number;
  journalMoments: number;
  journalHappiness: number;
  journalIdeas: number;
  journalGrowth: number;
  plannedEvent: boolean;
  organizedEvent: boolean;
  dogFound: boolean;
};

export type Snapshot = {
  visits: number;
  collections: number;
  cards: number;
  eggs: number;
  animals: number;
  worldCompletion: number;
  lifetimeDays: number | null;
};

export type UnlockRecord = { at: number; snapshot: Snapshot };

export type JournalKind = "moment" | "happiness" | "idea" | "growth";

export type JournalEntry = {
  id: string;
  kind: JournalKind;
  text: string;
  at: number;
};

export type AchievementState = {
  v: 1;
  visits: number;
  eggs: string[];
  animals: string[];
  surprises: string[];
  /** Main areas the visitor has opened at least once. */
  explored: string[];
  /** Main areas whose exploration task was actually finished. */
  sections: string[];
  /** `YYYY-MM-DD`, local to this device only — never sent anywhere. */
  birthday: string | null;
  lastMilestone: number;
  journal: JournalEntry[];
  confirmations: { planned: boolean; organized: boolean };
  sound: boolean;
  unlocked: Partial<Record<BadgeId, UnlockRecord>>;
};

export type BadgeDef = {
  id: BadgeId;
  /** The number printed on the wall, kept exactly as specified. */
  num: string;
  zh: string;
  en: string;
  group: BadgeGroup;
  /** Hidden badges do not exist anywhere on the wall until they unlock. */
  hidden: boolean;
  emblem: EmblemKey;
  metal: [string, string];
  story: Bi;
  condition: Bi;
  line: Bi;
  progress: (s: AchievementStats) => { current: number; target: number };
};
