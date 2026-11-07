/**
 * Local memory for the Achievement Wall.
 *
 * One record per visitor, keyed off the same English name the map and the album
 * use. Everything here is written by real behaviour: a page load counts a visit
 * once, a click on the dog records the dog, an easter egg records its own id.
 * Nothing is inferred from "the page was opened", and no number is ever made up.
 */

import { visitedKey, type Session } from "@/lib/user";
import { BADGES } from "./badges";
import { lifeSpan, milestoneIndex, parseBirthday } from "./life";
import type {
  AchievementState,
  AchievementStats,
  BadgeId,
  JournalEntry,
  JournalKind,
  Snapshot,
  UnlockRecord,
} from "./types";

export function achKey(user: Session | string): string {
  return `${visitedKey(user)}:ach:v1`;
}

export function emptyState(): AchievementState {
  return {
    v: 1,
    visits: 0,
    eggs: [],
    animals: [],
    surprises: [],
    explored: [],
    sections: [],
    birthday: null,
    lastMilestone: 0,
    journal: [],
    confirmations: { planned: false, organized: false },
    sound: true,
    unlocked: {},
  };
}

function strList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isJournal(value: unknown): value is JournalEntry {
  if (!isRecord(value)) return false;
  return (
    typeof value["id"] === "string" &&
    typeof value["text"] === "string" &&
    typeof value["at"] === "number" &&
    ["moment", "happiness", "idea", "growth"].includes(String(value["kind"]))
  );
}

function isSnapshot(value: unknown): value is Snapshot {
  if (!isRecord(value)) return false;
  const nums = ["visits", "collections", "cards", "eggs", "animals", "worldCompletion"];
  return (
    nums.every((k) => typeof value[k] === "number") &&
    (value["lifetimeDays"] === null || typeof value["lifetimeDays"] === "number")
  );
}

function isUnlock(value: unknown): value is UnlockRecord {
  if (!isRecord(value)) return false;
  return typeof value["at"] === "number" && isSnapshot(value["snapshot"]);
}

export function readState(key: string): AchievementState {
  const empty = emptyState();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return empty;
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data) || data["v"] !== 1) return empty;

    const unlocked: Partial<Record<BadgeId, UnlockRecord>> = {};
    if (isRecord(data["unlocked"])) {
      for (const def of BADGES) {
        const rec = data["unlocked"][def.id];
        if (isUnlock(rec)) unlocked[def.id] = rec;
      }
    }

    const confirm = isRecord(data["confirmations"]) ? data["confirmations"] : {};

    return {
      v: 1,
      visits:
        typeof data["visits"] === "number" && data["visits"] >= 0 ? Math.floor(data["visits"]) : 0,
      eggs: [...new Set(strList(data["eggs"]))],
      animals: [...new Set(strList(data["animals"]))],
      surprises: [...new Set(strList(data["surprises"]))],
      explored: [...new Set(strList(data["explored"]))],
      sections: [...new Set(strList(data["sections"]))],
      birthday: parseBirthday(typeof data["birthday"] === "string" ? data["birthday"] : null),
      lastMilestone:
        typeof data["lastMilestone"] === "number" && data["lastMilestone"] >= 0
          ? Math.floor(data["lastMilestone"])
          : 0,
      journal: (Array.isArray(data["journal"]) ? data["journal"] : [])
        .filter(isJournal)
        .slice(-200),
      confirmations: {
        planned: confirm["planned"] === true,
        organized: confirm["organized"] === true,
      },
      sound: data["sound"] !== false,
      unlocked,
    };
  } catch {
    return empty;
  }
}

/** Returns false when storage refused the write (quota, private mode). */
export function writeState(key: string, state: AchievementState): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/** One visit per page load per visitor: a refresh counts, a re-render does not. */
const countedThisLoad = new Set<string>();

export function recordVisit(user: Session): AchievementState {
  const key = achKey(user);
  const state = readState(key);
  if (countedThisLoad.has(key)) return state;
  countedThisLoad.add(key);
  const next = { ...state, visits: state.visits + 1 };
  writeState(key, next);
  return next;
}

function withList(
  state: AchievementState,
  field: "eggs" | "animals" | "surprises" | "explored" | "sections",
  id: string,
): AchievementState {
  if (state[field].includes(id)) return state;
  const next = { ...state, [field]: [...state[field], id] } as AchievementState;
  return next;
}

