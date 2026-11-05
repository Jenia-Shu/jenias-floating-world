import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LangSwitch } from "@/components/LangSwitch";
import { pick, t, useLang } from "@/lib/i18n";
import { CARDS, KIND_LABEL, type CollectionCard } from "@/lib/world/cards";
import { currentSession, visitedKey } from "@/lib/user";

const INK = "#2f4156";
const BODY = "#465a72";
const MUTE = "#7d9fc4";
const GOLD = "#a8813f";
const FOUND_KEY = (name: string) => `${visitedKey(name)}:cards`;

function readFound(name: string): Set<string> {
  try {
    const raw = localStorage.getItem(FOUND_KEY(name));
    if (!raw) return new Set();
    const list: unknown = JSON.parse(raw);
    if (!Array.isArray(list)) return new Set();
    return new Set(list.filter((v): v is string => typeof v === "string" && CARDS.some((c) => c.id === v)));
  } catch {
    return new Set();
  }
}

function writeFound(name: string, ids: Set<string>) {
  try {
    localStorage.setItem(FOUND_KEY(name), JSON.stringify([...ids]));
  } catch {
    /* storage is optional — the album still works for this visit */
  }
}

/* ---------------------------------------------------------------- card art */

/** The back is uniform on purpose: a number and a motif, no hint of content. */
function CardBack({ card }: { card: CollectionCard }) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-between rounded-[0.55rem] p-3"
      style={{
        background: "linear-gradient(155deg,#4d6684 0%,#3d5570 52%,#31465e 100%)",
        boxShadow: "inset 0 0 0 1px rgba(226,200,145,0.35), inset 0 0 0 4px rgba(226,200,145,0.10)",
      }}
    >
      <span className="text-[0.55rem] font-medium tracking-[0.28em]" style={{ color: "rgba(232,208,158,0.75)" }}>
        MY COLLECTIONS
      </span>
      <span className="relative grid place-items-center" aria-hidden>
        <span className="block h-10 w-10 rotate-45" style={{ border: "1px solid rgba(226,200,145,0.5)" }} />
        <span className="absolute block h-5 w-5 rounded-full" style={{ border: "1px solid rgba(226,200,145,0.7)" }} />
        <span className="absolute block h-1.5 w-1.5 rounded-full" style={{ background: "rgba(226,200,145,0.8)" }} />
      </span>
      <span className="self-start font-mono text-[0.6rem] tabular-nums" style={{ color: "rgba(232,208,158,0.8)" }}>
        {card.num}
      </span>
    </div>
  );
}

