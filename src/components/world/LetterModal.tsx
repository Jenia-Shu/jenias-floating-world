import { useEffect, useRef } from "react";
import { LETTER } from "@/lib/world/letter";
import { pick, useLang } from "@/lib/i18n";

type Props = {
  onClose: () => void;
  /** The collie leads on from the end of the letter into the Fun Zone. */
  onFollow?: (() => void) | undefined;
};

/** The letter found inside the drifting bottle. */
export function LetterModal({ onClose, onFollow }: Props) {
  const [lang] = useLang();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center overflow-y-auto px-4 py-10"
      role="dialog"
      aria-modal="true"
      aria-label={pick(lang, LETTER.title.en, LETTER.title.zh)}
    >
      <button
        type="button"
        aria-label={pick(lang, "Close the letter", "合上信")}
        onClick={onClose}
        className="fixed inset-0 bg-[#1b2a3a]/35 backdrop-blur-[3px]"
      />
      <div className="relative w-full max-w-lg">
        <div
          className="album-paper relative rounded-[0.9rem] px-7 py-8 shadow-[0_40px_90px_-40px_rgba(20,40,60,0.55)] sm:px-10 sm:py-10"
          style={{ animation: "album-settle-in 520ms cubic-bezier(.22,.68,.24,1) both" }}
        >
          <div className="relative z-10">
            <p className="text-[0.58rem] tracking-[0.3em] uppercase text-[#8a7a60]">
              {pick(lang, LETTER.kicker.en, LETTER.kicker.zh)}
            </p>
            <h2 className="mt-2 font-display text-[2rem] leading-tight text-[#33404f] sm:text-[2.35rem]">
              {pick(lang, LETTER.title.en, LETTER.title.zh)}
            </h2>
            <div className="mt-4 h-px w-16 bg-[#8a7a60]/35" aria-hidden />
            <div className="mt-5 space-y-3.5 text-[0.9rem] leading-[1.85] text-[#3c4a5a]">
              {(lang === "zh" ? LETTER.body.zh : LETTER.body.en).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <p className="mt-6 text-right font-display text-2xl text-[#33404f]">
              — {pick(lang, LETTER.signature.en, LETTER.signature.zh)}
            </p>
            <div className="mt-7 flex items-center justify-between gap-3 border-t border-[#8a7a60]/25 pt-4">
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="rounded-full bg-[#33404f] px-5 py-2 text-[0.72rem] tracking-[0.08em] text-[#f7f2e6] transition hover:bg-[#26303c]"
              >
                {pick(lang, "Keep this letter, keep exploring", "收好这封信，继续探索")}
              </button>
              <span className="text-[0.6rem] tracking-[0.18em] uppercase text-[#8a7a60]">
                {pick(lang, "It stays in the little wooden box", "它会一直留在小木箱里")}
              </span>
            </div>

            {/* The Message Island now ends at the letter itself, so this is the
                hand-over to the Fun Zone: the collie waits past the last line. */}
            {onFollow && (
              <div className="mt-6 border-t border-[#8a7a60]/25 pt-5 text-center">
                <p className="text-[0.58rem] tracking-[0.3em] uppercase text-[#8a7a60]">
                  {pick(lang, "A NEW PLACE TO DISCOVER", "云雾的另一边")}
                </p>
                <button
                  type="button"
                  onClick={onFollow}
                  className="mt-3 rounded-full border border-[#8a7a60]/45 px-5 py-2 text-[0.72rem] tracking-[0.08em] text-[#33404f] transition hover:bg-[#33404f]/5"
                >
                  {pick(lang, "Follow her", "跟上它")} <span aria-hidden>→</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
