/**
 * One card, drawn twice: a uniform back, and the face that only appears once it
 * is turned. The same markup is used at thumbnail size and in the large view, so
 * the face has to read at 120px and at 380px — the type scales with the card via
 * container query units (see `.card-shell` in styles.css).
 */

import { useState, type CSSProperties } from "react";
import { CATEGORY_LABEL, type ArtKey, type CollectionCard } from "@/lib/world/collections";
import { pick, type Lang } from "@/lib/i18n";

export const INK = "#2f4156";
const BODY = "#465a72";
const MUTE = "#7d9fc4";
const GOLD = "#a8813f";
const FACE = "#fbf8f1";

const STROKE = "rgba(47,65,86,0.62)";

/* ------------------------------------------------------------------ engraved art */

function ArtSvg({ art }: { art: ArtKey }) {
  const line = { stroke: STROKE };
  const faint = { stroke: STROKE, strokeOpacity: 0.4 };

  switch (art) {
    case "piano":
      return (
        <g>
          <rect x="30" y="78" width="80" height="40" rx="2" {...line} />
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <line
              key={i}
              x1={30 + i * (80 / 7)}
              y1="78"
              x2={30 + i * (80 / 7)}
              y2="118"
              {...faint}
            />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <rect
              key={i}
              x={36 + i * 13}
              y="78"
              width="7"
              height="22"
              rx="1"
              fill="rgba(47,65,86,0.5)"
              stroke="none"
            />
          ))}
          <path d="M40 136 h60" {...faint} />
          <path d="M52 60 q4 -8 -2 -14" {...faint} />
          <path d="M84 56 q4 -8 -2 -14" {...faint} />
        </g>
      );
    case "wave":
      return (
        <g>
          {[84, 102, 120].map((y, i) => (
            <path
              key={y}
              d={`M18 ${y} q 19 -16 38 0 t 38 0 t 30 0`}
              {...line}
              strokeOpacity={0.22 + i * 0.18}
            />
          ))}
          <circle cx="98" cy="58" r="11" {...faint} />
        </g>
      );
    case "feather":
      return (
        <g>
          <path d="M108 52 C 82 76 56 112 42 152" {...line} />
          <path d="M108 52 C 98 92 76 126 42 152" {...line} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path key={i} d={`M${88 - i * 8} ${74 + i * 12} l 18 -6`} {...faint} />
          ))}
          <path d="M42 152 h -8" {...faint} />
        </g>
      );
    case "ferry":
      return (
        <g>
          <path d="M34 118 h72 l -11 24 h -50 z" {...line} />
          <line x1="70" y1="58" x2="70" y2="118" {...line} />
          <path d="M70 64 l 28 32 h -28 z" {...faint} />
          <path d="M66 72 l -24 24 h 24 z" {...faint} />
          <path d="M24 152 q46 8 92 0" {...faint} />
          <path d="M30 160 q40 6 80 0" {...faint} />
        </g>
      );
    case "mirror":
      return (
        <g>
          <circle cx="70" cy="94" r="40" {...line} />
          <circle cx="70" cy="94" r="26" {...faint} />
          <path d="M46 94 q24 -17 48 0 q-24 17 -48 0" {...line} />
          <circle cx="70" cy="94" r="3" fill={STROKE} stroke="none" />
          <path d="M70 30 v -8 M70 166 v 8" {...faint} />
        </g>
      );
    case "grid":
      return (
        <g>
          {[0, 1, 2].map((row) =>
            [0, 1, 2].map((col) => {
              const filled = row === 1 && col === 1;
              return (
                <rect
                  key={`${row}-${col}`}
                  x={32 + col * 26}
                  y={64 + row * 26}
                  width="22"
                  height="22"
                  rx="2"
                  stroke={STROKE}
                  strokeOpacity={filled ? 0.75 : 0.4}
                  fill={filled ? "rgba(47,65,86,0.18)" : "none"}
                />
              );
            }),
          )}
          <path d="M32 152 h76" {...faint} />
        </g>
      );
    case "spiral":
      return (
        <g>
          <path
            d="M70 98 a9 9 0 0 1 9 9 a18 18 0 0 1 -18 18 a27 27 0 0 1 -27 -27 a36 36 0 0 1 36 -36 a45 45 0 0 1 45 45"
            {...line}
          />
          <circle cx="70" cy="98" r="2.5" fill={STROKE} stroke="none" />
        </g>
      );
    case "orbit":
      return (
        <g>
          <ellipse cx="70" cy="98" rx="52" ry="19" transform="rotate(-20 70 98)" {...line} />
          <ellipse cx="70" cy="98" rx="34" ry="12" transform="rotate(-20 70 98)" {...faint} />
          <circle cx="70" cy="98" r="11" {...line} />
          <circle cx="112" cy="74" r="4.5" fill={STROKE} stroke="none" />
          <circle cx="26" cy="120" r="2.5" fill={STROKE} stroke="none" />
        </g>
      );
    case "mountains":
      return (
        <g>
          <path d="M18 142 L48 96 L66 120 L88 84 L122 142" {...line} />
          <path d="M18 150 h104" {...faint} />
          <circle cx="99" cy="60" r="9" {...faint} />
        </g>
      );
    case "sigil":
      return (
        <g>
          <path d="M70 44 L106 66 V110 L70 132 L34 110 V66 Z" {...line} />
          <path d="M70 64 L90 88 L70 112 L50 88 Z" {...faint} />
          <circle cx="70" cy="88" r="3" fill={STROKE} stroke="none" />
          <path d="M70 132 v 12" {...faint} />
        </g>
      );
    case "cup":
      return (
        <g>
          <path d="M46 76 h48 l -6 46 a15 15 0 0 1 -15 13 h -6 a15 15 0 0 1 -15 -13 z" {...line} />
          <path d="M94 86 q18 8 0 24" {...faint} />
          <path d="M36 142 h68" {...line} />
          <path d="M60 60 q6 -8 0 -16" {...faint} />
          <path d="M80 60 q6 -8 0 -16" {...faint} />
        </g>
      );
    case "window":
      return (
        <g>
          <rect x="36" y="62" width="68" height="76" rx="2" {...line} />
          <line x1="70" y1="62" x2="70" y2="138" {...faint} />
          <line x1="36" y1="100" x2="104" y2="100" {...faint} />
          <path d="M24 52 q 18 -12 36 0" {...faint} />
          <path d="M80 52 q 18 -12 36 0" {...faint} />
          <path d="M29 152 h82" {...faint} />
        </g>
      );
    case "compass":
      return (
        <g>
          <circle cx="70" cy="96" r="44" {...line} />
          <circle cx="70" cy="96" r="32" {...faint} />
          <path
            d="M70 62 L81 104 L70 94 L59 104 Z"
            fill={STROKE}
            fillOpacity="0.35"
            stroke={STROKE}
          />
          {[
            [70, 52, 70, 46],
            [70, 140, 70, 146],
            [26, 96, 20, 96],
            [114, 96, 120, 96],
          ].map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} {...faint} />
          ))}
        </g>
      );
    case "photo":
      return (
        <g>
          <rect x="30" y="58" width="80" height="80" rx="3" {...line} />
          <path d="M38 126 l 20 -26 l 14 16 l 12 -14 l 16 24" {...faint} />
          <circle cx="92" cy="76" r="6" {...faint} />
          <rect x="52" y="44" width="36" height="8" rx="2" {...faint} />
        </g>
      );
    case "sun":
      return (
        <g>
          <circle cx="70" cy="86" r="22" {...line} />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={70 + Math.cos(a) * 30}
                y1={86 + Math.sin(a) * 30}
                x2={70 + Math.cos(a) * 38}
                y2={86 + Math.sin(a) * 38}
                {...faint}
              />
            );
          })}
          <path d="M28 138 h84" {...faint} />
          <path d="M40 148 h60" stroke={STROKE} strokeOpacity="0.25" />
        </g>
      );
    case "chengdu":
      return (
        <g>
          <path d="M24 140 h92" {...line} />
          <rect x="38" y="96" width="16" height="44" {...faint} />
          <rect x="62" y="76" width="20" height="64" {...faint} />
          <path d="M62 76 l 10 -16 l 10 16" {...faint} />
          <rect x="90" y="104" width="14" height="36" {...faint} />
          <path d="M20 154 q 24 -8 50 -2 q 26 6 50 -4" {...faint} />
          <path d="M62 96 h20 M62 110 h20 M62 124 h20" stroke={STROKE} strokeOpacity="0.25" />
        </g>
      );
    case "dali":
      return (
        <g>
          <path d="M18 126 L46 82 L66 110 L92 68 L122 126" {...line} />
          <path d="M18 134 h104" {...faint} />
          {[44, 68, 92].map((x) => (
            <g key={x} {...faint}>
              <rect x={x - 5} y="146" width="10" height="16" />
              <path d={`M${x - 5} 146 l 5 -10 l 5 10`} />
              <path d={`M${x - 8} 162 h16`} />
            </g>
          ))}
          <path d="M26 172 h88" stroke={STROKE} strokeOpacity="0.25" />
        </g>
      );
    case "lijiang":
      return (
        <g>
          <path d="M28 116 l 16 -18 l 16 18" {...line} />
          <path d="M28 116 v 30 h 32 v -30" {...faint} />
          <path d="M62 104 l 18 -20 l 18 20" {...line} />
          <path d="M62 104 v 42 h 36 v -42" {...faint} />
          <path d="M96 122 l 14 -16 l 14 16" {...faint} />
          <path d="M96 122 v 24 h 28 v -24" {...faint} />
          <path d="M28 158 q 20 8 40 0 q 20 -8 40 0 q 14 6 26 0" {...faint} />
          <circle cx="128" cy="112" r="4" {...faint} />
        </g>
      );
    case "xian":
      return (
        <g>
          <path d="M20 140 v -22 h 72" {...line} />
          <path d="M20 140 h 96" {...line} />
          <path d="M56 140 v -22 a 12 12 0 0 1 24 0 v 22" {...faint} />
          <path d="M100 140 v -46 l 12 -10 l 12 10 v 46" {...faint} />
          <path d="M100 112 h 24 M100 126 h 24" stroke={STROKE} strokeOpacity="0.3" />
          <path d="M20 126 h 72" stroke={STROKE} strokeOpacity="0.3" />
        </g>
      );
    case "bengbu":
      return (
        <g>
          <path d="M18 130 q 26 -28 52 0 q 26 28 52 0" {...line} />
          <line x1="26" y1="122" x2="26" y2="140" {...faint} />
          <line x1="114" y1="122" x2="114" y2="140" {...faint} />
          <path d="M16 140 h 108" {...faint} />
          <path d="M22 150 q 26 6 52 0 q 26 -6 48 0" {...faint} />
          <rect x="44" y="98" width="12" height="16" {...faint} />
          <rect x="84" y="104" width="10" height="12" {...faint} />
        </g>
      );
    case "beijing":
      return (
        <g>
          <path d="M44 140 v -30 h 52 v 30" {...line} />
          <path d="M30 110 q 40 -24 80 0" {...line} />
          <path d="M48 110 v -12 h 44 v 12" {...faint} />
          <path d="M40 140 h 60" {...faint} />
          <path d="M62 140 v -18 a 8 8 0 0 1 16 0 v 18" {...faint} />
          <path d="M96 140 v -46 h 16 v 46" stroke={STROKE} strokeOpacity="0.35" />
          <path d="M96 108 h 16 M96 122 h 16" stroke={STROKE} strokeOpacity="0.2" />
        </g>
      );
    case "shanghai":
      return (
        <g>
          <rect x="42" y="72" width="13" height="68" {...line} />
          <circle cx="48.5" cy="66" r="6" {...faint} />
          <rect x="64" y="90" width="14" height="50" {...faint} />
          <path d="M64 90 l 7 -18 l 7 18" {...faint} />
          <rect x="88" y="98" width="10" height="42" {...faint} />
          <path d="M20 140 h 100" {...faint} />
          <path d="M22 150 q 26 -6 46 -1 q 24 5 50 -2" {...faint} />
          <path d="M70 140 v 14" stroke={STROKE} strokeOpacity="0.2" />
        </g>
      );
    default:
      return null;
  }
}

