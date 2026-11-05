import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { LangSwitch } from "@/components/LangSwitch";
import { pick, t, useLang } from "@/lib/i18n";
import { CHAPTERS } from "@/lib/world/story";

const StoryWorld = lazy(() => import("./StoryWorld").then((m) => ({ default: m.StoryWorld })));

/** If WebGL or the 3D chunk fails, the text still reads on a soft gradient. */
class StoryBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    if (this.state.failed) {
      return <div className="h-full w-full bg-gradient-to-b from-[#eaf3fb] via-[#dceaf6] to-[#cfdcea]" />;
    }
    return this.props.children;
  }
}

const INK = "#2f4156";
const BODY = "#465a72";
const MUTE = "#7d9fc4";

export function AboutPage({
  seen,
  onClose,
  onDone,
  onHome,
}: {
  seen: boolean;
  onClose: () => void;
  onDone: () => void;
  onHome: () => void;
}) {
  const [lang] = useLang();
  const ui = t(lang);
  const zh = lang === "zh";

  const scroller = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [active, setActive] = useState(0);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, []);

  const handleScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const p = max > 0 ? el.scrollTop / max : 0;
    // map raw scroll to chapter-space so each chapter centres on its own section
    const span = CHAPTERS.length - 1;
    progress.current = Math.min(1, Math.max(0, (p * CHAPTERS.length - 0.5) / span));
    const idx = Math.min(span, Math.max(0, Math.round(p * CHAPTERS.length - 0.5)));
    setActive((prev) => (prev === idx ? prev : idx));
  };

  return (
    <div
      ref={scroller}
      onScroll={handleScroll}
      className="fixed inset-0 z-30 overflow-y-auto overscroll-contain bg-[#dceaf6]"
    >
      <div className="pointer-events-none fixed inset-0">
        <StoryBoundary>
          <Suspense
            fallback={<div className="h-full w-full bg-gradient-to-b from-[#eaf3fb] via-[#dceaf6] to-[#cfdcea]" />}
          >
            <StoryWorld progress={progress} reducedMotion={reducedMotion} />
          </Suspense>
        </StoryBoundary>
      </div>

      <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-center justify-between px-4 py-4 sm:px-7">
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto rounded-full border border-white/70 bg-white/60 px-4 py-2 text-[0.72rem] font-medium tracking-wide text-[#3c5168] backdrop-blur-md transition hover:bg-white/85"
        >
          ← {ui.map}
        </button>
        <div className="pointer-events-auto">
          <LangSwitch tone="light" />
        </div>
      </header>

      <nav className="pointer-events-none fixed right-3.5 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center gap-2.5 sm:flex">
        <span className="mb-1 font-mono text-[0.62rem] tabular-nums text-[#405c78]/55">{CHAPTERS[active]!.num}</span>
        {CHAPTERS.map((c, i) => (
          <span
            key={c.id}
            className={
              i === active
                ? "h-6 w-[3px] rounded-full bg-[#405c78] transition-all duration-500"
                : "h-[3px] w-[3px] rounded-full bg-[#405c78]/30 transition-all duration-500"
            }
          />
        ))}
      </nav>

      <div className="relative">
        {CHAPTERS.map((ch, i) => {
          const last = i === CHAPTERS.length - 1;
          return (
            <section
              key={ch.id}
              className="flex min-h-[125vh] items-center px-5 py-24 sm:px-14 sm:py-28"
            >
              <article
                className={[
                  "w-full max-w-[29rem] rounded-[1.6rem] border border-white/60 bg-white/55 p-6 shadow-[0_26px_70px_-40px_rgba(47,65,86,0.75)] backdrop-blur-md sm:p-8",
                  i % 2 === 1 ? "sm:ml-auto" : "",
                ].join(" ")}
              >
                {i === 0 ? (
                  <>
                    <p className="text-[0.64rem] font-medium uppercase tracking-[0.34em] text-[#7d9fc4]">
                      {zh ? "欢迎来到我的世界" : "Welcome to my world"}
                    </p>
                    <h1
                      className={
                        zh
                          ? "mt-3 text-[2.6rem] font-semibold leading-tight tracking-tight"
                          : "mt-2 font-display text-[4.2rem] leading-[0.95]"
                      }
                      style={{ color: INK }}
                    >
                      {zh ? "Jenia 的世界" : "Jenia."}
                    </h1>
                    <p className="mt-5 text-[1.02rem] leading-relaxed" style={{ color: BODY }}>
                      {pick(lang, ch.lead.en, ch.lead.zh)}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="flex items-center gap-2.5 text-[0.64rem] font-medium uppercase tracking-[0.3em]" style={{ color: MUTE }}>
                      <span className="font-mono tabular-nums">{ch.num}</span>
                      <span className="h-px w-6 bg-current opacity-40" />
                      <span>{zh ? "章节" : "Chapter"}</span>
                    </p>
                    <h2
                      className={
                        zh
                          ? "mt-3 text-[1.85rem] font-semibold leading-snug tracking-tight"
                          : i === 3
                            ? "mt-3 font-display text-[2.5rem] leading-[1.1]"
                            : "mt-2 font-display text-[2.9rem] leading-[1.05]"
                      }
                      style={{ color: INK }}
                    >
                      {pick(lang, ch.title.en, ch.title.zh)}
                    </h2>
                    <p className="mt-4 text-[0.96rem] leading-relaxed" style={{ color: BODY }}>
                      {pick(lang, ch.lead.en, ch.lead.zh)}
                    </p>
                  </>
                )}

                <div className="mt-7 space-y-5">
                  {ch.blocks.map((b) => (
                    <div key={b.id}>
                      <h3
                        className="text-[0.66rem] font-semibold uppercase tracking-[0.18em]"
                        style={{ color: MUTE }}
                      >
                        {pick(lang, b.title.en, b.title.zh)}
                      </h3>
                      <p className="mt-1.5 text-[0.92rem] leading-[1.75]" style={{ color: BODY }}>
                        {pick(lang, b.body.en, b.body.zh)}
                      </p>
                    </div>
                  ))}
                </div>

                {i === 0 && (
                  <p className="mt-8 flex items-center gap-2 text-[0.66rem] uppercase tracking-[0.25em]" style={{ color: MUTE }}>
                    {zh ? "向下滚动探索" : "Scroll to explore"}
                    <span className="animate-bounce">↓</span>
                  </p>
                )}

                {last && (
                  <div className="mt-9 flex flex-col gap-2.5 border-t border-[#405c78]/12 pt-7">
                    <button
                      type="button"
                      onClick={seen ? onClose : onDone}
                      className="rounded-full bg-[#2f4156] px-5 py-3 text-[0.82rem] font-medium tracking-wide text-white transition hover:bg-[#3c5168]"
                    >
                      {seen ? ui.backToMap : ui.seenThis}
                    </button>
                    <button
                      type="button"
                      onClick={onHome}
                      className="rounded-full border border-[#2f4156]/20 px-5 py-2.5 text-[0.78rem] tracking-wide text-[#3c5168] transition hover:bg-white/60"
                    >
                      {ui.home}
                    </button>
                    <p className="mt-2 text-center text-[0.6rem] tracking-[0.2em] text-[#405c78]/45">
                      © Jenia&apos;s World
                    </p>
                  </div>
                )}
              </article>
            </section>
          );
        })}
      </div>
    </div>
  );
}
