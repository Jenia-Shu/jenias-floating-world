/**
 * Fun Zone — shared backbone for all three games.
 *
 * This module is deliberately game-agnostic. A new game only needs one row in
 * GAMES (and its own folder under components/fun/games); the unlock chain,
 * per-nickname persistence, reward claims and sound preference live here and
 * do not have to be touched again.
 *
 * Storage is local only. Nothing here claims to sync across devices.
 */

import { GUEST, currentSession, visitedKey, type Session } from "@/lib/user";

export const FUN_VERSION = 1;

export type GameId = "world-explorer" | "tiny-maze" | "choice-adventure";
export type RewardId =
  | "explorer-ticket"
  | "explorer-star"
  | "special-star"
  | "perfect-card"
  | "first-explorer-badge";

export type Bi = { en: string; zh: string };
export const bi = (en: string, zh: string): Bi => ({ en, zh });

export type GameDef = {
  id: GameId;
  num: string;
  name: Bi;
  tagline: Bi;
  /** A game with no implementation yet stays visible but cannot be entered. */
  available: boolean;
  /** The game that must be completed before this one opens. */
  requires?: GameId;
  /** Shown while locked, and while a facility exists but has no game yet. */
  lockedHint: Bi;
};

/**
 * Order is the Fun Zone progression. Game 02 / 03 are registered now so their
 * facilities exist in the park from day one; their implementations arrive in
 * later sessions without any change to this file's logic.
 */
/**
 * Facility wording is the user's confirmed 13:41 copy (FunZone-需求原档.md §4):
 * short Chinese names that fit on a 3D sign, never a literal translation of
 * the English. The all-caps game titles used *inside* World Explorer come from
 * the Game 01 spec and are intentionally kept separate.
 */
export const GAMES: GameDef[] = [
  {
    id: "world-explorer",
    num: "01",
    name: bi("World Explorer", "知识探索站"),
    tagline: bi("Step inside", "进去逛逛"),
    available: true,
    lockedHint: bi("Finish the last stop first.", "先完成上一站"),
  },
  {
    id: "tiny-maze",
    num: "02",
    name: bi("Tiny Maze", "迷宫入口"),
    tagline: bi("Find your way in", "走进迷宫"),
    available: false,
    requires: "world-explorer",
    lockedHint: bi("Finish the last stop first.", "先完成上一站"),
  },
  {
    id: "choice-adventure",
    num: "03",
    name: bi("The Choice Adventure", "故事剧场"),
    tagline: bi("Take a seat", "坐下听故事"),
    available: false,
    requires: "tiny-maze",
    lockedHint: bi("Finish the last stop first.", "先完成上一站"),
  },
];

/** Shown the moment a lock opens — also from the 13:41 copy decision. */
export const UNLOCK_LINE = bi("The lights are on — go see.", "灯亮了，去看看吧");

export const gameById = (id: GameId): GameDef => GAMES.find((g) => g.id === id)!;

export type RewardDef = {
  id: RewardId;
  name: Bi;
  note: Bi;
  glyph: "ticket" | "star" | "card" | "badge";
  rare?: boolean;
};

/** One collectible visual language: cream, rounded edges, champagne-gold trim. */
export const REWARDS: RewardDef[] = [
  {
    id: "explorer-ticket",
    name: bi("Explorer Ticket", "探险纪念票"),
    note: bi("A ticket stamped with today's date and your grade.", "印着今天的日期和你的称号的纪念票。"),
    glyph: "ticket",
  },
  {
    id: "explorer-star",
    name: bi("Explorer Star", "探险之星"),
    note: bi("For a careful pair of eyes.", "给细心观察的你。"),
    glyph: "star",
  },
  {
    id: "special-star",
    name: bi("Special Star", "特别之星"),
    note: bi("Only one answer away from perfect.", "离满分只差一个答案。"),
    glyph: "star",
  },
  {
    id: "perfect-card",
    name: bi("Perfect Explorer Card", "完美探索家卡"),
    note: bi("A limited card, given once — the first 9 / 9.", "限量的卡，只在你第一次拿到 9 / 9 时送出。"),
    glyph: "card",
    rare: true,
  },
  {
    id: "first-explorer-badge",
    name: bi("First Explorer", "世界初探者"),
    note: bi("Awarded once, the first time you finish the map.", "第一次补全地图时获得，只发一次。"),
    glyph: "badge",
    rare: true,
  },
];

export const rewardById = (id: RewardId): RewardDef => REWARDS.find((r) => r.id === id)!;

/* ------------------------------------------------------------------ state */

/** A round in progress. Nine questions, three per fixed chapter. */
export type RoundState = {
  signature: string;
  questionIds: string[];
  chapter: number; // 1..3
  questionIndex: number; // 0..8
  /** Indexed by question; true only when the FIRST submitted answer was right. */
  firstTry: boolean[];
  /** Tracks the first submitted answer separately from later retries. */
  firstAnswers: (number | null)[];
  /** Has this question been answered correctly and moved past? */
  solved: boolean[];
  hints: [boolean, boolean, boolean];
  startedAt: number;
};

