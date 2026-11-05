import { useLang, type Lang } from "@/lib/i18n";

const LABEL: Record<Lang, string> = { en: "EN", zh: "中文" };

/**
 * Two-way language pill. Sits in the top-right corner of every screen.
 * `tone` picks contrast against the light map chrome or a dark page.
 */
export function LangSwitch({
  tone = "light",
  className = "",
}: {
  tone?: "light" | "dark";
  className?: string;
}) {
  const [lang, setLang] = useLang();

  const shell =
    tone === "dark"
      ? "border-white/25 bg-white/5"
      : "border-black/10 bg-white/60";
  const idle = tone === "dark" ? "text-white/60 hover:text-white" : "text-black/45 hover:text-black/80";
  const active = tone === "dark" ? "bg-white text-black" : "bg-black/80 text-white";

  return (
    <div
      className={`pointer-events-auto flex items-center gap-0.5 rounded-full border p-0.5 backdrop-blur-md ${shell} ${className}`}
    >
      {(["en", "zh"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`rounded-full px-2.5 py-1 text-[0.68rem] font-medium tracking-wide transition ${
            lang === code ? active : idle
          }`}
        >
          {LABEL[code]}
        </button>
      ))}
    </div>
  );
}
