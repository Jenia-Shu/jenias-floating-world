/**
 * The pages themselves: the printed left column, the card grid on the right,
 * and the closed book seen from the shelf. All presentational — the flip and
 * page-turn state lives in CollectionsPage.
 */

import type { CSSProperties, MouseEvent } from "react";
import type { CollectionCard, CollectionPage, PageAside } from "@/lib/world/collections";
import { pick, type Lang } from "@/lib/i18n";
import { CardBack, CardFace, INK } from "./CardView";

const BODY = "#465a72";
const MUTE = "#7d9fc4";
const GOLD = "#a8813f";

const L = (lang: Lang, en: string, zh: string) => pick(lang, en, zh);

/* ------------------------------------------------------------------- cards */

export function CardTile({
  card,
  lang,
  interactive,
  editing,
  onOpen,
  onEdit,
}: {
  card: CollectionCard;
  lang: Lang;
  interactive: boolean;
  editing: boolean;
  onOpen: (card: CollectionCard, event: MouseEvent<HTMLButtonElement>) => void;
  onEdit: (card: CollectionCard) => void;
}) {
  const title = pick(lang, card.title.en, card.title.zh);
  return (
    <div
      className="card-shell relative mx-auto w-full max-w-[13rem]"
      style={{ aspectRatio: "5 / 7", filter: "drop-shadow(0 14px 20px rgba(31,52,77,0.16))" }}
    >
      <button
        type="button"
        disabled={!interactive}
        onClick={(event) => onOpen(card, event)}
        aria-label={
          card.discovered ? title : L(lang, `Turn card ${card.num}`, `翻开第 ${card.num} 张卡片`)
        }
        className="group absolute inset-0 block w-full rounded-[0.45rem] outline-none transition-transform duration-300 hover:-translate-y-1 focus-visible:-translate-y-1 disabled:cursor-default disabled:hover:translate-y-0"
      >
        <div
          className="absolute inset-0"
          style={{
            transformStyle: "preserve-3d",
            transform: card.discovered ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: "transform 700ms cubic-bezier(.2,.6,.3,1)",
          }}
        >
          <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
            <CardBack num={card.num} />
          </div>
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <CardFace card={card} lang={lang} full={false} />
          </div>
        </div>
        <span
          className="pointer-events-none absolute inset-0 rounded-[0.45rem] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ boxShadow: "0 14px 26px -14px rgba(31,52,77,0.55)" }}
          aria-hidden
        />
      </button>
      {editing && interactive && (
        <button
          type="button"
          onClick={() => onEdit(card)}
          className="absolute -right-1.5 -top-1.5 z-10 grid h-6 w-6 place-items-center rounded-full bg-white text-[0.62rem] leading-none transition hover:bg-[#fbf3e2]"
          style={{
            color: INK,
            boxShadow: "0 3px 8px -3px rgba(31,52,77,0.5)",
            border: "1px solid rgba(47,65,86,0.18)",
          }}
          aria-label={L(lang, `Edit ${title}`, `编辑 ${title}`)}
        >
          ✎
        </button>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- left page */

function Aside({ aside, lang }: { aside: PageAside; lang: Lang }) {
  return (
    <section
      className="mt-5 rounded-[0.4rem] px-3 py-3"
      style={{ border: "1px dashed rgba(47,65,86,0.22)", background: "rgba(255,255,255,0.4)" }}
    >
      <p
        className="text-[0.5rem] font-semibold uppercase tracking-[0.24em]"
        style={{ color: MUTE }}
      >
        {pick(lang, aside.title.en, aside.title.zh)}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {aside.cities.map((city) => (
          <span
            key={city.name.en}
            className="rounded-[0.25rem] px-2 py-1 text-[0.6rem]"
            style={{
              background: city.tint,
              color: INK,
              boxShadow: "inset 0 0 0 1px rgba(47,65,86,0.14)",
            }}
          >
            {pick(lang, city.name.en, city.name.zh)}
          </span>
        ))}
      </div>
      <ul className="mt-2 space-y-0.5">
        {aside.reasons.map((reason) => (
          <li
            key={reason.en}
            className="flex gap-1.5 text-[0.56rem] leading-snug"
            style={{ color: BODY }}
          >
            <span
              aria-hidden
              className="mt-[0.4em] block h-[2px] w-[2px] shrink-0 rounded-full"
              style={{ background: GOLD }}
            />
            {pick(lang, reason.en, reason.zh)}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[0.52rem] italic leading-snug" style={{ color: MUTE }}>
        {pick(lang, aside.note.en, aside.note.zh)}
      </p>
    </section>
  );
}

export function LeftPage({
  page,
  lang,
  wide = true,
}: {
  page: CollectionPage;
  lang: Lang;
  wide?: boolean;
}) {
  const found = page.cards.filter((card) => card.discovered).length;
  const total = page.cards.length;
  const done = total > 0 && found === total;
  const pct = total === 0 ? 0 : Math.round((found / total) * 100);

  return (
    <div className="flex h-full flex-col px-6 py-7 sm:px-10 sm:py-9">
      <p className="text-[0.52rem] uppercase tracking-[0.34em]" style={{ color: MUTE }}>
        PAGE {String(page.order).padStart(2, "0")} / 05
      </p>
      <h2
        className="mt-3 font-display text-[2.1rem] leading-[1.05] sm:text-[2.7rem]"
        style={{ color: INK }}
      >
        {pick(lang, page.title.en, page.title.zh)}
      </h2>
      <p className="mt-2.5 text-[0.58rem] uppercase tracking-[0.18em]" style={{ color: MUTE }}>
        {pick(lang, page.subtitle.en, page.subtitle.zh)}
      </p>
      <span className="mt-5 h-px w-14" style={{ background: GOLD, opacity: 0.75 }} aria-hidden />
      <p
        className="mt-5 max-w-[24rem] text-[0.82rem] leading-[1.85] sm:text-[0.88rem]"
        style={{ color: BODY }}
      >
        {pick(lang, page.intro.en, page.intro.zh)}
      </p>

      {page.aside && <Aside aside={page.aside} lang={lang} />}

      <div className={`mt-auto pt-5 ${wide ? "" : "hidden"}`}>
        <div
          className="flex items-baseline justify-between text-[0.5rem] uppercase tracking-[0.22em]"
          style={{ color: MUTE }}
        >
          <span>{L(lang, "On this page", "本页进度")}</span>
          <span className="tabular-nums">
            {found} / {total}
          </span>
        </div>
        <div
          className="mt-2 h-[3px] w-full overflow-hidden rounded-full"
          style={{ background: "rgba(47,65,86,0.12)" }}
        >
          <span
            className="block h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: done ? GOLD : MUTE,
              transition: "width 500ms ease-out, background 400ms",
            }}
          />
        </div>
        <p className="mt-3 text-[0.58rem]" style={{ color: done ? GOLD : MUTE }}>
          {done
            ? L(lang, "Every card on this page is face up.", "本页收藏已全部探索。")
            : L(
                lang,
                `${total - found} card(s) still face down.`,
                `还差 ${total - found} 张卡片。`,
              )}
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- right page */

export function RightPage({
  page,
  lang,
  wide,
  interactive,
  editing,
  isLast,
  onOpen,
  onEdit,
  onAdd,
  onNext,
  onWall,
}: {
  page: CollectionPage;
  lang: Lang;
  wide: boolean;
  interactive: boolean;
  editing: boolean;
  isLast: boolean;
  onOpen: (card: CollectionCard, event: MouseEvent<HTMLButtonElement>) => void;
  onEdit: (card: CollectionCard) => void;
  onAdd: () => void;
  onNext: () => void;
  onWall: () => void;
}) {
  const threeAcross = wide && page.cards.length > 4;
  const tileBasis = threeAcross ? "w-[calc(33.333%-0.667rem)]" : "w-[calc(50%-0.5rem)]";
  const found = page.cards.filter((card) => card.discovered).length;
  const total = page.cards.length;
  const done = total > 0 && found === total;

  return (
    <div className="flex h-full flex-col px-5 py-6 sm:px-7">
      <div className="flex items-baseline justify-between">
        <p className="text-[0.5rem] uppercase tracking-[0.3em]" style={{ color: MUTE }}>
          {pick(lang, page.title.en, page.title.zh)}
        </p>
        <p className="text-[0.5rem] tabular-nums tracking-[0.18em]" style={{ color: MUTE }}>
          {String(page.order).padStart(2, "0")} / 05
        </p>
      </div>

      <div className={`mt-3 flex min-h-0 flex-1 gap-3 ${wide ? "" : "flex-col"}`}>
        <div className="flex min-h-0 flex-1 flex-wrap content-center justify-center gap-3 sm:gap-4">
          {page.cards.map((card) => (
            <div key={card.id} className={`${tileBasis} max-w-[13rem]`}>
              <CardTile
                card={card}
                lang={lang}
                interactive={interactive}
                editing={editing}
                onOpen={onOpen}
                onEdit={onEdit}
              />
            </div>
          ))}
          {editing && interactive && (
            <button
              type="button"
              onClick={onAdd}
              className={`grid place-items-center rounded-[0.45rem] text-[1.1rem] transition hover:bg-white/50 ${tileBasis} max-w-[13rem]`}
              style={{
                aspectRatio: "5 / 7",
                border: "1px dashed rgba(47,65,86,0.3)",
                color: MUTE,
              }}
              aria-label={L(lang, "Add a card", "添加一张卡片")}
            >
              ＋
            </button>
          )}
        </div>

        <aside
          className={
            wide
              ? "flex w-[8.5rem] shrink-0 flex-col justify-between border-l pl-4"
              : "flex shrink-0 flex-row items-center justify-between gap-3 border-t pt-3"
          }
          style={{ borderColor: "rgba(47,65,86,0.12)" }}
        >
          <div className={wide ? "" : "min-w-0 flex-1"}>
            <p
              className="text-[0.48rem] font-semibold uppercase tracking-[0.24em]"
              style={{ color: GOLD }}
            >
              {L(lang, "Progress", "探索进度")}
            </p>
            <p className="mt-1 text-[0.58rem] leading-snug" style={{ color: INK }}>
              {done
                ? L(lang, "This page is fully explored.", "本页收藏已全部探索。")
                : L(
                    lang,
                    `${total - found} card(s) still face down.`,
                    `还差 ${total - found} 张卡片。`,
                  )}
            </p>
            <div className="mt-2 flex gap-1">
              {page.cards.map((card) => (
                <span
                  key={card.id}
                  className="h-[3px] flex-1 rounded-full"
                  style={{
                    background: card.discovered ? GOLD : "rgba(47,65,86,0.16)",
                    transition: "background 400ms",
                  }}
                />
              ))}
            </div>
          </div>

          <div className={wide ? "" : "shrink-0"}>
            <button
              type="button"
              disabled={!done || !interactive}
              onClick={isLast ? onWall : onNext}
              className="w-full rounded-[0.4rem] px-3 py-3 text-[0.62rem] font-semibold tracking-wide text-white transition enabled:hover:brightness-105"
              style={{
                background: done && interactive ? INK : "rgba(47,65,86,0.28)",
                cursor: done && interactive ? "pointer" : "not-allowed",
                boxShadow: done && interactive ? "0 10px 18px -12px rgba(31,52,77,0.85)" : "none",
              }}
            >
              {isLast ? L(lang, "To the badges", "前往徽章墙") : L(lang, "Next page", "下一页")}{" "}
              <span aria-hidden>→</span>
            </button>
            <p
              className="mt-1.5 text-center text-[0.46rem] uppercase tracking-[0.18em]"
              style={{ color: MUTE }}
            >
              {done ? L(lang, "unlocked", "已解锁") : L(lang, "locked", "未解锁")}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- closed book */

const cloth: CSSProperties = {
  background: "linear-gradient(150deg,#cfe0ee 0%,#adc9e4 46%,#8caece 100%)",
  boxShadow:
    "0 30px 60px -30px rgba(31,52,77,0.55), inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -3px 10px rgba(31,52,77,0.18)",
};

export function BookCover({ lang, open }: { lang: Lang; open: boolean }) {
  return (
    <div
      className="relative h-full w-full rounded-l-[0.25rem] rounded-r-[0.4rem]"
      style={{
        ...cloth,
        transformOrigin: "left center",
        transform: `rotateY(${open ? -168 : 0}deg)`,
        transformStyle: "preserve-3d",
        transition: "transform 1000ms cubic-bezier(.35,.02,.3,1)",
        backfaceVisibility: "hidden",
      }}
    >
      <div
        className="absolute inset-0 rounded-l-[0.25rem] rounded-r-[0.4rem] opacity-[0.16]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.9) 0 1px, transparent 1px 3px), repeating-linear-gradient(0deg, rgba(255,255,255,0.9) 0 1px, transparent 1px 3px)",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-y-0 left-0 w-[13px] rounded-l-[0.25rem]"
        style={{ background: "linear-gradient(90deg,rgba(31,52,77,0.32),rgba(31,52,77,0.05))" }}
        aria-hidden
      />
      <div
        className="absolute inset-[18px] rounded-[0.15rem]"
        style={{ border: "1px solid rgba(232,208,158,0.6)" }}
        aria-hidden
      />
      <div
        className="absolute inset-[22px] rounded-[0.1rem]"
        style={{ border: "1px solid rgba(232,208,158,0.22)" }}
        aria-hidden
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <span
          className="h-8 w-8 rotate-45"
          style={{ border: "1px solid rgba(232,208,158,0.7)" }}
          aria-hidden
        />
        <p
          className="mt-7 text-[0.92rem] font-semibold uppercase leading-snug tracking-[0.16em]"
          style={{ color: "#22374d" }}
        >
          JENIA&apos;S <span style={{ color: "#7c5f2c" }}>COLLECTIONS</span>
        </p>
        <span className="mt-3 h-px w-12" style={{ background: "rgba(31,52,77,0.3)" }} aria-hidden />
        <p
          className="mt-3 text-[0.58rem] italic tracking-[0.04em]"
          style={{ color: "rgba(31,52,77,0.66)" }}
        >
          A Little Archive of My World
        </p>
      </div>
      <span
        className="pointer-events-none absolute inset-y-0 right-[-6px] w-[6px] rounded-r-[2px]"
        style={{ background: "repeating-linear-gradient(0deg,#f5efe3 0 2px,#ded3bf 2px 3px)" }}
        aria-hidden
      />
      <span className="sr-only">
        {L(lang, "Jenia's Collections, closed album", "Jenia 的收藏册，合起状态")}
      </span>
    </div>
  );
}

/** The closed album as it sits on the shelf in front of the badge wall. */
export function ShelfAlbum({ lang, onOpen }: { lang: Lang; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative block h-[9.5rem] w-[6.6rem] shrink-0 rounded-l-[0.15rem] rounded-r-[0.25rem] outline-none transition-transform duration-500 hover:-translate-y-1 focus-visible:-translate-y-1"
      aria-label={L(lang, "Open the album again", "再次翻开收藏册")}
    >
      <div className="absolute inset-0" style={cloth}>
        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(255,255,255,0.9) 0 1px, transparent 1px 3px), repeating-linear-gradient(0deg, rgba(255,255,255,0.9) 0 1px, transparent 1px 3px)",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-y-0 left-0 w-2"
          style={{ background: "rgba(31,52,77,0.28)" }}
          aria-hidden
        />
        <div
          className="absolute inset-[9px] rounded-[0.1rem]"
          style={{ border: "1px solid rgba(232,208,158,0.55)" }}
          aria-hidden
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
          <span
            className="block h-4 w-4 rotate-45"
            style={{ border: "1px solid rgba(232,208,158,0.65)" }}
            aria-hidden
          />
          <p
            className="mt-3 text-[0.4rem] font-semibold uppercase leading-tight tracking-[0.12em]"
            style={{ color: "#22374d" }}
          >
            JENIA&apos;S COLLECTIONS
          </p>
        </div>
      </div>
    </button>
  );
}