export type FunState = {
  v: 1;
  completed: Partial<Record<GameId, boolean>>;
  unlocked: Partial<Record<GameId, boolean>>;
  unlockedAt: Partial<Record<GameId, number>>;
  sound: boolean;
  rewards: RewardId[];
  /** Consecutive perfect (9 / 9) World Explorer rounds. */
  perfectStreak: number;
  explorer: {
    best: number;
    challenges: number;
    lastSignature: string;
    round: RoundState | null;
  };
};

export function emptyFunState(): FunState {
  return {
    v: FUN_VERSION,
    completed: {},
    unlocked: { "world-explorer": true },
    unlockedAt: {},
    sound: true,
    rewards: [],
    perfectStreak: 0,
    explorer: { best: 0, challenges: 0, lastSignature: "", round: null },
  };
}

/** Same per-nickname prefix as the island map and the achievement wall. */
export function funKey(user?: Session | string): string {
  return `${visitedKey(user ?? currentSession() ?? GUEST)}:fun:v1`;
}

function asBoolMap(value: unknown): Partial<Record<GameId, boolean>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Partial<Record<GameId, boolean>> = {};
  for (const g of GAMES) if ((value as Record<string, unknown>)[g.id] === true) out[g.id] = true;
  return out;
}

/**
 * Tolerant reader: missing fields fall back to defaults, so a future version
 * that adds fields will not erase what a visitor already earned. `v` is kept
 * for the day a real migration is needed.
 */
