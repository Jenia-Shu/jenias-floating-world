/**
 * The album. One closed book on a desk, five spreads inside it, a page that
 * really turns, cards that lift off the paper and flip, and the badge wall the
 * album comes to rest in front of.
 *
 * All the paper and print lives in AlbumPages; all the memory lives in
 * lib/collections/store. This file only owns the scene: which stage we are in,
 * which page is open, what is flipping, and what is being edited.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { LangSwitch } from "@/components/LangSwitch";
import { pick, t, useLang } from "@/lib/i18n";
import { currentSession } from "@/lib/user";
import {
  BADGES,
  type Badge,
  type CollectionCard,
  type CollectionPage,
} from "@/lib/world/collections";
import {
  addCard,
  albumDone,
  albumKey,
  buildPages,
  deleteCard,
  derivedBadges,
  discover,
  emptyAlbum,
  pageDone,
  readAlbum,
  restoreCard,
  saveContent,
  writeAlbum,
  type AlbumState,
} from "@/lib/collections/store";
import { BookCover, LeftPage, RightPage, ShelfAlbum } from "./AlbumPages";
import { CardBack, CardFace, INK } from "./CardView";
import { CardEditor } from "./CardEditor";

const BODY = "#465a72";
const MUTE = "#7d9fc4";
const GOLD = "#a8813f";

type Stage = "closed" | "opening" | "reading" | "closing" | "wall";

type Rect = { left: number; top: number; width: number; height: number };

type Props = {
  seen: boolean;
  onClose: () => void;
  onDone: () => void;
  onHome: () => void;
  /** Called the moment the album is finished, so the map can unlock without closing. */
  onComplete?: (() => void) | undefined;
};