export function recordEgg(user: Session, id: string): AchievementState {
  const key = achKey(user);
  const next = withList(readState(key), "eggs", id);
  writeState(key, next);
  return next;
}

export function recordAnimal(user: Session, id: string): AchievementState {
  const key = achKey(user);
  const next = withList(readState(key), "animals", id);
  writeState(key, next);
  return next;
}

export function recordSurprise(user: Session, id: string): AchievementState {
  const key = achKey(user);
  const next = withList(readState(key), "surprises", id);
  writeState(key, next);
  return next;
}

export function recordExplored(user: Session, id: string): AchievementState {
  const key = achKey(user);
  const next = withList(readState(key), "explored", id);
  writeState(key, next);
  return next;
}

export function recordSection(user: Session, id: string): AchievementState {
  const key = achKey(user);
  const next = withList(readState(key), "sections", id);
  writeState(key, next);
  return next;
}

export function addJournal(user: Session, kind: JournalKind, text: string): AchievementState {
  const clean = text.trim().slice(0, 280);
  if (!clean) return readState(achKey(user));
  const key = achKey(user);
  const state = readState(key);
  const entry: JournalEntry = {
    id: `j-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    kind,
    text: clean,
    at: Date.now(),
  };
  const next = { ...state, journal: [...state.journal, entry].slice(-200) };
  writeState(key, next);
  return next;
}

export function removeJournal(user: Session, id: string): AchievementState {
  const key = achKey(user);
  const state = readState(key);
  const next = { ...state, journal: state.journal.filter((e) => e.id !== id) };
  writeState(key, next);
  return next;
}

/** A birthday is private to this device. Invalid or future dates are refused. */
export function setBirthday(user: Session, raw: string | null): AchievementState {
  const key = achKey(user);
  const state = readState(key);
  const next = { ...state, birthday: parseBirthday(raw) };
  writeState(key, next);
  return next;
}

export function setConfirmation(
  user: Session,
  which: "planned" | "organized",
  value: boolean,
): AchievementState {
  const key = achKey(user);
  const state = readState(key);
  const next = { ...state, confirmations: { ...state.confirmations, [which]: value } };
  writeState(key, next);
  return next;
}

export function setSound(user: Session, on: boolean): AchievementState {
  const key = achKey(user);
  const state = readState(key);
  const next = { ...state, sound: on };
  writeState(key, next);
  return next;
}

export function snapshotOf(state: AchievementState, stats: AchievementStats): Snapshot {
  return {
    visits: state.visits,
    collections: stats.totalCollections,
    cards: stats.discoveredCards,
    eggs: stats.discoveredEasterEggs,
    animals: stats.discoveredAnimals,
    worldCompletion: stats.worldCompletion,
    lifetimeDays: stats.lifetimeDays,
  };
}

/**
 * Applies the badges whose real progress now meets the condition, once each.
 * History is never revoked: a card deleted later cannot take a badge back.
 */
export function evaluate(
  state: AchievementState,
  stats: AchievementStats,
  now = Date.now(),
): { state: AchievementState; newly: BadgeId[] } {
  const newly: BadgeId[] = [];
  const unlocked = { ...state.unlocked };
  const snapshot = snapshotOf(state, stats);

  for (const def of BADGES) {
    if (unlocked[def.id]) continue;
    const { current, target } = def.progress(stats);
    if (target > 0 && current >= target) {
      unlocked[def.id] = { at: now, snapshot };
      newly.push(def.id);
    }
  }

  if (!newly.length) return { state, newly };
  return { state: { ...state, unlocked }, newly };
}

/** Tracks the "every 1000 days" note without ever showing a fake number. */
export function milestoneFor(state: AchievementState, stats: AchievementStats): number {
  if (stats.lifetimeDays === null) return 0;
  return milestoneIndex(stats.lifetimeDays);
}

export function stampMilestone(user: Session, index: number): void {
  if (index <= 0) return;
  const key = achKey(user);
  const state = readState(key);
  if (state.lastMilestone >= index) return;
  writeState(key, { ...state, lastMilestone: index });
}

export function daysLived(birthday: string | null, now = new Date()): number | null {
  return lifeSpan(birthday, now)?.totalDays ?? null;
}