export function readFunState(user?: Session | string): FunState {
  const base = emptyFunState();
  try {
    const raw = localStorage.getItem(funKey(user));
    if (!raw) return base;
    const d: unknown = JSON.parse(raw);
    if (!d || typeof d !== "object" || Array.isArray(d)) return base;
    const o = d as Record<string, unknown>;
    const ex = o["explorer"] && typeof o["explorer"] === "object" ? (o["explorer"] as Record<string, unknown>) : {};
    const round = ex["round"] && typeof ex["round"] === "object" ? (ex["round"] as Record<string, unknown>) : null;

    const rewards = Array.isArray(o["rewards"])
      ? (o["rewards"].filter((r): r is RewardId => REWARDS.some((def) => def.id === r)) as RewardId[])
      : [];

    let validRound: RoundState | null = null;
    if (
      round &&
      typeof round["signature"] === "string" &&
      Array.isArray(round["questionIds"]) &&
      round["questionIds"].length === 9 &&
      round["questionIds"].every((x) => typeof x === "string")
    ) {
      validRound = {
        signature: round["signature"],
        questionIds: round["questionIds"] as string[],
        chapter: typeof round["chapter"] === "number" ? clamp(round["chapter"], 1, 3) : 1,
        questionIndex: typeof round["questionIndex"] === "number" ? clamp(Math.floor(round["questionIndex"]), 0, 8) : 0,
        firstTry: Array.isArray(round["firstTry"]) ? (round["firstTry"] as boolean[]).slice(0, 9) : [],
        firstAnswers: Array.isArray(round["firstAnswers"]) ? (round["firstAnswers"] as (number | null)[]).slice(0, 9) : [],
        solved: Array.isArray(round["solved"])
          ? (round["solved"] as boolean[]).slice(0, 9)
          : (round["firstTry"] as boolean[] | undefined)?.slice(0, 9) ?? [],
        hints: Array.isArray(round["hints"])
          ? [round["hints"][0] === true, round["hints"][1] === true, round["hints"][2] === true]
          : [false, false, false],
        startedAt: typeof round["startedAt"] === "number" ? round["startedAt"] : Date.now(),
      };
    }

    return {
      v: FUN_VERSION,
      completed: asBoolMap(o["completed"]),
      unlocked: { "world-explorer": true, ...asBoolMap(o["unlocked"]) },
      unlockedAt: (() => {
        const out: Partial<Record<GameId, number>> = {};
        const src = o["unlockedAt"] && typeof o["unlockedAt"] === "object" ? (o["unlockedAt"] as Record<string, unknown>) : {};
        for (const g of GAMES) if (typeof src[g.id] === "number") out[g.id] = src[g.id] as number;
        return out;
      })(),
      sound: o["sound"] !== false,
      rewards: [...new Set(rewards)],
      perfectStreak: typeof o["perfectStreak"] === "number" ? Math.max(0, Math.floor(o["perfectStreak"])) : 0,
      explorer: {
        best: typeof ex["best"] === "number" ? clamp(Math.floor(ex["best"]), 0, 9) : 0,
        challenges: typeof ex["challenges"] === "number" ? Math.max(0, Math.floor(ex["challenges"])) : 0,
        lastSignature: typeof ex["lastSignature"] === "string" ? ex["lastSignature"] : "",
        round: validRound,
      },
    };
  } catch {
    return base;
  }
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export function writeFunState(state: FunState, user?: Session | string): boolean {
  try {
    localStorage.setItem(funKey(user), JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/* --------------------------------------------------------------- unlocks */

/** World Explorer is always open. Everything else follows the fixed chain. */
export function isGameUnlocked(id: GameId, state: FunState): boolean {
  const def = gameById(id);
  if (!def.requires) return true;
  return state.unlocked[id] === true || state.completed[def.requires] === true;
}

export type CompletionResult = {
  state: FunState;
  firstTime: boolean;
  unlockedNext: GameId | null;
  newly: RewardId[];
};

/**
 * First completion permanently unlocks the next facility on this device.
 * A later low score can never reverse it — `unlocked` is written once and
 * only ever grows.
 */
export function markCompleted(state: FunState, id: GameId): CompletionResult {
  const firstTime = state.completed[id] !== true;
  const completed = { ...state.completed, [id]: true };
  let unlocked = { ...state.unlocked };
  const unlockedAt = { ...state.unlockedAt };
  let unlockedNext: GameId | null = null;
  const newly: RewardId[] = [];

  if (firstTime) {
    const next = GAMES.find((g) => g.requires === id);
    if (next && unlocked[next.id] !== true) {
      unlocked = { ...unlocked, [next.id]: true };
      unlockedAt[next.id] = Date.now();
      unlockedNext = next.id;
    }
    if (id === "world-explorer" && !state.rewards.includes("first-explorer-badge")) {
      newly.push("first-explorer-badge");
    }
  }

  return {
    state: {
      ...state,
      completed,
      unlocked,
      unlockedAt,
      rewards: [...new Set([...state.rewards, ...newly])],
    },
    firstTime,
    unlockedNext,
    newly,
  };
}

/* --------------------------------------------------------------- rounds */

export type Grade = {
  id: "brave" | "careful" | "excellent" | "perfect";
  name: Bi;
  rewards: RewardId[];
};

export const GRADES: Grade[] = [
  { id: "brave", name: bi("Brave Explorer", "勇敢探索者"), rewards: ["explorer-ticket"] },
  { id: "careful", name: bi("Careful Observer", "细心观察家"), rewards: ["explorer-ticket", "explorer-star"] },
  { id: "excellent", name: bi("Excellent Explorer", "优秀探索家"), rewards: ["explorer-ticket", "special-star"] },
  { id: "perfect", name: bi("Perfect Explorer", "完美探索家"), rewards: ["explorer-ticket", "perfect-card"] },
];

export function gradeFor(score: number): Grade {
  if (score >= 9) return GRADES[3]!;
  if (score === 8) return GRADES[2]!;
  if (score >= 6) return GRADES[1]!;
  return GRADES[0]!;
}

export function startExplorerRound(state: FunState, questionIds: string[]): FunState {
  const signature = [...questionIds].sort().join("|");
  const round: RoundState = {
    signature,
    questionIds,
    chapter: 1,
    questionIndex: 0,
    firstTry: Array(9).fill(false),
    firstAnswers: Array(9).fill(null),
    solved: Array(9).fill(false),
    hints: [false, false, false],
    startedAt: Date.now(),
  };
  return {
    ...state,
    explorer: { ...state.explorer, lastSignature: signature, round },
  };
}

export function abandonRound(state: FunState): FunState {
  return { ...state, explorer: { ...state.explorer, round: null } };
}

export type RoundResult = CompletionResult & {
  score: number;
  grade: Grade;
  best: number;
  challenges: number;
  perfectStreak: number;
  /** Special celebration after several perfect rounds in a row. */
  streakCelebration: boolean;
};

/** Nine questions completed = one completed challenge, whatever the score. */
export function finishExplorerRound(state: FunState, firstTry: boolean[]): RoundResult {
  const score = firstTry.filter(Boolean).length;
  const grade = gradeFor(score);
  const completion = markCompleted(state, "world-explorer");

  const freshTicket = completion.state.rewards;
  const claims = [...new Set([...freshTicket, ...grade.rewards])];
  // A limited card is issued once: the set union already guarantees that.
  const perfectStreak = score === 9 ? state.perfectStreak + 1 : 0;

  const next: FunState = {
    ...completion.state,
    rewards: claims,
    perfectStreak,
    explorer: {
      best: Math.max(state.explorer.best, score),
      challenges: state.explorer.challenges + 1,
      lastSignature: state.explorer.round?.signature ?? state.explorer.lastSignature,
      round: null,
    },
  };

  return {
    ...completion,
    state: next,
    newly: [...new Set([...completion.newly, ...grade.rewards.filter((r) => !state.rewards.includes(r))])],
    score,
    grade,
    best: next.explorer.best,
    challenges: next.explorer.challenges,
    perfectStreak,
    streakCelebration: perfectStreak >= 3,
  };
}

/** All rewards ever earned, in a stable display order. */
export function earnedRewards(state: FunState): RewardDef[] {
  return REWARDS.filter((r) => state.rewards.includes(r.id));
}