export function CollectionsPage({ onClose, onDone, onHome, onComplete }: Props) {
  const [lang] = useLang();
  const ui = t(lang);
  const L = (en: string, zh: string) => pick(lang, en, zh);

  /* ------------------------------------------------------------- memory */

  const storeKey = useRef<string | null>(null);
  const [state, setState] = useState<AlbumState>(() => {
    const session = currentSession();
    if (!session) return emptyAlbum();
    const key = albumKey(session);
    storeKey.current = key;
    return readAlbum(key);
  });
  const [warn, setWarn] = useState(false);

  const commit = useCallback((mutate: (prev: AlbumState) => AlbumState) => {
    setState((prev) => {
      const next = mutate(prev);
      if (next === prev) return prev;
      const key = storeKey.current;
      if (key && !writeAlbum(key, next)) setWarn(true);
      return next;
    });
  }, []);

  const pages = useMemo(() => buildPages(state), [state]);
  const done = useMemo(() => albumDone(pages), [pages]);
  const badges = useMemo(
    () => new Set([...state.badges, ...derivedBadges(pages)]),
    [state.badges, pages],
  );
  const found = useMemo(
    () => pages.reduce((sum, page) => sum + page.cards.filter((card) => card.discovered).length, 0),
    [pages],
  );
  const total = useMemo(() => pages.reduce((sum, page) => sum + page.cards.length, 0), [pages]);

  /* -------------------------------------------------------------- scene */

  const [stage, setStage] = useState<Stage>("closed");
  const [pageIndex, setPageIndex] = useState(0);
  const [wide, setWide] = useState(true);
  const [turn, setTurn] = useState<{ from: number; to: number } | null>(null);
  const [flipping, setFlipping] = useState(false);
  const [lifted, setLifted] = useState<{ card: CollectionCard; rect: Rect } | null>(null);
  const [liftedOpen, setLiftedOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editor, setEditor] = useState<{ card: CollectionCard | null; pageId: string } | null>(
    null,
  );
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setWide(window.innerWidth >= 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (stage === "opening") {
      const timer = setTimeout(() => setStage("reading"), 900);
      return () => clearTimeout(timer);
    }
    if (stage === "closing") {
      const timer = setTimeout(() => setStage("wall"), 900);
      return () => clearTimeout(timer);
    }
    return;
  }, [stage]);

  const page: CollectionPage = pages[pageIndex] ?? pages[0]!;
  const lastPage = pageIndex >= pages.length - 1;

  // The region counts as explored as soon as the album is finished, without
  // closing the panel — the map stays in sync either way.
  const announced = useRef(false);
  useEffect(() => {
    if (!done || announced.current) return;
    announced.current = true;
    onComplete?.();
    const ids = derivedBadges(pages);
    if (ids.some((id) => !state.badges.includes(id))) {
      commit((prev) => ({ ...prev, badges: [...new Set([...prev.badges, ...ids])] }));
    }
  }, [done, pages, state.badges, commit, onComplete]);

  const goReading = (at = 0) => {
    setPageIndex(at);
    setStage("reading");
  };

  const openBook = () => {
    const unfinished = pages.findIndex((item) => !pageDone(item));
    setStage("opening");
    setPageIndex(unfinished < 0 ? 0 : unfinished);
  };

  const closeBook = () => {
    setTurn(null);
    setStage("closing");
  };

  const nextPage = () => {
    if (turn) return;
    if (lastPage) return;
    if (!wide) {
      setPageIndex((index) => Math.min(index + 1, pages.length - 1));
      scroller.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setTurn({ from: pageIndex, to: pageIndex + 1 });
  };

  useEffect(() => {
    if (!turn) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setFlipping(true));
    });
    const timer = setTimeout(() => {
      setPageIndex(turn.to);
      setTurn(null);
      setFlipping(false);
    }, 950);
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
      clearTimeout(timer);
    };
  }, [turn]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [pageIndex]);

  /* -------------------------------------------------------------- cards */

  const openCard = (card: CollectionCard, event: MouseEvent<HTMLButtonElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    setLifted({
      card,
      rect: { left: box.left, top: box.top, width: box.width, height: box.height },
    });
    setLiftedOpen(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setLiftedOpen(true)));
    if (!card.discovered) commit((prev) => discover(prev, [card.id]));
  };

  const closeCard = useCallback(() => {
    setLiftedOpen(false);
    setTimeout(() => setLifted(null), 480);
  }, []);

  useEffect(() => {
    if (!lifted) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCard();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lifted, closeCard]);

  /* ------------------------------------------------------------- editor */

  const saveEditor = (content: Parameters<typeof saveContent>[2]) => {
    if (!editor) return;
    if (editor.card) {
      const card = editor.card;
      commit((prev) => saveContent(prev, card, content));
    } else {
      const pageId = editor.pageId;
      commit((prev) => addCard(prev, pageId, content));
    }
    setEditor(null);
  };

  /* --------------------------------------------------------------- view */

  const totalCards = total;
  const progressLabel = `${found} / ${totalCards}`;

  return (
    <div
      ref={scroller}
      className="world-page fixed inset-0 z-30 overflow-y-auto"
      style={{ background: "linear-gradient(180deg,#f7f3ea 0%,#eef2f6 46%,#e6edf3 100%)" }}
    >
      <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-5 sm:px-7 sm:pt-7">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="glass" size="sm" onClick={onDone}>
              <span aria-hidden>←</span> {ui.map}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTurn(null);
                setStage("closed");
              }}
            >
              {L("Cover", "封面")}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="hidden rounded-full px-3 py-1 text-[0.52rem] uppercase tracking-[0.2em] sm:inline"
              style={{
                background: "rgba(255,255,255,0.6)",
                color: GOLD,
                boxShadow: "inset 0 0 0 1px rgba(47,65,86,0.12)",
              }}
            >
              {L("Collected", "已收藏")} {progressLabel}
            </span>
            {done && (
              <Button variant="ghost" size="sm" onClick={() => setStage("wall")}>
                {L("Badges", "徽章墙")}
              </Button>
            )}
            {stage === "reading" && (
              <span className="hidden sm:inline-flex">
                <Button
                  variant={editing ? "soft" : "ghost"}
                  size="sm"
                  onClick={() => setEditing((value) => !value)}
                >
                  {editing ? L("Done editing", "完成编辑") : L("Edit cards", "编辑卡片")}
                </Button>
              </span>
            )}
            <LangSwitch />
            <span className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" onClick={onHome}>
                {ui.home}
              </Button>
            </span>
          </div>
        </header>

        {warn && (
          <p
            className="mx-auto mt-3 max-w-xl rounded-[0.4rem] px-3 py-2 text-center text-[0.66rem]"
            style={{ background: "rgba(168,68,47,0.08)", color: "#a8442f" }}
            role="alert"
          >
            {L(
              "This browser refused to save — progress may not survive a refresh. Free some space or allow site data.",
              "这个浏览器没能保存进度，刷新后可能丢失。可以清理一点存储空间，或允许本站保存数据。",
            )}
          </p>
        )}

        <div className="relative mt-4 min-h-[70vh]">
          {(stage === "opening" || stage === "reading" || stage === "closing") && page && (
            <div className={stage === "closing" ? "album-settle-out" : "album-settle-in"}>
              <div className="mx-auto w-full max-w-[1180px]" style={{ perspective: "2400px" }}>
                <div
                  className="album-book relative grid rounded-[0.6rem]"
                  style={{
                    gridTemplateColumns: wide ? "0.86fr 1.14fr" : "1fr",
                    minHeight: wide ? "min(82vh, 800px)" : undefined,
                    transform: "rotateX(2.2deg)",
                    boxShadow:
                      "0 44px 76px -42px rgba(31,52,77,0.55), 0 2px 0 rgba(255,255,255,0.6) inset",
                    background: "linear-gradient(180deg,#f6f0e4,#efe7d8)",
                  }}
                >
                  {wide && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-y-6 left-1/2 z-30 w-[18px] -translate-x-1/2"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(31,52,77,0) 0%, rgba(31,52,77,0.05) 40%, rgba(31,52,77,0.08) 50%, rgba(31,52,77,0.05) 60%, rgba(31,52,77,0) 100%)",
                      }}
                    />
                  )}
                  <div className="album-sheet-face relative z-0 min-h-0 rounded-l-[0.6rem]">
                    <LeftPage
                      page={turn ? (pages[turn.from] ?? page) : page}
                      lang={lang}
                      wide={wide}
                    />
                  </div>

                  <div className="relative z-10 min-h-0">
                    <div className="album-sheet-face h-full rounded-r-[0.6rem]">
                      <RightPage
                        page={turn ? (pages[turn.to] ?? page) : page}
                        lang={lang}
                        wide={wide}
                        interactive={!turn}
                        editing={editing}
                        isLast={turn ? turn.to >= pages.length - 1 : lastPage}
                        onOpen={openCard}
                        onEdit={(card) => setEditor({ card, pageId: card.pageId })}
                        onAdd={() => setEditor({ card: null, pageId: page.id })}
                        onNext={nextPage}
                        onWall={closeBook}
                      />
                    </div>

                    {turn && (
                      <div
                        className="absolute inset-0 z-20"
                        style={{
                          transformOrigin: "left center",
                          transformStyle: "preserve-3d",
                          transform: flipping ? "rotateY(-179deg)" : "rotateY(0deg)",
                          transition: flipping
                            ? "transform 900ms cubic-bezier(.36,.02,.28,1)"
                            : "none",
                        }}
                        aria-hidden
                      >
                        <div
                          className="album-sheet-face absolute inset-0 overflow-hidden rounded-r-[0.5rem]"
                          style={{
                            backfaceVisibility: "hidden",
                            boxShadow: "18px 0 30px -24px rgba(31,52,77,0.55)",
                            background: "linear-gradient(180deg,#f6f0e4,#efe7d8)",
                          }}
                        >
                          <RightPage
                            page={pages[turn.from] ?? page}
                            lang={lang}
                            wide={wide}
                            interactive={false}
                            editing={false}
                            isLast={false}
                            onOpen={() => {}}
                            onEdit={() => {}}
                            onAdd={() => {}}
                            onNext={() => {}}
                            onWall={() => {}}
                          />
                        </div>
                        <div
                          className="album-sheet-face absolute inset-0 overflow-hidden rounded-l-[0.5rem]"
                          style={{
                            backfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                            background: "linear-gradient(180deg,#f6f0e4,#efe7d8)",
                            boxShadow: "-18px 0 30px -24px rgba(31,52,77,0.45)",
                          }}
                        >
                          <LeftPage page={pages[turn.to] ?? page} lang={lang} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <p className="text-[0.58rem]" style={{ color: MUTE }}>
                  {L(
                    `${found} of ${totalCards} cards are face up.`,
                    `已翻开 ${found} / ${totalCards} 张卡片。`,
                  )}
                </p>
              </div>
            </div>
          )}

          {(stage === "closed" || stage === "opening" || stage === "closing") && (
            <div
              className={
                stage === "closed"
                  ? "absolute inset-0 z-30 grid place-items-center"
                  : stage === "opening"
                    ? "absolute inset-0 z-30 grid place-items-center"
                    : "album-settle-in absolute inset-0 z-30 grid place-items-center"
              }
              style={{
                opacity: stage === "opening" ? 0 : 1,
                transition: "opacity 460ms ease 240ms",
                pointerEvents: stage === "opening" || stage === "closing" ? "none" : "auto",
              }}
            >
              <div className="flex flex-col items-center">
                <div style={{ perspective: "1800px" }}>
                  <div
                    className="relative"
                    style={{ width: "min(19rem, 78vw)", height: "min(26rem, 47vh)" }}
                  >
                    <button
                      type="button"
                      onClick={stage === "closed" ? openBook : undefined}
                      className="absolute inset-0 rounded-[0.3rem] outline-none focus-visible:ring-2 focus-visible:ring-[#a8813f]"
                      aria-label={L("Open Jenia's Collections", "翻开 Jenia 的收藏册")}
                    >
                      <BookCover lang={lang} open={stage === "opening"} />
                    </button>
                  </div>
                </div>
                {stage === "closed" && (
                  <p
                    className="mt-6 text-center text-[0.62rem] uppercase tracking-[0.24em]"
                    style={{ color: MUTE }}
                  >
                    {L("Click the cover to open the album", "点击封面，翻开收藏册")}
                  </p>
                )}
              </div>
            </div>
          )}

          {stage === "wall" && (
            <BadgeWall lang={lang} badges={badges} onReopen={() => goReading(0)} onBack={onClose} />
          )}
        </div>

        <footer
          className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-5"
          style={{ borderColor: "rgba(47,65,86,0.14)" }}
        >
          <p className="text-[0.6rem]" style={{ color: MUTE }}>
            {pageDone(page) || done
              ? L("Every page of the album has been read.", "收藏册的每一页都被翻开过。")
              : L("A private archive, kept page by page.", "一本私人的收藏册，一页一页收好。")}
          </p>
          <div className="flex gap-2">
            <Button variant="soft" size="sm" onClick={onDone}>
              {ui.backToMap}
            </Button>
            <Button variant="ghost" size="sm" onClick={onHome}>
              {ui.home}
            </Button>
          </div>
        </footer>
      </div>

      {lifted && (
        <LiftedCard
          card={lifted.card}
          rect={lifted.rect}
          open={liftedOpen}
          lang={lang}
          onClose={closeCard}
        />
      )}

      {editor && (
        <CardEditor
          card={editor.card}
          lang={lang}
          onClose={() => setEditor(null)}
          onSave={saveEditor}
          onDelete={
            editor.card
              ? () => {
                  const card = editor.card;
                  if (!card) return;
                  commit((prev) => deleteCard(prev, card));
                  setEditor(null);
                }
              : undefined
          }
          onRestore={
            editor.card && !editor.card.custom && state.overrides[editor.card.id]
              ? () => {
                  const card = editor.card;
                  if (!card) return;
                  commit((prev) => restoreCard(prev, card));
                  setEditor(null);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- card */

/**
 * The card out of the album: it starts exactly where the tile was, grows to the
 * middle of the screen and flips over while it grows.
 */
function LiftedCard({
  card,
  rect,
  open,
  lang,
  onClose,
}: {
  card: CollectionCard;
  rect: Rect;
  open: boolean;
  lang: Parameters<typeof CardFace>[0]["lang"];
  onClose: () => void;
}) {
  const vw = typeof window === "undefined" ? 1280 : window.innerWidth;
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;
  const width = Math.min(480, vw - 44, Math.max(240, (vh - 168) / 1.24));
  const height = width * 1.24;

  const cx = vw / 2;
  const cy = vh / 2;
  const scale = rect.width > 0 ? rect.width / width : 1;
  const dx = rect.left + rect.width / 2 - cx;
  const dy = rect.top + rect.height / 2 - cy;
  const shift = open
    ? "translate3d(0,0,0) scale(1)"
    : `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`;

  const L = (en: string, zh: string) => pick(lang, en, zh);

  return (
    <div
      className="fixed inset-0 z-50"
      style={{
        background: open ? "rgba(21,34,50,0.42)" : "rgba(21,34,50,0)",
        transition: "background 420ms",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={pick(lang, card.title.en, card.title.zh)}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        onClick={onClose}
        autoFocus
        className="absolute z-10 grid h-9 w-9 place-items-center rounded-full text-[1.05rem] leading-none"
        style={{
          left: `calc(50% + ${width / 2 - 40}px)`,
          top: `calc(50% - ${height / 2 + 12}px)`,
          background: "rgba(255,255,255,0.9)",
          color: INK,
          boxShadow: "0 8px 18px -10px rgba(15,28,44,0.75)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 320ms 220ms",
        }}
        aria-label={L("Close the card", "关闭卡片")}
      >
        ×
      </button>

      <div
        className="absolute card-shell"
        style={{
          width,
          height,
          left: `calc(50% - ${width / 2}px)`,
          top: `calc(50% - ${height / 2}px)`,
          transform: shift,
          transformOrigin: "center center",
          transition: "transform 460ms cubic-bezier(.22,.62,.28,1)",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            transformStyle: "preserve-3d",
            transform: open ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: "transform 620ms cubic-bezier(.34,.06,.26,1) 180ms",
          }}
        >
          <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
            <CardBack num={card.num} />
          </div>
          <div
            className="absolute inset-0 overflow-hidden rounded-[0.5rem]"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              boxShadow: "0 40px 70px -34px rgba(15,28,44,0.7)",
            }}
          >
            <CardFace card={card} lang={lang} full />
          </div>
        </div>
      </div>

      <p
        className="pointer-events-none absolute inset-x-0 bottom-5 text-center text-[0.56rem] uppercase tracking-[0.26em] text-white/70"
        style={{ opacity: open ? 1 : 0, transition: "opacity 400ms 300ms" }}
      >
        {L("Click outside or press Esc to put it back", "点击空白处，或按 Esc 放回卡片")}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------- the wall */

function BadgeMark({ icon }: { icon: Badge["icon"] }) {
  const stroke = "rgba(31,52,77,0.78)";
  const common = {
    fill: "none",
    stroke,
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg viewBox="0 0 48 48" className="h-7 w-7" aria-hidden>
      {icon === "music" && (
        <g {...common}>
          <path d="M18 32V16l16-4v16" />
          <circle cx="14.5" cy="33.5" r="4" />
          <circle cx="30.5" cy="29.5" r="4" />
        </g>
      )}
      {icon === "book" && (
        <g {...common}>
          <path d="M24 15c-4-3-9-4-12-4v22c3 0 8 1 12 4 4-3 9-4 12-4V11c-3 0-8 1-12 4Z" />
          <path d="M24 15v22" />
        </g>
      )}
      {icon === "film" && (
        <g {...common}>
          <rect x="11" y="14" width="26" height="20" rx="2" />
          <path d="M17 14v20M31 14v20M11 20h6M31 20h6M11 28h6M31 28h6" />
        </g>
      )}
      {icon === "compass" && (
        <g {...common}>
          <circle cx="24" cy="24" r="13" />
          <path d="M24 10v3M24 35v3M10 24h3M35 24h3" />
          <path d="M29 19l-3.5 7.5L18 30l3.5-7.5L29 19Z" />
        </g>
      )}
      {icon === "camera" && (
        <g {...common}>
          <path d="M12 18h6l2-3h8l2 3h6v18H12V18Z" />
          <circle cx="24" cy="26" r="6" />
        </g>
      )}
      {icon === "world" && (
        <g {...common}>
          <circle cx="24" cy="24" r="13" />
          <path d="M11 24h26M24 11c4 4 6 8 6 13s-2 9-6 13c-4-4-6-8-6-13s2-9 6-13Z" />
        </g>
      )}
    </svg>
  );
}

function BadgeWall({
  lang,
  badges,
  onReopen,
  onBack,
}: {
  lang: Parameters<typeof CardFace>[0]["lang"];
  badges: Set<string>;
  onReopen: () => void;
  onBack: () => void;
}) {
  const L = (en: string, zh: string) => pick(lang, en, zh);
  const earned = BADGES.filter((badge) => badges.has(badge.id)).length;

  return (
    <div className="album-settle-in">
      <div className="flex flex-col items-center text-center">
        <p className="text-[0.52rem] uppercase tracking-[0.34em]" style={{ color: GOLD }}>
          {L("The shelf", "书架")}
        </p>
        <h2 className="mt-2 font-display text-[2.1rem] leading-tight" style={{ color: INK }}>
          {L("Badge Wall", "徽章墙")}
        </h2>
        <p className="mt-3 max-w-md text-[0.76rem] leading-relaxed" style={{ color: BODY }}>
          {L(
            "Five pages, closed and shelved. These are the little marks of having read them all.",
            "五个页面翻完，收藏册回到书架上。这些徽章，是读完这一遍留下的纪念。",
          )}
        </p>
      </div>

      <div className="mt-8 grid gap-7 lg:grid-cols-[15rem_1fr]">
        <div className="flex flex-col items-center">
          <ShelfAlbum lang={lang} onOpen={onReopen} />
          <div
            className="mt-[-3px] h-[7px] w-[13rem] rounded-[1px]"
            style={{ background: "linear-gradient(180deg,#ded1ba,#c3b294 70%,#a9997d)" }}
            aria-hidden
          />
          <div
            className="mt-[-1px] h-2 w-[13rem]"
            style={{ background: "linear-gradient(180deg, rgba(31,52,77,0.09), transparent)" }}
            aria-hidden
          />
          <p className="mt-1 text-[0.46rem] uppercase tracking-[0.24em]" style={{ color: MUTE }}>
            {L("Closed album — click to reopen", "合起的收藏册 · 点击可再次翻开")}
          </p>
          <p className="mt-4 text-[0.5rem] uppercase tracking-[0.2em]" style={{ color: GOLD }}>
            {earned} / {BADGES.length} {L("badges", "枚徽章")}
          </p>
        </div>

        <div
          className="grid grid-cols-2 gap-4 rounded-[0.6rem] p-4 sm:grid-cols-3 sm:p-5"
          style={{
            background: "linear-gradient(180deg,#f8f3e8,#efe7d7)",
            boxShadow: "inset 0 0 0 1px rgba(168,129,63,0.16), inset 0 0 46px rgba(31,52,77,0.06)",
          }}
        >
          {BADGES.map((badge) => {
            const unlocked = badges.has(badge.id);
            return (
              <div
                key={badge.id}
                className="flex flex-col items-center rounded-[0.5rem] px-3 py-5 text-center"
                style={{
                  background: unlocked ? "#fdfaf4" : "rgba(253,250,244,0.5)",
                  boxShadow: unlocked
                    ? "0 16px 26px -22px rgba(31,52,77,0.55), inset 0 0 0 1px rgba(47,65,86,0.14)"
                    : "inset 0 0 0 1px rgba(47,65,86,0.08)",
                }}
              >
                <div
                  className="grid h-[4.6rem] w-[4.6rem] place-items-center rounded-full transition"
                  style={{
                    background: `radial-gradient(circle at 32% 26%, ${badge.metal[0]}, ${badge.metal[1]})`,
                    boxShadow: unlocked
                      ? "0 16px 26px -18px rgba(31,52,77,0.85), inset 0 0 0 3px rgba(255,255,255,0.32), inset 0 -7px 12px rgba(31,52,77,0.26)"
                      : "inset 0 0 0 1px rgba(47,65,86,0.16)",
                    filter: unlocked ? undefined : "grayscale(0.9)",
                    opacity: unlocked ? 1 : 0.42,
                  }}
                >
                  <BadgeMark icon={badge.icon} />
                </div>
                <p
                  className="mt-3 text-[0.72rem] font-semibold leading-tight"
                  style={{ color: INK }}
                >
                  {pick(lang, badge.name.en, badge.name.zh)}
                </p>
                <p className="mt-1 text-[0.54rem] leading-snug" style={{ color: MUTE }}>
                  {unlocked
                    ? pick(lang, badge.caption.en, badge.caption.zh)
                    : L("Still sealed", "尚未解锁")}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <Button variant="soft" size="sm" onClick={onReopen}>
          {L("Read the album again", "再翻一遍收藏册")}
        </Button>
        <Button variant="ghost" size="sm" onClick={onBack}>
          {L("Back to the map", "回到地图")}
        </Button>
      </div>
    </div>
  );
}
