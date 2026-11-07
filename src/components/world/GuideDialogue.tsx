import { useState } from "react";

type Props = {
  /** Only render while the first-visit guide is running. */
  active: boolean;
  lang: "zh" | "en";
  reducedMotion: boolean;
  /** Called when the visitor dismisses the guide — the world opens up. */
  onFinish: () => void;
};

type Line = { zh: string; en: string };

// Princess introduces herself and the world. The copy is intentionally short so
// the camera can hold on her while the lines tick by; the last line is the cue
// to step into the map.
const LINES: Line[] = [
  {
    zh: "你好呀，新朋友！我是带你逛这座小世界的向导。",
    en: "Hi, new friend! I'm the guide who'll show you around this little world.",
  },
  {
    zh: "我叫公主——对，就是这只边牧。我本职是做这个网站的人的宠物哦。",
    en: "My name is Princess — yes, this border collie. I'm the pet of the person who built this site.",
  },
  {
    zh: "这里一共有几座小岛，你慢慢走，一座座都能点亮。",
    en: "There are a few islands here. Wander slowly and you'll light each one up.",
  },
  {
    zh: "事不宜迟，让我们赶紧进入今天的探索吧！",
    en: "No time to waste — let's begin today's exploration!",
  },
];

export function GuideDialogue({ active, lang, reducedMotion, onFinish }: Props) {
  const [step, setStep] = useState(0);
  if (!active) return null;

  const line = LINES[step]!;
  const isLast = step === LINES.length - 1;
  const t = (en: string, zh: string) => (lang === "zh" ? zh : en);

  const advance = () => {
    if (isLast) onFinish();
    else setStep((s) => Math.min(LINES.length - 1, s + 1));
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-8">
      <div
        role="dialog"
        aria-live="polite"
        onClick={advance}
        className="pointer-events-auto w-full max-w-md cursor-pointer select-none rounded-2xl border border-white/70 bg-white/90 px-5 py-4 shadow-[0_22px_54px_-28px_rgba(20,40,60,0.62)] backdrop-blur-md"
        style={reducedMotion ? undefined : { animation: "rise 520ms cubic-bezier(.22,.68,.24,1) both" }}
      >
        <div className="mb-2 flex items-center gap-2">
          <span aria-hidden className="text-lg leading-none">
            🐾
          </span>
          <span className="text-[0.66rem] font-medium tracking-[0.18em] uppercase text-foreground/70">
            公主 · PRINCESS
          </span>
        </div>
        <p
          key={step}
          className="min-h-[3.2em] text-[0.95rem] leading-relaxed text-foreground"
          style={reducedMotion ? undefined : { animation: "rise 420ms cubic-bezier(.22,.68,.24,1) both" }}
        >
          {lang === "zh" ? line.zh : line.en}
        </p>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              advance();
            }}
            className="rounded-full bg-foreground px-4 py-1.5 text-[0.72rem] font-medium tracking-[0.06em] text-background shadow-[0_2px_10px_rgba(0,0,0,0.18)] transition-opacity hover:opacity-85"
          >
            {isLast ? t("Start exploring →", "开始探索 →") : t("Continue →", "继续 →")}
          </button>
        </div>
      </div>
    </div>
  );
}
