/**
 * The Achievement Wall.
 *
 * Everything shown here is read from the visitor's own local records: the
 * album, the visit counter, the private notebook, easter eggs, the dog, and the
 * five area tasks. Hidden badges do not exist on this wall until they unlock.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { LangSwitch } from "@/components/LangSwitch";
import { pick, useLang } from "@/lib/i18n";
import type { Session } from "@/lib/user";
import { BADGES, BADGE_BY_ID, GROUP_TITLES } from "@/lib/achievements/badges";
import { lifeSpan, milestoneIndex } from "@/lib/achievements/life";
import { SECTIONS, buildStats } from "@/lib/achievements/stats";
import {
  achKey,
  addJournal,
  evaluate,
  readState,
  removeJournal,
  setBirthday,
  setConfirmation,
  setSound,
  stampMilestone,
  writeState,
} from "@/lib/achievements/store";
import type {
  AchievementState,
  AchievementStats,
  BadgeDef,
  BadgeId,
  JournalKind,
  Snapshot,
} from "@/lib/achievements/types";
import { EmblemLive, EmblemThumb } from "./Emblem";

type Tab = "wall" | "private";

const KIND_LABEL: Record<JournalKind, { en: string; zh: string }> = {
  moment: { en: "A moment I noticed", zh: "我注意到的瞬间" },
  happiness: { en: "A small happiness", zh: "一个小确幸" },
  idea: { en: "An idea worth keeping", zh: "值得留下的灵感" },
  growth: { en: "Something I learned", zh: "一点成长" },
};

const SURPRISE_NAMES: Record<string, { en: string; zh: string }> = {
  "shooting-star": { en: "a shooting star", zh: "一颗流星" },
  fireflies: { en: "a drift of fireflies", zh: "一群萤火虫" },
  rainbow: { en: "a rainbow over the islands", zh: "岛上的彩虹" },
};

function chime() {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const at = ctx.currentTime + i * 0.13;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.linearRampToValueAtTime(0.075, at + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 1.1);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 1.2);
    });
    window.setTimeout(() => void ctx.close(), 1800);
  } catch {
    // sound is a nicety, never a blocker
  }
}

function dateLabel(ms: number, lang: "en" | "zh"): string {
  const d = new Date(ms);
  return lang === "zh"
    ? `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`
    : d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
}

function pct(part: number, total: number): number {
  return total <= 0 ? 0 : Math.round((part / total) * 100);
}

function Progress({
  current,
  target,
  lang,
}: {
  current: number;
  target: number;
  lang: "en" | "zh";
}) {
  const safeTarget = Math.max(1, target);
  const width = Math.min(100, Math.round((current / safeTarget) * 100));
  return (
    <div>
      <div className="ach-bar" aria-hidden>
        <span style={{ width: `${width}%` }} />
      </div>
      <p className="mt-1.5 text-[0.62rem] tabular-nums text-muted-foreground">
        {lang === "zh"
          ? `当前进度：${current} / ${Math.max(target, 1)}`
          : `Progress: ${current} / ${Math.max(target, 1)}`}
      </p>
    </div>
  );
}

function SnapshotLine({ snap, lang }: { snap: Snapshot; lang: "en" | "zh" }) {
  const bits = [
    lang === "zh" ? `访问 ${snap.visits} 次` : `${snap.visits} visits`,
    lang === "zh" ? `收藏 ${snap.collections} 张` : `${snap.collections} cards`,
    lang === "zh" ? `隐藏内容 ${snap.eggs} 个` : `${snap.eggs} hidden finds`,
    lang === "zh"
      ? `世界完成度 ${Math.round(snap.worldCompletion * 100)}%`
      : `${Math.round(snap.worldCompletion * 100)}% of the world`,
  ];
  return <p className="text-[0.66rem] leading-relaxed text-muted-foreground">{bits.join(" · ")}</p>;
}

function UnlockOverlay({
  def,
  lang,
  soundOn,
  onDone,
}: {
  def: BadgeDef;
  lang: "en" | "zh";
  soundOn: boolean;
  onDone: () => void;
}) {
  useEffect(() => {
    if (soundOn) chime();
  }, [soundOn]);

  return (
    <div
      className="ach-celebrate fixed inset-0 z-[70] grid place-items-center px-6"
      role="dialog"
      aria-modal="true"
      aria-label={pick(lang, "Badge unlocked", "徽章解锁")}
      onClick={onDone}
    >
      <div className="ach-celebrate-inner">
        <div className="ach-glow" aria-hidden />
        <div className="ach-live-emblem">
          <EmblemLive emblem={def.emblem} metal={def.metal} />
        </div>
        <p className="ach-celebrate-kicker">
          {pick(lang, `Badge No. ${def.num} · Unlocked`, `徽章第 ${def.num} 号 · 已解锁`)}
        </p>
        <h2 className="ach-celebrate-name">{pick(lang, def.en, def.zh)}</h2>
        <p className="ach-celebrate-line">{pick(lang, def.line.en, def.line.zh)}</p>
        <button type="button" className="ach-celebrate-done" onClick={onDone}>
          {pick(lang, "Keep it", "收下它")}
        </button>
      </div>
    </div>
  );
}

function BadgeDetail({
  def,
  unlocked,
  progress,
  lang,
  onClose,
}: {
  def: BadgeDef;
  unlocked: { at: number; snapshot: Snapshot } | undefined;
  progress: { current: number; target: number };
  lang: "en" | "zh";
  onClose: () => void;
}) {
  return (
    <div
      className="ach-modal fixed inset-0 z-[65] overflow-y-auto px-4 py-10"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="ach-modal-backdrop"
        aria-label={pick(lang, "Close", "关闭")}
        onClick={onClose}
      />
      <div className="ach-detail panel-enter relative mx-auto w-full max-w-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.6rem] tracking-[0.3em] uppercase text-muted-foreground">
              {pick(lang, `No. ${def.num}`, `第 ${def.num} 号`)}
            </p>
            <h2 className="mt-1 font-display text-3xl leading-tight text-foreground">
              {pick(lang, def.en, def.zh)}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{pick(lang, def.zh, def.en)}</p>
          </div>
          <button
            type="button"
            className="ach-close"
            onClick={onClose}
            aria-label={pick(lang, "Close", "关闭")}
          >
            ×
          </button>
        </div>

        <div className="ach-detail-emblem">
          <EmblemLive emblem={def.emblem} metal={def.metal} silhouette={!unlocked} />
        </div>

        <p className="mt-5 text-[0.92rem] leading-[1.9] text-foreground/90">
          {pick(lang, def.story.en, def.story.zh)}
        </p>

        <div className="mt-6 border-t border-border/60 pt-5">
          <h3 className="text-[0.62rem] tracking-[0.26em] uppercase text-muted-foreground">
            {pick(lang, "How it is earned", "解锁条件")}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">
            {pick(lang, def.condition.en, def.condition.zh)}
          </p>
          <div className="mt-4">
            <Progress current={progress.current} target={progress.target} lang={lang} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-5">
          <div>
            <p className="text-[0.62rem] tracking-[0.24em] uppercase text-muted-foreground">
              {unlocked ? pick(lang, "Unlocked", "已获得") : pick(lang, "Locked", "尚未解锁")}
            </p>
            {unlocked ? (
              <p className="mt-1 text-sm text-foreground/85">{dateLabel(unlocked.at, lang)}</p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                {pick(lang, "Not yet — keep exploring.", "还没有，再走走看。")}
              </p>
            )}
          </div>
          <span className={`ach-status ${unlocked ? "is-on" : ""}`}>
            {unlocked ? pick(lang, "UNLOCKED", "已获得") : pick(lang, "LOCKED", "尚未解锁")}
          </span>
        </div>

        {unlocked && (
          <div className="mt-4 rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
            <p className="mb-1 text-[0.6rem] tracking-[0.24em] uppercase text-muted-foreground">
              {pick(lang, "When it happened", "获得时的记录")}
            </p>
            <SnapshotLine snap={unlocked.snapshot} lang={lang} />
          </div>
        )}
      </div>
    </div>
  );
}

export function AchievementWall({ user, onClose }: { user: Session; onClose: () => void }) {
  const [lang] = useLang();
  const L = useCallback((en: string, zh: string) => pick(lang, en, zh), [lang]);

  const [state, setState] = useState<AchievementState>(() => readState(achKey(user)));
  const [stats, setStats] = useState<AchievementStats>(() =>
    buildStats(user, readState(achKey(user))),
  );
  const [tab, setTab] = useState<Tab>("wall");
  const [selected, setSelected] = useState<BadgeId | null>(null);
  const [queue, setQueue] = useState<BadgeId[]>([]);
  const [celebrating, setCelebrating] = useState<BadgeId | null>(null);
  const [notice, setNotice] = useState("");
  const [kind, setKind] = useState<JournalKind>("moment");
  const [draft, setDraft] = useState("");
  const [birthdayDraft, setBirthdayDraft] = useState(state.birthday ?? "");

  const sync = useCallback(
    (next?: AchievementState) => {
      const cur = next ?? readState(achKey(user));
      const fresh = buildStats(user, cur);
      const ev = evaluate(cur, fresh);
      if (ev.newly.length) {
        writeState(achKey(user), ev.state);
        setQueue((q) => [...q, ...ev.newly]);
      }
      setState(ev.newly.length ? ev.state : cur);
      setStats(fresh);
    },
    [user],
  );

  useEffect(() => {
    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (celebrating || queue.length === 0) return;
    const [next, ...rest] = queue;
    setCelebrating(next ?? null);
    setQueue(rest);
  }, [queue, celebrating]);

  // A finished area counts the moment its page is closed as done, but the wall
  // may already be open when that happens — so re-read on mount is enough here.
  const visible = useMemo(
    () => BADGES.filter((b) => !b.hidden || !!state.unlocked[b.id]),
    [state.unlocked],
  );
  const earned = visible.filter((b) => state.unlocked[b.id]).length;
  const total = visible.length;
  const recent = useMemo(() => {
    let best: { def: BadgeDef; at: number } | null = null;
    for (const def of visible) {
      const rec = state.unlocked[def.id];
      if (rec && (!best || rec.at > best.at)) best = { def, at: rec.at };
    }
    return best;
  }, [visible, state.unlocked]);

  const span = lifeSpan(state.birthday);
  const milestone = stats.lifetimeDays === null ? 0 : milestoneIndex(stats.lifetimeDays);

  useEffect(() => {
    if (milestone > state.lastMilestone) {
      stampMilestone(user, milestone);
      setState((s) => ({ ...s, lastMilestone: milestone }));
      setNotice(
        L(
          `Day ${milestone * 1000} of your life. That is worth a small note.`,
          `这是你生命中的第 ${milestone * 1000} 天，值得记一下。`,
        ),
      );
    }
  }, [milestone, state.lastMilestone, user, L]);

  const saveBirthday = () => {
    const next = setBirthday(user, birthdayDraft || null);
    setState(next);
    sync(next);
    if (!next.birthday) setNotice(L("Birthday cleared.", "生日已清除。"));
  };

  const addNote = () => {
    if (!draft.trim()) return;
    const next = addJournal(user, kind, draft);
    setDraft("");
    setState(next);
    sync(next);
  };

  const removeNote = (id: string) => {
    const next = removeJournal(user, id);
    setState(next);
    sync(next);
  };

  const toggleConfirm = (which: "planned" | "organized") => {
    const next = setConfirmation(user, which, !state.confirmations[which]);
    setState(next);
    sync(next);
  };

  const toggleSound = () => {
    const next = setSound(user, !state.sound);
    setState(next);
  };

  const selectedDef = selected ? BADGE_BY_ID.get(selected) : undefined;
  const celebratingDef = celebrating ? BADGE_BY_ID.get(celebrating) : undefined;

  return (
    <div className="ach-wall fixed inset-0 z-50 overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-5 pb-28 pt-6 sm:px-8 sm:pt-10">
        <header className="flex items-center justify-between gap-3">
          <Button variant="glass" size="sm" onClick={onClose}>
            <span aria-hidden>←</span> {L("Map", "地图")}
          </Button>
          <div className="flex items-center gap-2">
            <LangSwitch />
            <button
              type="button"
              className="ach-sound"
              onClick={toggleSound}
              aria-label={L("Sound", "音效")}
              aria-pressed={state.sound}
            >
              {state.sound ? "🔈" : "🔇"}
            </button>
          </div>
        </header>

        <div className="mt-10 text-center">
          <p className="text-[0.62rem] tracking-[0.34em] uppercase text-accent-foreground">
            {L("Achievement Wall", "徽章墙")}
          </p>
          <h1 className="mt-3 font-display text-5xl leading-none text-foreground sm:text-6xl">
            MY ACHIEVEMENTS
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            {L("Every exploration deserves to be remembered.", "每一次探索，都值得被记录。")}
          </p>
        </div>

        <div className="ach-summary">
          <div>
            <span className="ach-summary-num">
              {earned}
              <em>/{total}</em>
            </span>
            <span className="ach-summary-label">{L("Badges earned", "已获得徽章")}</span>
          </div>
          <div>
            <span className="ach-summary-num">{pct(earned, total)}%</span>
            <span className="ach-summary-label">{L("Completion", "完成度")}</span>
          </div>
          <div>
            <span className="ach-summary-num">{state.visits}</span>
            <span className="ach-summary-label">{L("Visits", "累计访问")}</span>
          </div>
          <div>
            <span className="ach-summary-num">{stats.totalCollections}</span>
            <span className="ach-summary-label">{L("Cards collected", "累计收藏卡")}</span>
          </div>
          <div className="ach-summary-wide">
            <span className="ach-summary-num text-lg">
              {recent ? pick(lang, recent.def.en, recent.def.zh) : "—"}
            </span>
            <span className="ach-summary-label">
              {recent
                ? L("Most recent badge", "最近获得")
                : L("Nothing yet — the world is waiting", "还没有，世界在等你")}
            </span>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            type="button"
            className={`ach-tab ${tab === "wall" ? "is-on" : ""}`}
            onClick={() => setTab("wall")}
          >
            {L("The wall", "徽章墙")}
          </button>
          <button
            type="button"
            className={`ach-tab ${tab === "private" ? "is-on" : ""}`}
            onClick={() => setTab("private")}
          >
            {L("Private corner", "私人角落")}
          </button>
        </div>

        {notice && (
          <p className="ach-notice" role="status">
            {notice}
            <button type="button" onClick={() => setNotice("")} aria-label={L("Dismiss", "关闭")}>
              ×
            </button>
          </p>
        )}

        {tab === "wall" ? (
          <div className="mt-12 space-y-16">
            {(["collection", "growth", "milestones"] as const).map((group) => {
              const list = visible.filter((b) => b.group === group);
              if (!list.length) return null;
              return (
                <section key={group}>
                  <div className="ach-group-head">
                    <h2>{pick(lang, GROUP_TITLES[group].en, GROUP_TITLES[group].zh)}</h2>
                    <span>
                      {list.filter((b) => state.unlocked[b.id]).length} / {list.length}
                    </span>
                  </div>
                  <div className="ach-grid">
                    {list.map((def) => {
                      const rec = state.unlocked[def.id];
                      const progress = def.progress(stats);
                      return (
                        <button
                          key={def.id}
                          type="button"
                          className={`ach-card ${rec ? "is-unlocked" : "is-locked"}`}
                          onClick={() => setSelected(def.id)}
                          aria-label={pick(lang, def.en, def.zh)}
                        >
                          <span
                            className="ach-medal"
                            style={{
                              background: rec
                                ? `radial-gradient(circle at 34% 26%, ${def.metal[0]}, ${def.metal[1]})`
                                : "radial-gradient(circle at 34% 26%, #aab0b8, #6e747c)",
                            }}
                          >
                            <EmblemThumb emblem={def.emblem} metal={def.metal} silhouette={!rec} />
                          </span>
                          <span className="ach-num">No. {def.num}</span>
                          <span className="ach-name">{pick(lang, def.en, def.zh)}</span>
                          <span className="ach-sub">{pick(lang, def.zh, def.en)}</span>
                          <span className="ach-card-progress">
                            {rec
                              ? L(
                                  `Earned ${dateLabel(rec.at, lang)}`,
                                  `${dateLabel(rec.at, lang)} 获得`,
                                )
                              : `${progress.current} / ${progress.target}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <section className="ach-panel">
              <h2 className="ach-panel-title">{L("Birthday · local only", "生日 · 只存本机")}</h2>
              <p className="mt-2 text-[0.78rem] leading-relaxed text-muted-foreground">
                {L(
                  "This number never leaves this device and is never shown publicly. Fill it in and the wall will count your days honestly — leap years included.",
                  "这个数字不会离开这台设备，也不会公开展示。填上之后，徽章墙会按真实日历计算你生活过的天数——闰年也算对。",
                )}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  className="ach-input"
                  value={birthdayDraft}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setBirthdayDraft(e.target.value)}
                  aria-label={L("Birthday", "生日")}
                />
                <Button variant="soft" size="sm" onClick={saveBirthday}>
                  {L("Save", "保存")}
                </Button>
              </div>
              {span ? (
                <div className="mt-5">
                  <p className="ach-days">
                    {span.totalDays.toLocaleString()}
                    <span>{L("days lived", "天")}</span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {L(
                      `${span.years} years, ${span.months} months, ${span.days} days.`,
                      `${span.years} 年 ${span.months} 个月 ${span.days} 天。`,
                    )}
                  </p>
                  {milestone > 0 && (
                    <p className="mt-2 text-[0.72rem] text-accent-foreground">
                      {L(
                        `Milestone: day ${milestone * 1000}.`,
                        `里程碑：第 ${milestone * 1000} 天。`,
                      )}
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-5 text-sm text-muted-foreground">
                  {L(
                    "No birthday saved yet. Nothing is guessed.",
                    "还没有设置生日。这里不会猜一个数字。",
                  )}
                </p>
              )}
            </section>

            <section className="ach-panel">
              <h2 className="ach-panel-title">{L("Visits", "访问次数")}</h2>
              <p className="mt-2 text-[0.78rem] leading-relaxed text-muted-foreground">
                {L(
                  "Every page load counts once, refresh included. This is a count of visits, not of different people.",
                  "每次页面加载算一次，刷新也算。这是访问次数，不是独立访客数。",
                )}
              </p>
              <p className="ach-days mt-4">
                {state.visits}
                <span>{L("visits", "次")}</span>
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                {SECTIONS.map((id) => (
                  <span
                    key={id}
                    className={`ach-chip ${state.sections.includes(id) ? "is-on" : ""}`}
                  >
                    {pick(
                      lang,
                      {
                        about: "My World",
                        gallery: "Gallery",
                        collections: "Collections",
                        fun: "Fun Zone",
                        community: "Community",
                      }[id],
                      {
                        about: "我的世界",
                        gallery: "作品集",
                        collections: "收藏",
                        fun: "乐园",
                        community: "留言",
                      }[id],
                    )}
                    {state.sections.includes(id) ? " ✓" : ""}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[0.66rem] text-muted-foreground">
                {L(
                  "Areas tick themselves when you finish what is there, not when the page merely opens.",
                  "区域会在你真正做完那里的事情后自己打勾，不是打开页面就算。",
                )}
              </p>
            </section>

            <section className="ach-panel">
              <h2 className="ach-panel-title">{L("Private notebook", "私人手记")}</h2>
              <p className="mt-2 text-[0.78rem] leading-relaxed text-muted-foreground">
                {L(
                  "A moment, a small happiness, an idea, a bit of growth. Kept only on this device and counted by the wall.",
                  "一个瞬间、一个小确幸、一个灵感、一点成长。只存在这台设备上，由徽章墙计数。",
                )}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(Object.keys(KIND_LABEL) as JournalKind[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={`ach-chip ${kind === k ? "is-on" : ""}`}
                    onClick={() => setKind(k)}
                  >
                    {pick(lang, KIND_LABEL[k].en, KIND_LABEL[k].zh)}
                  </button>
                ))}
              </div>
              <textarea
                className="ach-textarea mt-3"
                rows={3}
                maxLength={280}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={L("Write one line…", "写一句…")}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[0.62rem] text-muted-foreground">{draft.length}/280</span>
                <Button variant="soft" size="sm" onClick={addNote}>
                  {L("Keep it", "记下来")}
                </Button>
              </div>
              <ul className="mt-4 space-y-2">
                {[...state.journal].reverse().map((entry) => (
                  <li key={entry.id} className="ach-note">
                    <div className="min-w-0">
                      <p className="text-[0.6rem] tracking-[0.18em] uppercase text-muted-foreground">
                        {pick(lang, KIND_LABEL[entry.kind].en, KIND_LABEL[entry.kind].zh)}
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-foreground/85">
                        {entry.text}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="ach-note-del"
                      onClick={() => removeNote(entry.id)}
                      aria-label={L("Delete", "删除")}
                    >
                      ×
                    </button>
                  </li>
                ))}
                {state.journal.length === 0 && (
                  <li className="text-sm text-muted-foreground">
                    {L("Nothing written yet.", "还没有写。")}
                  </li>
                )}
              </ul>
            </section>

            <section className="ach-panel">
              <h2 className="ach-panel-title">{L("Behind the scenes", "幕后的事")}</h2>
              <p className="mt-2 text-[0.78rem] leading-relaxed text-muted-foreground">
                {L(
                  "Only you can confirm these. The wall never infers an event from a page visit.",
                  "这两件事只有你自己能确认。徽章墙不会因为打开过某个页面就推断你做过活动。",
                )}
              </p>
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  className={`ach-toggle ${state.confirmations.planned ? "is-on" : ""}`}
                  onClick={() => toggleConfirm("planned")}
                  aria-pressed={state.confirmations.planned}
                >
                  <span>{L("I have planned an event", "我参与过活动策划")}</span>
                  <em>{state.confirmations.planned ? "✓" : ""}</em>
                </button>
                <button
                  type="button"
                  className={`ach-toggle ${state.confirmations.organized ? "is-on" : ""}`}
                  onClick={() => toggleConfirm("organized")}
                  aria-pressed={state.confirmations.organized}
                >
                  <span>{L("I have completed a large event", "我完成过大型活动的组织")}</span>
                  <em>{state.confirmations.organized ? "✓" : ""}</em>
                </button>
              </div>
              <div className="mt-5 border-t border-border/60 pt-4">
                <p className="text-[0.62rem] tracking-[0.24em] uppercase text-muted-foreground">
                  {L("Random surprises met", "遇见的随机惊喜")}
                </p>
                <p className="mt-1 text-sm text-foreground/85">
                  {state.surprises.length
                    ? state.surprises
                        .map((s) =>
                          pick(lang, SURPRISE_NAMES[s]?.en ?? s, SURPRISE_NAMES[s]?.zh ?? s),
                        )
                        .join("、")
                    : L("None yet.", "还没有。")}
                </p>
              </div>
            </section>
          </div>
        )}

        <footer className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-6 text-[0.62rem] text-muted-foreground">
          <span>
            {L(
              "Progress lives on this device, under this name. Nothing is uploaded.",
              "进度只存在这台设备、这个昵称下。不会上传。",
            )}
          </span>
          <button type="button" className="underline underline-offset-2" onClick={onClose}>
            {L("Back to the world", "回到世界")}
          </button>
        </footer>
      </div>

      {selectedDef && (
        <BadgeDetail
          def={selectedDef}
          unlocked={state.unlocked[selectedDef.id]}
          progress={selectedDef.progress(stats)}
          lang={lang}
          onClose={() => setSelected(null)}
        />
      )}

      {celebratingDef && (
        <UnlockOverlay
          def={celebratingDef}
          lang={lang}
          soundOn={state.sound}
          onDone={() => setCelebrating(null)}
        />
      )}
    </div>
  );
}