function CardFace({ card, large }: { card: CollectionCard; large: boolean }) {
  const [lang] = useLang();
  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden rounded-[0.55rem]"
      style={{ background: "#fbf9f4", boxShadow: "inset 0 0 0 1px rgba(47,65,86,0.14)" }}
    >
      <div
        className="relative grid shrink-0 place-items-center"
        style={{
          height: large ? 188 : 92,
          background: `linear-gradient(150deg,${card.tint} 0%,#fbf9f4 130%)`,
        }}
      >
        <span className="grid place-items-center rounded-full" style={{ background: "rgba(255,255,255,0.55)" }}>
          <span
            className="block rotate-45"
            style={{
              width: large ? 46 : 26,
              height: large ? 46 : 26,
              border: "1px solid rgba(47,65,86,0.35)",
            }}
          />
        </span>
        <span
          className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[0.5rem] font-semibold uppercase tracking-[0.14em]"
          style={{ background: "rgba(255,255,255,0.8)", color: INK }}
        >
          {pick(lang, KIND_LABEL[card.kind].en, KIND_LABEL[card.kind].zh)}
        </span>
      </div>
      <div className={`flex min-h-0 flex-1 flex-col ${large ? "p-5" : "px-2.5 pb-2 pt-1.5"}`}>
        <p className={`font-semibold leading-tight ${large ? "text-[1.32rem]" : "text-[0.62rem]"}`} style={{ color: INK }}>
          {card.title}
        </p>
        <p className={`mt-0.5 ${large ? "text-[0.8rem]" : "text-[0.5rem]"}`} style={{ color: MUTE }}>
          {card.by}
        </p>
        {large ? (
          <>
            <span className="mt-4 h-px w-8" style={{ background: GOLD }} />
            <p className="mt-4 text-[0.88rem] leading-relaxed" style={{ color: BODY }}>
              {pick(lang, card.why.en, card.why.zh)}
            </p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {card.tags.map((tag) => (
                <span
                  key={tag.en}
                  className="rounded-full px-2.5 py-1 text-[0.62rem] tracking-wide"
                  style={{ background: "rgba(47,65,86,0.07)", color: BODY }}
                >
                  {pick(lang, tag.en, tag.zh)}
                </span>
              ))}
            </div>
            <div
              className="mt-auto flex items-center justify-between pt-3 text-[0.56rem] uppercase tracking-[0.22em]"
              style={{ borderTop: "1px solid rgba(47,65,86,0.12)", color: MUTE }}
            >
              <span className="font-mono tabular-nums">№ {card.num}</span>
              <span>{pick(lang, KIND_LABEL[card.kind].en, KIND_LABEL[card.kind].zh)}</span>
            </div>
          </>
        ) : (
          <span className="mt-auto font-mono text-[0.5rem] tabular-nums" style={{ color: MUTE }}>
            {card.num}
          </span>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- the album */

type Props = {
  seen: boolean;
  onClose: () => void;
  onDone: () => void;
  onHome: () => void;
};

export function CollectionsPage({ seen, onClose, onDone, onHome }: Props) {
  const [lang] = useLang();
  const ui = t(lang);
  const zh = lang === "zh";

  const username = useMemo(() => {
    const session = currentSession();
    return session ? session.en : "guest";
  }, []);

  const [opened, setOpened] = useState(false);
  const [found, setFound] = useState<Set<string>>(() => readFound(username));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const timers = useRef<number[]>([]);

  const after = useCallback((ms: number, fn: () => void) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((id) => window.clearTimeout(id));
  }, []);

  const active = activeId ? (CARDS.find((c) => c.id === activeId) ?? null) : null;
  const total = CARDS.length;
  const foundCount = found.size;

  const markFound = useCallback(
    (id: string) => {
      setFound((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        writeFound(username, next);
        return next;
      });
    },
    [username],
  );

  const openCard = useCallback(
    (id: string) => {
      setActiveId(id);
      setFlipped(false);
      // let the card mount face-down, then turn it
      after(70, () => {
        setFlipped(true);
        markFound(id);
      });
    },
    [after, markFound],
  );

  const closeCard = useCallback(() => {
    setFlipped(false);
    after(420, () => setActiveId(null));
  }, [after]);

  const nextCard = useCallback(() => {
    const from = activeId ? CARDS.findIndex((c) => c.id === activeId) : -1;
    const order = [...CARDS.slice(from + 1), ...CARDS.slice(0, from + 1)];
    const target = order.find((c) => !found.has(c.id) && c.id !== activeId);
    if (!target) {
      closeCard();
      return;
    }
    setFlipped(false);
    after(400, () => {
      setActiveId(target.id);
      after(80, () => {
        setFlipped(true);
        markFound(target.id);
      });
    });
  }, [activeId, after, closeCard, found, markFound]);

  const reset = () => {
    setFound(new Set());
    writeFound(username, new Set());
  };

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto overscroll-contain bg-[linear-gradient(180deg,#f9f5ed_0%,#eef2f6_46%,#dce8f2_100%)]">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/50 bg-[#f7f3ea]/82 px-4 py-3 backdrop-blur-md sm:px-8">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/70 bg-white/60 px-4 py-2 text-[0.72rem] font-medium tracking-wide backdrop-blur-md transition hover:bg-white/85"
          style={{ color: "#3c5168" }}
        >
          ← {ui.map}
        </button>
        <p className="hidden text-[0.62rem] uppercase tracking-[0.32em] sm:block" style={{ color: MUTE }}>
          {zh ? "收藏" : "Collections"}
        </p>
        <div className="flex items-center gap-2">
          <LangSwitch tone="light" />
          <button
            type="button"
            onClick={onHome}
            className="rounded-full border border-[#2f4156]/15 px-4 py-2 text-[0.72rem] tracking-wide transition hover:bg-white/60"
            style={{ color: "#3c5168" }}
          >
            {ui.home}
          </button>
        </div>
      </header>

      {!opened ? (
        /* ------------------------------------------------------- closed book */
        <div className="grid min-h-[calc(100dvh-3.5rem)] place-items-center px-5 py-14">
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => setOpened(true)}
              className="group relative block h-[380px] w-[286px] rounded-l-[0.2rem] rounded-r-[0.35rem] outline-none transition-transform duration-500 ease-out hover:-translate-y-2 focus-visible:-translate-y-2 sm:h-[430px] sm:w-[324px]"
              aria-label={zh ? "打开收藏卡册" : "Open the album"}
            >
              <span
                className="absolute inset-0 rounded-l-[0.2rem] rounded-r-[0.35rem]"
                style={{
                  background: "linear-gradient(150deg,#c7dbec 0%,#a9c7e4 48%,#8fb0d1 100%)",
                  boxShadow:
                    "0 34px 64px -26px rgba(31,52,77,0.5), 0 2px 0 rgba(255,255,255,0.4) inset, 0 -3px 12px rgba(31,52,77,0.16) inset",
                }}
              />
              {/* cloth weave */}
              <span
                className="absolute inset-0 rounded-l-[0.2rem] rounded-r-[0.35rem] opacity-[0.14]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg, rgba(255,255,255,0.9) 0 1px, transparent 1px 3px), repeating-linear-gradient(0deg, rgba(255,255,255,0.9) 0 1px, transparent 1px 3px)",
                }}
              />
              {/* spine + page block */}
              <span
                className="absolute inset-y-0 left-0 w-[14px] rounded-l-[0.2rem]"
                style={{ background: "linear-gradient(90deg,rgba(31,52,77,0.34),rgba(31,52,77,0.06))" }}
              />
              <span
                className="absolute inset-y-[7px] right-[-5px] w-[5px] rounded-r-[2px]"
                style={{ background: "repeating-linear-gradient(0deg,#f3ece0 0 2px,#ddd2be 2px 3px)" }}
              />
              {/* foil frame */}
              <span className="absolute inset-[20px] rounded-[0.1rem]" style={{ border: "1px solid rgba(232,208,158,0.55)" }} />
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
                <span className="text-[0.6rem] font-medium uppercase tracking-[0.42em]" style={{ color: "rgba(31,52,77,0.62)" }}>
                  My
                </span>
                <span
                  className="font-display text-[2.5rem] leading-none sm:text-[2.9rem]"
                  style={{ color: "#22374d", textShadow: "0 1px 0 rgba(255,255,255,0.5)" }}
                >
                  Collections
                </span>
                <span className="mt-1 h-px w-10" style={{ background: "rgba(31,52,77,0.28)" }} />
                <span className="whitespace-nowrap text-[0.52rem] uppercase tracking-[0.16em]" style={{ color: "rgba(31,52,77,0.56)" }}>
                  A little book of things I love
                </span>
              </span>
              <span
                className="pointer-events-none absolute inset-0 rounded-l-[0.2rem] rounded-r-[0.35rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: "linear-gradient(115deg,transparent 30%,rgba(255,255,255,0.32) 48%,transparent 62%)" }}
              />
            </button>
            <p className="mt-8 text-[0.7rem] tracking-[0.18em]" style={{ color: MUTE }}>
              {zh ? "轻点封面打开" : "tap the cover to open"}
            </p>
          </div>
        </div>
      ) : (
        /* --------------------------------------------------------- open book */
        <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-8 sm:px-8">
          <div
            className="relative rounded-[1.2rem] p-4 sm:p-7"
            style={{ background: "#e8dfcd", boxShadow: "0 30px 70px -32px rgba(31,52,77,0.45)" }}
          >
            <div
              className="relative rounded-[0.7rem] p-4 sm:p-8"
              style={{
                background: "linear-gradient(120deg,#fbf7ee 0%,#f6f1e5 48%,#eee7d8 100%)",
                boxShadow: "inset 0 0 0 1px rgba(47,65,86,0.1), inset 0 0 40px rgba(120,100,70,0.07)",
              }}
            >
              {/* centre gutter */}
              <span
                className="pointer-events-none absolute inset-y-4 left-1/2 hidden w-[18px] -translate-x-1/2 sm:block"
                style={{ background: "linear-gradient(90deg,transparent,rgba(47,65,86,0.09),transparent)" }}
              />

              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[0.6rem] uppercase tracking-[0.3em]" style={{ color: MUTE }}>
                  {zh ? "已发现" : "Discovered"} {foundCount} / {total}
                </p>
                <p className="text-[0.62rem]" style={{ color: MUTE }}>
                  {zh ? "点任意卡片翻开" : "tap any card to turn it over"}
                </p>
              </div>

              <div className="mx-auto grid max-w-[19rem] grid-cols-2 gap-3 sm:max-w-[32rem] sm:grid-cols-3 sm:gap-4">
                {CARDS.map((card) => {
                  const isFound = found.has(card.id);
                  return (
                    <div key={card.id} className="[perspective:900px]">
                      <button
                        type="button"
                        onClick={() => openCard(card.id)}
                        className="relative block w-full rounded-[0.55rem] transition-transform duration-300 hover:-translate-y-1 focus-visible:-translate-y-1"
                        style={{ aspectRatio: "5 / 7" }}
                        aria-label={isFound ? card.title : `${zh ? "翻开卡片" : "Turn card"} ${card.num}`}
                      >
                        <div
                          className="absolute inset-0 rounded-[0.55rem] transition-transform duration-700"
                          style={{ transformStyle: "preserve-3d", transform: isFound ? "rotateY(180deg)" : "rotateY(0deg)" }}
                        >
                          <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
                            <CardBack card={card} />
                          </div>
                          <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                            <CardFace card={card} large={false} />
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#2f4156]/10 pt-5">
                <button
                  type="button"
                  onClick={reset}
                  className="text-[0.66rem] tracking-wide underline-offset-4 hover:underline"
                  style={{ color: MUTE }}
                >
                  {zh ? "重新开始" : "start over"}
                </button>
                <p className="text-[0.62rem]" style={{ color: MUTE }}>
                  {foundCount === total
                    ? zh
                      ? "全部翻完了。"
                      : "Every card is face up."
                    : zh
                      ? `还有 ${total - foundCount} 张背面朝上。`
                      : `${total - foundCount} still face down.`}
                </p>
                <button
                  type="button"
                  onClick={seen ? onClose : onDone}
                  className="rounded-full px-5 py-2.5 text-[0.74rem] font-medium tracking-wide text-white transition hover:opacity-90"
                  style={{ background: INK }}
                >
                  {seen ? ui.backToMap : ui.seenThis}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------- large card */}
      {active && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center px-4 py-10"
          style={{ background: "rgba(23,37,54,0.42)", backdropFilter: "blur(6px)" }}
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCard();
          }}
        >
          <div className="relative w-full max-w-[22rem] sm:max-w-[24rem]">
            <button
              type="button"
              onClick={closeCard}
              className="absolute -left-1 -top-11 grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-white/15 text-white/90 backdrop-blur transition hover:bg-white/25"
              aria-label={zh ? "收起来" : "Put it back"}
            >
              <span aria-hidden className="text-lg leading-none">
                ×
              </span>
            </button>

            <div className="[perspective:1600px]">
              <div
                className="relative w-full transition-transform duration-700 ease-[cubic-bezier(.22,.61,.36,1)]"
                style={{
                  aspectRatio: "5 / 7",
                  transformStyle: "preserve-3d",
                  transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
                  <CardBack card={active} />
                </div>
                <div
                  className="absolute inset-0"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    filter: "drop-shadow(0 30px 50px rgba(15,28,44,0.45))",
                  }}
                >
                  <CardFace card={active} large />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <span className="font-mono text-[0.66rem] tabular-nums text-white/55">{active.num}</span>
              <button
                type="button"
                onClick={nextCard}
                className="rounded-full bg-white/92 px-5 py-2.5 text-[0.74rem] font-medium tracking-wide transition hover:bg-white"
                style={{ color: INK }}
              >
                {zh ? "下一张 →" : "next card →"}
              </button>
            </div>
            {foundCount === total && (
              <p className="mt-3 text-center text-[0.62rem] text-white/60">
                {zh ? "这是最后一张背面朝上的卡片。" : "That was the last card face down."}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
