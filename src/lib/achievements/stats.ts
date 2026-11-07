/**
 * The only place achievements get their numbers.
 *
 * Stats are read fresh from the album, the visit counter and the private
 * notebook every time the wall renders or an event fires, so the progress shown
 * is always the progress that is actually saved.
 */

import { albumDone, albumKey, buildPages, readAlbum } from "@/lib/collections/store";
import { type Session } from "@/lib/user";
import { lifeSpan } from "./life";
import type { AchievementStats, AchievementState } from "./types";

/** The five main areas, each with a real task behind its tick. */
export const SECTIONS = ["about", "gallery", "collections", "fun", "community"] as const;
export type SectionId = (typeof SECTIONS)[number];

export function buildStats(
  user: Session,
  state: AchievementState,
  now = new Date(),
): AchievementStats {
  const pages = buildPages(readAlbum(albumKey(user)));
  const cards = pages.flatMap((p) => p.cards);
  const discovered = cards.filter((c) => c.discovered);
  const found = (pageId: string) =>
    pages.find((p) => p.id === pageId)?.cards.filter((c) => c.discovered).length ?? 0;

  const sections = new Set(state.sections);
  if (albumDone(pages)) sections.add("collections");
  const explored = new Set(state.explored);
  if (albumDone(pages)) explored.add("collections");
  const completedSections = SECTIONS.filter((id) => sections.has(id)).length;
  const exploredAreas = SECTIONS.filter((id) => explored.has(id)).length;
  const totalSections = SECTIONS.length;

  const kindCount = (kind: string) => state.journal.filter((e) => e.kind === kind).length;
  const span = lifeSpan(state.birthday, now);

  return {
    lifetimeDays: span?.totalDays ?? null,
    totalVisits: state.visits,
    totalCollections: discovered.length,
    totalCards: cards.length,
    discoveredCards: discovered.length,
    musicCards: found("music"),
    placeCards: found("places"),
    exploredCategories: pages.filter((p) => p.cards.some((c) => c.discovered)).length,
    discoveredEasterEggs: state.eggs.length,
    discoveredAnimals: state.animals.length,
    exploredAreas,
    completedSections,
    totalSections,
    worldCompletion: completedSections / totalSections,
    distinctSurprises: state.surprises.length,
    journalMoments: kindCount("moment"),
    journalHappiness: kindCount("happiness"),
    journalIdeas: kindCount("idea"),
    journalGrowth: kindCount("growth"),
    plannedEvent: state.confirmations.planned,
    organizedEvent: state.confirmations.organized,
    dogFound: state.animals.includes("border-collie"),
  };
}
