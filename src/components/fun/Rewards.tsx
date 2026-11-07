/**
 * Collectible souvenirs and the small adventure map. Both are DOM/CSS so they
 * stay crisp at any camera distance, while the real 3D map keeps living on the
 * table behind them.
 */

import { CHAPTERS } from "@/components/fun/games/world-explorer/questionBank";
import { pick, type Lang } from "@/lib/i18n";
import type { RewardDef, RewardId } from "@/lib/fun/funZone";

export function MiniMap({
  solved,
  firstTry,
  complete,
}: {
  solved: boolean[];
  firstTry?: boolean[];
  complete?: boolean;
}) {
  const spots: { cx: number; cy: number; color: string }[] = [
    { cx: 82, cy: 68, color: CHAPTERS[0]!.color },
    { cx: 218, cy: 68, color: CHAPTERS[1]!.color },
    { cx: 150, cy: 132, color: CHAPTERS[2]!.color },
  ];
  const star = (x: number, y: number, r: number) =>
    `M ${x} ${y - r} L ${x + r * 0.28} ${y - r * 0.36} L ${x + r * 0.95} ${y - r * 0.32} L ${x + r * 0.46} ${y + r * 0.12} L ${x + r * 0.58} ${y + r * 0.86} L ${x} ${y + r * 0.48} L ${x - r * 0.58} ${y + r * 0.86} L ${x - r * 0.46} ${y + r * 0.12} L ${x - r * 0.95} ${y - r * 0.32} L ${x - r * 0.28} ${y - r * 0.36} Z`;
  return (
    <svg className="fz-minimap" viewBox="0 0 300 180" role="img" aria-label="Adventure map">
      <defs>
        <linearGradient id="fzMapPaper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbf5e6" />
          <stop offset="100%" stopColor="#eee2c7" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="288" height="168" rx="26" fill="url(#fzMapPaper)" stroke="#d9b877" strokeWidth="2" />
      <path d="M 82 68 Q 150 34 218 68 Q 190 118 150 132 Q 110 118 82 68 Z" fill="none" stroke="#c9b893" strokeWidth="2" strokeDasharray="4 6" />
      {spots.map((s, i) => {
        const n = solved.slice(i * 3, i * 3 + 3).filter(Boolean).length;
        return (
          <g key={i} className="fz-map-region">
            <ellipse cx={s.cx} cy={s.cy} rx="52" ry="34" fill={s.color} opacity={0.16 + (n / 3) * 0.72} />
            <ellipse cx={s.cx} cy={s.cy} rx="52" ry="34" fill="none" stroke="#c9b893" strokeWidth="1.5" strokeDasharray="3 4" />
            <text x={s.cx} y={s.cy + 3} textAnchor="middle" fontSize="9" fill="#5b6c62" fontWeight="700" letterSpacing="1.5">
              0{i + 1}
            </text>
          </g>
        );
      })}
      {Array.from({ length: 9 }, (_, i) => {
        const ch = Math.floor(i / 3);
        const s = spots[ch]!;
        const dx = ((i % 3) - 1) * 17;
        const on = solved[i] === true;
        const bright = firstTry?.[i] === true;
        return (
          <path
            key={i}
            className="fz-map-star"
            d={star(s.cx + dx, s.cy - 24, 6)}
            fill={bright ? "#e6c078" : "#c4b18a"}
            opacity={on ? 1 : 0.13}
          />
        );
      })}
      {complete && (
        <g>
          <path d={star(150, 92, 13)} fill="#e6c078" opacity="0.95" />
          <circle cx="150" cy="92" r="20" fill="none" stroke="#e6c078" strokeWidth="1.5" opacity="0.6" />
        </g>
      )}
    </svg>
  );
}

export function RewardPiece({
  def,
  isNew,
  lang,
}: {
  def: RewardDef;
  isNew: boolean;
  lang: Lang;
}) {
  return (
    <div className="fz-relic">
      {isNew && <span className="fz-relic-new">{pick(lang, "NEW", "新获得")}</span>}
      {def.glyph === "ticket" && (
        <div className="fz-ticket">
          <strong>WORLD EXPLORER</strong>
          <span>{pick(lang, "Explorer Ticket", "探险纪念票")}</span>
          <span>{new Date().toLocaleDateString(lang === "zh" ? "zh-CN" : "en-GB")}</span>
        </div>
      )}
      {def.glyph === "star" && <div className="fz-star" />}
      {def.glyph === "card" && <div className="fz-card">9/9</div>}
      {def.glyph === "badge" && <div className="fz-badge">{pick(lang, "FIRST EXPLORER", "世界初探者")}</div>}
      {def.glyph === "letter" && (
        <div className="fz-letter-relic">
          <span className="fz-letter-relic-line" />
          <span className="fz-letter-relic-mark">✦</span>
        </div>
      )}
      <span className="fz-relic-label">{pick(lang, def.name.en, def.name.zh)}</span>
    </div>
  );
}

export function RewardShelf({
  rewards,
  newly = [],
  lang,
}: {
  rewards: RewardDef[];
  newly?: RewardId[];
  lang: Lang;
}) {
  if (!rewards.length) return null;
  return (
    <div className="fz-relics">
      {rewards.map((r) => (
        <RewardPiece key={r.id} def={r} isNew={newly.includes(r.id)} lang={lang} />
      ))}
    </div>
  );
}