export function CardArt({ art, tint }: { art: ArtKey | null; tint: string }) {
  return (
    <div
      className="absolute inset-0 grid place-items-center"
      style={{ background: `linear-gradient(155deg, ${tint} 0%, ${FACE} 128%)` }}
      aria-hidden
    >
      <svg
        viewBox="0 0 140 196"
        className="h-[86%] w-[86%]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ color: STROKE }}
      >
        {art ? <ArtSvg art={art} /> : <ArtSvg art="sigil" />}
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------------------- back */

export function CardBack({ num }: { num: string }) {
  const style: CSSProperties = {
    background: "linear-gradient(158deg,#4c6583 0%,#3c5470 52%,#30455d 100%)",
    boxShadow:
      "inset 0 0 0 1px rgba(230,205,152,0.38), inset 0 0 0 5px rgba(230,205,152,0.1), inset 0 0 22px rgba(16,28,42,0.45)",
  };
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[0.45rem]" style={style}>
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 4px), repeating-linear-gradient(0deg, rgba(255,255,255,0.4) 0 1px, transparent 1px 4px)",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 flex flex-col items-center justify-between px-[8%] py-[7%]">
        <span
          className="card-back-label font-medium uppercase tracking-[0.3em]"
          style={{ color: "rgba(232,208,158,0.75)" }}
        >
          JENIA&apos;S WORLD
        </span>
        <span className="relative grid aspect-square w-[46%] place-items-center" aria-hidden>
          <span
            className="absolute inset-0 rotate-45"
            style={{ border: "1px solid rgba(230,205,152,0.55)" }}
          />
          <span
            className="absolute inset-[18%] rotate-45"
            style={{ border: "1px solid rgba(230,205,152,0.3)" }}
          />
          <span
            className="absolute inset-[34%] rounded-full"
            style={{ border: "1px solid rgba(230,205,152,0.7)" }}
          />
          <span
            className="absolute inset-[45%] rounded-full"
            style={{ background: "rgba(232,208,158,0.85)" }}
          />
        </span>
        <span
          className="card-back-num self-start font-mono tabular-nums"
          style={{ color: "rgba(232,208,158,0.8)" }}
        >
          {num}
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- face */

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="card-label font-semibold uppercase tracking-[0.26em]" style={{ color: GOLD }}>
      {children}
    </p>
  );
}

