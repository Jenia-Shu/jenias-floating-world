import { Button } from "@/components/ui/button";
import { LangSwitch } from "@/components/LangSwitch";
import { t, useLang } from "@/lib/i18n";

export function Welcome({ onEnter, leaving }: { onEnter: () => void; leaving: boolean }) {
  const [lang] = useLang();
  const ui = t(lang);
  return (
    <main className={`welcome-backdrop fixed inset-0 grid place-items-center overflow-hidden px-6 transition-opacity duration-700 ${leaving ? "opacity-0" : "opacity-100"}`}>
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <LangSwitch />
      </div>
      <div className="welcome-enter flex flex-col items-center text-center">
        <h1 className="font-display text-[clamp(6rem,22vw,15rem)] leading-[0.9] text-foreground">Jenia</h1>
        <p className="mt-10 text-sm tracking-[0.18em] text-muted-foreground sm:text-base">{ui.welcome}</p>
        <Button variant="enter" size="lg" className="mt-12 rounded-full" onClick={onEnter} disabled={leaving}>
          {ui.enter}
        </Button>
      </div>
    </main>
  );
}
