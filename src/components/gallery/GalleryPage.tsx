import { useCallback, useEffect, useMemo, useState } from "react";
import { LangSwitch } from "@/components/LangSwitch";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { pick, t, useLang } from "@/lib/i18n";
import { PLATES } from "@/lib/world/gallery";
import { ART } from "@/lib/world/artworks";

const INK = "#2f4156";
const BODY = "#465a72";
const MUTE = "#7d9fc4";
const GOLD = "#a8813f";

type Props = {
  seen: boolean;
  onClose: () => void;
  onDone: () => void;
  onHome: () => void;
};

/**
 * The Gallery island. The wall shows framed paintings only - one public-domain
 * picture per moment, nothing written on it. A frame opens to the words she
 * wrote at the time.
 */
export function GalleryPage({ seen, onClose, onDone, onHome }: Props) {
  const [lang] = useLang();
  const ui = t(lang);
  const zh = lang === "zh";
  const [api, setApi] = useState<CarouselApi>();
  const [index, setIndex] = useState(0);
  // `?plate=13` opens that frame straight away - handy for sharing one moment.
  const [opened, setOpened] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const n = Number(new URLSearchParams(window.location.search).get("plate"));
    return Number.isInteger(n) && n >= 1 && n <= PLATES.length ? n - 1 : null;
  });

  const total = PLATES.length;
  // The paintings are real files, so the wall is blank until they arrive. Load
  // them up front and say what is happening instead of showing an empty room.
  const artworks = useMemo(() => PLATES.map((p) => ART[p.id]).filter((a) => Boolean(a)), []);
  const [artLoaded, setArtLoaded] = useState(0);
  const [galleryReady, setGalleryReady] = useState(false);
  const [detailLoaded, setDetailLoaded] = useState(false);

  useEffect(() => {
    setDetailLoaded(false);
  }, [opened]);

  useEffect(() => {
    let alive = true;
    let settled = 0;
    const count = artworks.length;
    if (count === 0) {
      setGalleryReady(true);
      return;
    }
    // Never trap the visitor behind a broken file: after 12s the wall opens
    // anyway and any missing picture shows the empty frame.
    const giveUp = window.setTimeout(() => {
      if (alive) setGalleryReady(true);
    }, 12000);
    for (const a of artworks) {
      const img = new Image();
      const done = () => {
        settled += 1;
        if (!alive) return;
        setArtLoaded(settled);
        if (settled >= count) setGalleryReady(true);
      };
      img.onload = done;
      img.onerror = done;
      img.src = a!.src;
    }
    return () => {
      alive = false;
      window.clearTimeout(giveUp);
    };
  }, [artworks]);

  const plate = opened === null ? null : (PLATES[opened] ?? null);
  const art = plate ? (ART[plate.id] ?? null) : null;

  useEffect(() => {
    if (!api) return;
    const sync = () => setIndex(api.selectedScrollSnap());
    sync();
    api.on("select", sync);
    api.on("reInit", sync);
    return () => {
      api.off("select", sync);
      api.off("reInit", sync);
    };
  }, [api]);

  const step = useCallback(
    (dir: 1 | -1) => {
      setOpened((cur) => {
        if (cur === null) return cur;
        const next = Math.min(total - 1, Math.max(0, cur + dir));
        api?.scrollTo(next);
        return next;
      });
    },
    [api, total],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpened(null);
      if (e.key === "ArrowRight") {
        if (opened === null) api?.scrollNext();
        else step(1);
      }
      if (e.key === "ArrowLeft") {
        if (opened === null) api?.scrollPrev();
        else step(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [api, opened, step]);

  return (
    <div className="fixed inset-0 z-30 flex flex-col overflow-hidden bg-[linear-gradient(180deg,#eef4f9_0%,#e3ecf3_55%,#d8e3ec_100%)]">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-4 pt-4 sm:gap-3 sm:px-7 sm:pt-6">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/70 bg-white/60 px-3 py-1.5 text-[0.68rem] font-medium tracking-wide text-[#3c5168] backdrop-blur-md transition hover:bg-white/85 sm:px-4 sm:py-2 sm:text-[0.72rem]"
        >
          ← {ui.map}
        </button>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <LangSwitch tone="light" />
          <button
            type="button"
            onClick={onHome}
            className="rounded-full border border-[#2f4156]/15 px-3 py-1.5 text-[0.68rem] tracking-wide text-[#3c5168] transition hover:bg-white/60 sm:px-4 sm:py-2 sm:text-[0.72rem]"
          >
            {ui.home}
          </button>
        </div>
      </header>

      <div className="shrink-0 px-5 pt-6 sm:px-12 sm:pt-8">
        <p className="text-[0.62rem] font-medium uppercase tracking-[0.34em]" style={{ color: MUTE }}>
          {zh ? "我做过的事" : "Things I have done"}
        </p>
        <h1
          className="mt-2 text-[1.72rem] font-semibold leading-tight tracking-tight sm:text-[2.5rem]"
          style={{ color: INK }}
        >
          {zh ? "一年，一幅一幅" : "One year, plate by plate"}
        </h1>
        <p className="mt-2 max-w-xl text-[0.84rem] leading-relaxed" style={{ color: BODY }}>
          {zh
            ? "每个瞬间挂一幅。左右拖动看画，点开一幅，才看见我当时写的那句话。"
            : "One moment per frame. Drag sideways to look; open a frame to read what I wrote then."}
        </p>
      </div>

      <main className="mt-6 flex min-h-0 flex-1 flex-col justify-center pb-20 sm:mt-8 sm:pb-24">
        <Carousel setApi={setApi} opts={{ align: "center", containScroll: "trimSnaps" }} className="min-h-0">
          <CarouselContent className="items-center px-4 sm:px-8">
            {PLATES.map((p, i) => {
              const a = ART[p.id];
              return (
                <CarouselItem
                  key={p.id}
                  className="flex h-[52vh] basis-[80%] justify-center pl-4 sm:basis-[50%] sm:pl-6 lg:basis-[34%] xl:basis-[27%]"
                >
                  <button
                    type="button"
                    onClick={() => setOpened(i)}
                    aria-label={`${zh ? "第" : "Plate "}${i + 1}${zh ? "幅" : ""}`}
                    className="group flex h-full w-full cursor-pointer flex-col items-center justify-end focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a8813f]"
                  >
                    {/* the frame sits on the label line, so every label on the
                        wall lands on the same baseline whatever the shape */}
                    <span className="flex min-h-0 w-full flex-1 items-end justify-center">
                      <span
                        className="relative block transition-transform duration-500 group-hover:-translate-y-1"
                        style={{
                          aspectRatio: a ? `${a.w} / ${a.h}` : "4 / 3",
                          width: a ? `min(100%, calc(46vh * ${a.w / a.h}))` : "100%",
                        }}
                      >
                    {/* gilded frame, then a linen mat, then the painting */}
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-[3px] bg-[linear-gradient(145deg,#d8bd85_0%,#9c7838_28%,#e6d3a4_52%,#8f6c2f_78%,#c8a86c_100%)] shadow-[0_26px_50px_-28px_rgba(31,48,68,0.85)]"
                    />
                    <span aria-hidden className="absolute inset-[3px] bg-[#f6f1e4]" />
                    <span aria-hidden className="absolute inset-[4px] shadow-[inset_0_2px_6px_rgba(47,65,86,0.28)]" />
                    {a && (
                      <img
                        src={a.src}
                        alt={`${a.title} — ${a.artist}`}
                        width={a.w}
                        height={a.h}
                        loading={i < 3 ? "eager" : "lazy"}
                        className="absolute inset-[4px] h-[calc(100%-8px)] w-[calc(100%-8px)] object-cover saturate-[0.94] transition-[filter] duration-500 group-hover:saturate-100"
                      />
                    )}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.35),transparent_58%)]"
                    />
                      </span>
                    </span>

                    {/* the wall label: when it happened, and what that stretch was */}
                    <span className="block shrink-0 pt-3 text-center sm:pt-4">
                      <span
                        className="block font-mono text-[0.62rem] tabular-nums tracking-[0.16em]"
                        style={{ color: MUTE }}
                      >
                        {p.date}
                      </span>
                      <span
                        className="mt-1 block text-[0.92rem] font-semibold tracking-[0.08em]"
                        style={{ color: INK }}
                      >
                        {pick(lang, p.tag.en, p.tag.zh)}
                      </span>
                    </span>
                  </button>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-10 flex flex-wrap items-center gap-4 border-t border-[#2f4156]/10 bg-[#e4edf4]/88 px-5 pb-4 pt-3 backdrop-blur-md sm:px-12 sm:pb-5">
        <span className="font-mono text-[0.7rem] tabular-nums tracking-[0.14em]" style={{ color: INK }}>
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <span className="relative h-[2px] min-w-[6rem] flex-1 overflow-hidden rounded-full bg-[#2f4156]/12">
          <span
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
            style={{ width: `${((index + 1) / total) * 100}%`, background: GOLD }}
          />
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => api?.scrollPrev()}
            disabled={!api?.canScrollPrev()}
            aria-label={zh ? "上一幅" : "Previous"}
            className="grid h-9 w-9 place-items-center rounded-full border border-[#2f4156]/20 text-[#3c5168] transition hover:bg-white/70 disabled:opacity-30"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => api?.scrollNext()}
            disabled={!api?.canScrollNext()}
            aria-label={zh ? "下一幅" : "Next"}
            className="grid h-9 w-9 place-items-center rounded-full border border-[#2f4156]/20 text-[#3c5168] transition hover:bg-white/70 disabled:opacity-30"
          >
            →
          </button>
        </div>
        <button
          type="button"
          onClick={seen ? onClose : onDone}
          className="rounded-full bg-[#2f4156] px-4 py-2 text-[0.74rem] font-medium tracking-wide text-white transition hover:bg-[#3c5168]"
        >
          {seen ? ui.backToMap : ui.seenThis}
        </button>
      </footer>

      {plate && opened !== null && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-[#0d1822]/62 p-3 backdrop-blur-[3px] sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={pick(lang, plate.title.en, plate.title.zh)}
          onClick={() => setOpened(null)}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-[1040px] flex-col overflow-y-auto rounded-[0.4rem] bg-[#fbf8f1] shadow-[0_50px_120px_-50px_rgba(0,0,0,0.85)] md:grid md:grid-cols-[1.08fr_1fr] md:overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative grid shrink-0 place-items-center bg-[#e8e2d4] p-4 sm:p-6 md:p-8">
              {!detailLoaded && art && (
                <span className="absolute inset-0 grid place-items-center" aria-hidden>
                  <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#2f4156]/15 border-t-[#a8813f]" />
                </span>
              )}
              {art && (
                <img
                  src={art.src}
                  alt={`${art.title} — ${art.artist}`}
                  onLoad={() => setDetailLoaded(true)}
                  className={`max-h-[38vh] w-auto max-w-full object-contain shadow-[0_20px_45px_-24px_rgba(31,48,68,0.9)] transition-opacity duration-500 md:max-h-[76vh] ${detailLoaded ? "opacity-100" : "opacity-0"}`}
                />
              )}
            </div>

            <div className="flex min-h-0 flex-col gap-4 overflow-y-auto p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="font-mono text-[0.68rem] tabular-nums tracking-[0.18em]" style={{ color: GOLD }}>
                    {String(opened + 1).padStart(2, "0")} · {plate.date}
                  </span>
                  <h2 className="mt-2 text-[1.36rem] font-semibold leading-snug" style={{ color: INK }}>
                    {pick(lang, plate.title.en, plate.title.zh)}
                  </h2>
                  <p className="mt-1 text-[0.68rem] uppercase tracking-[0.18em]" style={{ color: MUTE }}>
                    {pick(lang, plate.role.en, plate.role.zh)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpened(null)}
                  aria-label={zh ? "关掉" : "Close"}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#2f4156]/20 text-[#3c5168] transition hover:bg-[#2f4156]/5"
                >
                  ✕
                </button>
              </div>

              {plate.quote && (
                <blockquote
                  className="border-l-2 pl-4 text-[1rem] leading-[1.95]"
                  style={{ borderColor: GOLD, color: BODY }}
                >
                  {zh ? `「${plate.quote.zh}」` : `“${plate.quote.en}”`}
                </blockquote>
              )}

              {plate.note && (
                <p className="text-[0.78rem] leading-relaxed" style={{ color: MUTE }}>
                  {pick(lang, plate.note.en, plate.note.zh)}
                </p>
              )}

              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    disabled={opened === 0}
                    className="rounded-full border border-[#2f4156]/20 px-3 py-1.5 text-[0.72rem] text-[#3c5168] transition hover:bg-[#2f4156]/5 disabled:opacity-30"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    disabled={opened === total - 1}
                    className="rounded-full border border-[#2f4156]/20 px-3 py-1.5 text-[0.72rem] text-[#3c5168] transition hover:bg-[#2f4156]/5 disabled:opacity-30"
                  >
                    →
                  </button>
                </div>
                {art && (
                  <p className="text-[0.66rem] leading-relaxed tracking-wide" style={{ color: MUTE }}>
                    {art.artist}，《{art.title}》，{art.year} · {zh ? "公有领域" : "public domain"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!galleryReady && (
        <div
          className="absolute inset-0 z-50 grid place-items-center bg-[linear-gradient(180deg,#eef4f9_0%,#e3ecf3_55%,#d8e3ec_100%)]"
          role="status"
          aria-live="polite"
        >
          <div className="flex w-[min(20rem,78vw)] flex-col items-center text-center">
            <span className="h-9 w-9 animate-spin rounded-full border-2 border-[#2f4156]/15 border-t-[#a8813f]" aria-hidden />
            <p className="mt-6 text-[0.6rem] font-medium uppercase tracking-[0.34em]" style={{ color: MUTE }}>
              {zh ? "画廊" : "The gallery"}
            </p>
            <p className="mt-2 text-[0.98rem] font-medium" style={{ color: INK }}>
              {zh ? "正在把画挂上墙…" : "Hanging the paintings…"}
            </p>
            <p className="mt-1 text-[0.74rem] tabular-nums" style={{ color: BODY }}>
              {zh
                ? `${artLoaded} / ${artworks.length} 幅已就位`
                : `${artLoaded} / ${artworks.length} frames ready`}
            </p>
            <span className="relative mt-4 block h-[2px] w-full overflow-hidden rounded-full bg-[#2f4156]/12" aria-hidden>
              <span
                className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300"
                style={{
                  width: `${artworks.length ? Math.round((artLoaded / artworks.length) * 100) : 0}%`,
                  background: GOLD,
                }}
              />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