function CoverMedia({
  card,
  lang,
  broken,
  onBroken,
}: {
  card: CollectionCard;
  lang: Lang;
  broken: boolean;
  onBroken: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const src = card.coverImage;

  if (src && !broken) {
    return (
      <>
        <img
          src={src}
          alt={pick(lang, card.title.en, card.title.zh)}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
          style={{ opacity: loaded ? 1 : 0 }}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={onBroken}
        />
        {!loaded && (
          <span
            className="absolute inset-0 animate-pulse"
            style={{ background: card.tint }}
            aria-hidden
          />
        )}
      </>
    );
  }
  return <CardArt art={card.art} tint={card.tint} />;
}

export function CardFace({
  card,
  lang,
  full,
}: {
  card: CollectionCard;
  lang: Lang;
  full: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const text = (value: { en: string; zh: string } | null) =>
    value ? pick(lang, value.en, value.zh) : "";
  const label = pick(lang, CATEGORY_LABEL[card.category].en, CATEGORY_LABEL[card.category].zh);
  const ribbon = card.label ? text(card.label) : "";

  if (!full) {
    return (
      <div
        className="absolute inset-0 flex flex-col overflow-hidden rounded-[0.45rem]"
        style={{ background: FACE, boxShadow: "inset 0 0 0 1px rgba(47,65,86,0.14)" }}
      >
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <CoverMedia card={card} lang={lang} broken={broken} onBroken={() => setBroken(true)} />
          {ribbon && (
            <span
              className="absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[0.42rem] font-semibold uppercase tracking-[0.12em]"
              style={{ background: "rgba(255,255,255,0.86)", color: INK }}
            >
              {ribbon}
            </span>
          )}
        </div>
        <div className="shrink-0 px-[7%] pb-[6%] pt-[4%]">
          <p className="card-title truncate font-semibold leading-tight" style={{ color: INK }}>
            {text(card.title)}
          </p>
          <p className="card-sub truncate" style={{ color: MUTE }}>
            {text(card.subtitle)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden rounded-[0.55rem]"
      style={{
        background: FACE,
        boxShadow: "inset 0 0 0 1px rgba(47,65,86,0.16), 0 1px 0 rgba(255,255,255,0.6) inset",
      }}
    >
      <div className="relative h-[36%] shrink-0 overflow-hidden">
        <CoverMedia card={card} lang={lang} broken={broken} onBroken={() => setBroken(true)} />
        <span
          className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[0.5rem] font-semibold uppercase tracking-[0.16em]"
          style={{ background: "rgba(251,248,241,0.86)", color: INK }}
        >
          {ribbon || label}
        </span>
        <span
          className="pointer-events-none absolute inset-x-0 bottom-0 h-10"
          style={{ background: `linear-gradient(180deg, transparent, ${FACE})` }}
          aria-hidden
        />
      </div>

      <div className="card-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-[6%] pb-3 pt-2">
        <div>
          <h2 className="card-title-lg font-semibold leading-tight" style={{ color: INK }}>
            {text(card.title)}
          </h2>
          <p className="card-sub-lg mt-1 uppercase tracking-[0.16em]" style={{ color: MUTE }}>
            {text(card.subtitle)}
          </p>
          {card.source && (
            <p className="card-sub-lg mt-1.5" style={{ color: BODY }}>
              {text(card.source)}
            </p>
          )}
        </div>

        {text(card.description) && (
          <section className="space-y-1">
            <Label>{pick(lang, "Why it is here", "收藏理由")}</Label>
            <p className="card-body" style={{ color: BODY }}>
              {text(card.description)}
            </p>
          </section>
        )}

        {card.details.map((detail) => (
          <section key={detail.label.en} className="space-y-1">
            <Label>{text(detail.label)}</Label>
            <ul className="card-body grid gap-1" style={{ color: BODY }}>
              {detail.items.map((item, i) => (
                <li key={`${item.en}-${i}`} className="flex gap-2">
                  <span
                    aria-hidden
                    className="mt-[0.45em] block h-[3px] w-[3px] shrink-0 rounded-full"
                    style={{ background: GOLD }}
                  />
                  <span>{text(item)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {card.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {card.tags.map((tag) => (
              <span
                key={tag.en}
                className="card-sub rounded-full px-2 py-0.5 tracking-wide"
                style={{ background: "rgba(47,65,86,0.07)", color: BODY }}
              >
                {text(tag)}
              </span>
            ))}
          </div>
        )}

        {text(card.personalNote) && (
          <section
            className="rounded-[0.3rem] px-3 py-2.5"
            style={{ background: "#f4eee1", boxShadow: "inset 0 0 0 1px rgba(168,129,63,0.18)" }}
          >
            <p
              className="card-label font-semibold uppercase tracking-[0.26em]"
              style={{ color: GOLD }}
            >
              MY NOTE
            </p>
            <p className="card-note mt-1 italic" style={{ color: "#3b4d5f" }}>
              {text(card.personalNote)}
            </p>
          </section>
        )}
      </div>

      <div
        className="card-label flex shrink-0 items-center justify-between px-[6%] py-2 uppercase tracking-[0.22em]"
        style={{ borderTop: "1px solid rgba(47,65,86,0.12)", color: MUTE }}
      >
        <span className="font-mono tabular-nums">№ {card.num}</span>
        <span>{label}</span>
      </div>
    </div>
  );
}
