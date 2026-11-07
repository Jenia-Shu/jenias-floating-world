import { Button } from "@/components/ui/button";
import { AboutPage } from "@/components/about/AboutPage";
import { CollectionsPage } from "@/components/collections/CollectionsPage";
import { GalleryPage } from "@/components/gallery/GalleryPage";
import { LangSwitch } from "@/components/LangSwitch";
import { pick, t, useLang } from "@/lib/i18n";
import type { RegionMeta } from "@/lib/world/regions";

type Props = {
  region: RegionMeta;
  seen: boolean;
  onClose: () => void;
  onDone: () => void;
  onHome: () => void;
  /** Marks the region explored without closing the panel. */
  onComplete?: (() => void) | undefined;
  /** Opens the Achievement Wall from inside the Fun Zone. */
  onOpenWall?: (() => void) | undefined;
};

/** Full-screen reading surface for one island. The map keeps rendering behind it. */
export function WorldPage({
  region,
  seen,
  onClose,
  onDone,
  onHome,
  onComplete,
  onOpenWall,
}: Props) {
  const [lang] = useLang();
  const ui = t(lang);

  if (region.id === "about") {
    return <AboutPage seen={seen} onClose={onClose} onDone={onDone} onHome={onHome} />;
  }

  // The gallery island is a wall of plates you walk along sideways, not a page.
  if (region.id === "gallery") {
    return <GalleryPage seen={seen} onClose={onClose} onDone={onDone} onHome={onHome} />;
  }

  if (region.id === "collections") {
    return (
      <CollectionsPage
        seen={seen}
        onClose={onClose}
        onDone={onDone}
        onHome={onHome}
        onComplete={onComplete}
      />
    );
  }

  return (
    <div className="world-page fixed inset-0 z-30 overflow-y-auto bg-background/92 backdrop-blur-2xl">
      <div className="mx-auto w-full max-w-2xl px-6 pb-24 pt-8 sm:px-8 sm:pt-12">
        <header className="flex items-center justify-between gap-3">
          <Button variant="glass" size="sm" onClick={onClose}>
            <span aria-hidden>←</span> {ui.map}
          </Button>
          <LangSwitch />
          <Button variant="ghost" size="sm" onClick={onHome}>
            {ui.home}
          </Button>
        </header>

        <p className="mt-14 text-[0.68rem] tracking-[0.3em] uppercase text-accent-foreground">
          {pick(lang, region.kicker, region.kickerZh)}
        </p>
        <h1 className="mt-2 font-display text-6xl leading-[0.95] text-foreground sm:text-7xl">
          {pick(lang, region.name, region.nameZh)}
        </h1>

        <div className="mt-14 space-y-14">
          {region.sections.map((s) => (
            <section key={s.id}>
              <h2 className="text-[0.7rem] tracking-[0.28em] uppercase text-accent-foreground">
                {s.title}
              </h2>
              <p className="mt-3 text-[0.95rem] leading-[1.85] text-muted-foreground">{s.body}</p>
            </section>
          ))}
        </div>

        {region.id === "fun" && onOpenWall && (
          <button
            type="button"
            onClick={onOpenWall}
            className="mt-12 flex w-full items-center justify-between gap-4 rounded-3xl border border-border/60 bg-background/70 px-5 py-5 text-left transition hover:border-foreground/30"
          >
            <span>
              <span className="block text-[0.62rem] tracking-[0.28em] uppercase text-muted-foreground">
                {pick(lang, "Achievement Wall", "徽章墙")}
              </span>
              <span className="mt-1 block font-display text-2xl text-foreground">
                {pick(lang, "MY ACHIEVEMENTS", "我的徽章")}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {pick(lang, "Every badge you have really earned.", "每一枚真正获得的徽章。")}
              </span>
            </span>
            <span aria-hidden className="text-2xl text-muted-foreground">
              →
            </span>
          </button>
        )}

        <footer className="mt-20 flex flex-wrap items-center gap-2 border-t border-border/60 pt-8">
          {seen ? (
            <Button variant="soft" onClick={onClose}>
              {ui.backToMap}
            </Button>
          ) : (
            <Button variant="soft" onClick={onDone}>
              {ui.seenThis}
            </Button>
          )}
        </footer>
      </div>
    </div>
  );
}
