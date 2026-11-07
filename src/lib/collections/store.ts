/**
 * The album's memory.
 *
 * Everything the visitor does — a card turned over, a page finished, a badge
 * earned, a card she wrote herself — is kept in one localStorage record per
 * visitor, keyed off the same name the map uses. Seeds stay the source of truth
 * for the content she gave; edits live beside them as overrides so a seed can
 * always be restored by deleting one key.
 */

import {
  BADGES,
  PAGE_SEEDS,
  type ArtKey,
  type Bi,
  type CardCategory,
  type CardDetail,
  type CollectionCard,
  type CollectionPage,
  type PageSeed,
} from "@/lib/world/collections";
import { visitedKey, type Session } from "@/lib/user";

export type CardContent = {
  category: CardCategory;
  title: Bi;
  subtitle: Bi;
  source: Bi | null;
  description: Bi;
  personalNote: Bi;
  tags: Bi[];
  details: CardDetail[];
  coverImage: string | null;
  art: ArtKey | null;
  tint: string;
  label: Bi | null;
};

export type AlbumState = {
  v: 1;
  discovered: string[];
  badges: string[];
  overrides: Record<string, CardContent>;
  removed: string[];
  custom: CollectionCard[];
};

export function albumKey(user: Session | string): string {
  return `${visitedKey(user)}:album:v1`;
}

export function emptyAlbum(): AlbumState {
  return {
    v: 1,
    discovered: [],
    badges: [],
    overrides: {},
    removed: [],
    custom: [],
  };
}

function strList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];
}

function isBi(value: unknown): value is Bi {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as Bi).en === "string" &&
    typeof (value as Bi).zh === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isDetail(value: unknown): value is CardDetail {
  if (!isRecord(value)) return false;
  return isBi(value["label"]) && Array.isArray(value["items"]) && value["items"].every(isBi);
}

function isCard(value: unknown): value is CollectionCard {
  if (!isRecord(value)) return false;
  return (
    typeof value["id"] === "string" &&
    typeof value["pageId"] === "string" &&
    typeof value["num"] === "string" &&
    typeof value["tint"] === "string" &&
    typeof value["createdAt"] === "number" &&
    isBi(value["title"]) &&
    isBi(value["subtitle"]) &&
    isBi(value["description"]) &&
    isBi(value["personalNote"])
  );
}

function normalizeCard(card: CollectionCard): CollectionCard {
  return {
    ...card,
    source: isBi(card.source) ? card.source : null,
    label: isBi(card.label) ? card.label : null,
    tags: Array.isArray(card.tags) ? card.tags.filter(isBi) : [],
    details: Array.isArray(card.details) ? card.details.filter(isDetail) : [],
    coverImage: typeof card.coverImage === "string" ? card.coverImage : null,
    art: typeof card.art === "string" ? (card.art as ArtKey) : null,
    discovered: card.discovered === true,
    custom: card.custom === true,
  };
}

export function readAlbum(key: string): AlbumState {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return emptyAlbum();
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data)) return emptyAlbum();

    const overrides: Record<string, CardContent> = {};
    if (isRecord(data["overrides"])) {
      for (const [id, value] of Object.entries(data["overrides"])) {
        if (
          isRecord(value) &&
          isBi(value["title"]) &&
          isBi(value["subtitle"]) &&
          isBi(value["description"]) &&
          isBi(value["personalNote"])
        ) {
          overrides[id] = value as CardContent;
        }
      }
    }

    return {
      v: 1,
      discovered: strList(data["discovered"]),
      badges: [...new Set(strList(data["badges"]))],
      overrides,
      removed: strList(data["removed"]),
      custom: (Array.isArray(data["custom"]) ? data["custom"] : [])
        .filter(isCard)
        .map(normalizeCard),
    };
  } catch {
    return emptyAlbum();
  }
}

/** Returns false when storage refused the write (quota, private mode). */
export function writeAlbum(key: string, state: AlbumState): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function withState(card: CollectionCard, found: Set<string>): CollectionCard {
  return { ...card, discovered: found.has(card.id) };
}

/** Seeds and the visitor's own cards, merged and flagged with what she has found. */
export function buildPages(state: AlbumState): CollectionPage[] {
  const found = new Set(state.discovered);
  const removed = new Set(state.removed);

  return PAGE_SEEDS.map((seed: PageSeed) => {
    const cards: CollectionCard[] = [];

    for (const base of seed.cards) {
      if (removed.has(base.id)) continue;
      const override = state.overrides[base.id];
      const card: CollectionCard = override
        ? { ...base, ...override, discovered: false }
        : { ...base, discovered: false };
      cards.push(withState(card, found));
    }

    for (const custom of state.custom) {
      if (custom.pageId !== seed.id) continue;
      cards.push(withState(custom, found));
    }

    cards.sort((a, b) => a.createdAt - b.createdAt);
    return { ...seed, cards };
  });
}

/** A page is finished when every card on it is face up (an emptied page counts). */
export function pageDone(page: CollectionPage): boolean {
  return page.cards.every((card) => card.discovered);
}

export function albumDone(pages: CollectionPage[]): boolean {
  return pages.length > 0 && pages.every(pageDone);
}

/** Badges for finished pages, plus the album badge once everything is done. */
export function derivedBadges(pages: CollectionPage[]): string[] {
  const done = new Set(pages.filter(pageDone).map((page) => page.id));
  const all = albumDone(pages);
  return BADGES.filter((badge) => (badge.pageId ? done.has(badge.pageId) : all)).map(
    (badge) => badge.id,
  );
}

/* ------------------------------------------------------------- mutations */

export function discover(state: AlbumState, ids: string[]): AlbumState {
  const next = new Set(state.discovered);
  let changed = false;
  for (const id of ids) {
    if (!next.has(id)) {
      next.add(id);
      changed = true;
    }
  }
  return changed ? { ...state, discovered: [...next] } : state;
}

export function saveContent(
  state: AlbumState,
  card: CollectionCard,
  content: CardContent,
): AlbumState {
  if (card.custom) {
    return {
      ...state,
      custom: state.custom.map((c) => (c.id === card.id ? { ...c, ...content } : c)),
    };
  }
  return { ...state, overrides: { ...state.overrides, [card.id]: content } };
}

export function addCard(state: AlbumState, pageId: string, content: CardContent): AlbumState {
  const stamp = Date.now();
  const card: CollectionCard = {
    ...content,
    id: `custom-${stamp.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    pageId,
    num: String(state.custom.filter((c) => c.pageId === pageId).length + 1).padStart(2, "0"),
    custom: true,
    createdAt: stamp,
    discovered: false,
  };
  return { ...state, custom: [...state.custom, card] };
}

export function deleteCard(state: AlbumState, card: CollectionCard): AlbumState {
  const discovered = state.discovered.filter((id) => id !== card.id);
  if (card.custom) {
    return { ...state, discovered, custom: state.custom.filter((c) => c.id !== card.id) };
  }
  return {
    ...state,
    discovered,
    removed: [...state.removed.filter((id) => id !== card.id), card.id],
  };
}

/** Put a seed card back to what it was before she edited it. */
export function restoreCard(state: AlbumState, card: CollectionCard): AlbumState {
  if (!state.overrides[card.id]) return state;
  const overrides = { ...state.overrides };
  delete overrides[card.id];
  return { ...state, overrides };
}
