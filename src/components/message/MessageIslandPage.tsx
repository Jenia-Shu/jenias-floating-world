import { Button } from "@/components/ui/button";
import { LangSwitch } from "@/components/LangSwitch";
import { pick, t, useLang } from "@/lib/i18n";
import type { RegionMeta } from "@/lib/world/regions";

type Props = {
  region: RegionMeta;
  seen: boolean;
  onClose: () => void;
  onDone: () => void;
  onHome: () => void;
  /** Opens the drifting-bottle letter again from the little wooden box. */
  onOpenLetter: () => void;
  /** The collie leads the visitor across the bridge into the Fun Zone. */
  onFollow: () => void;
};

/** Five small scenes, straight from the Message Island brief. Descriptive on
 *  purpose: the personal writing on this island belongs to the user. */
const SCENES = [
  {
    no: "01",
    en: "The Drift Bottle Beach",
    zh: "漂流瓶海滩",
    bodyEn: "Shells, small stones, driftwood and shallow waves. The border collie spends most of her time here.",
    bodyZh: "沙滩上有贝壳、小石头、漂流木和浅浅的海浪。边牧最常在这里活动。",
  },
  {
    no: "02",
    en: "The Letter",
    zh: "一封来自杰尼亚的邀请",
    bodyEn: "The cork pops, a rolled-up letter drifts out and unfolds in the air. It folds back into the little wooden box and can be opened again later.",
    bodyZh: "瓶塞轻轻弹开。一张卷起来的信纸慢慢飘出来，在空中展开。信纸重新折叠，放回漂流瓶旁边的小木箱里，之后能够再次打开阅读。",
  },
  {
    no: "03",
    en: "Message Post",
    zh: "海边小邮局",
    bodyEn: "A tiny wooden house with a mailbox and a Message Post sign. Inside: maps, paper, bottles and letters never sent.",
    bodyZh: "一间小小的木屋，门口有邮箱和一块写着 Message Post 的木牌。里面摆放地图、信纸、瓶子和一些没有寄出的信。",
  },
  {
    no: "04",
    en: "The Lighthouse",
    zh: "云海灯塔",
    bodyEn: "A small white lighthouse on the highest point. Its light turns slowly; other islands and cloud banks are visible in the distance.",
    bodyZh: "岛屿最高处的白色小灯塔。灯光会缓缓旋转，远处能看见其他岛屿和云层。",
  },
  {
    no: "05",
    en: "The Wooden Bridge",
    zh: "远方木桥",
    bodyEn: "The island's way out. The end of the bridge is hidden in the mist for now — you can't quite see what is over there.",
    bodyZh: "岛屿通往下一片区域的出口。桥的尽头暂时藏在云雾里，暂时看不清那边是什么。",
  },
];

/**
 * Reading surface for A Little Message / 一封信的岛. The letter itself lives in
 * LetterModal (opened from the bottle on the map); this page is the little
 * wooden box that lets a visitor read it again, plus the chapter that hands
 * the story over to the Fun Zone.
 */
export function MessageIslandPage({
  region,
  seen,
  onClose,
  onDone,
  onHome,
  onOpenLetter,
  onFollow,
}: Props) {
  const [lang] = useLang();
  const ui = t(lang);

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
          {pick(lang, "A LITTLE MESSAGE FOR YOU", "有人给你留下了一封信")}
        </p>
        <h1 className="mt-2 font-display text-5xl leading-[0.95] text-foreground sm:text-7xl">
          {pick(lang, region.name, region.nameZh)}
        </h1>
        <p className="mt-5 max-w-lg text-[0.95rem] leading-[1.85] text-muted-foreground">
          {pick(
            lang,
            "A small island floating between a sea of clouds and the blue ocean. Soft sand, pale blue water, a lighthouse, a wooden house, wildflowers and a bridge leading off into the distance.",
            "一座漂浮在云海与蓝色海洋之间的小岛。岛上有柔软的沙滩、浅蓝色海水、灯塔、木质小屋、野花和一条通向远方的木桥。",
          )}
        </p>

        <div className="mt-14 space-y-10">
          {SCENES.map((s) => (
            <section key={s.no} className="flex gap-5">
              <span className="mt-1 shrink-0 font-display text-lg text-accent-foreground/60 tabular-nums">
                {s.no}
              </span>
              <div>
                <h2 className="text-[0.7rem] tracking-[0.28em] uppercase text-accent-foreground">
                  {pick(lang, s.en, s.zh)}
                </h2>
                <p className="mt-3 text-[0.95rem] leading-[1.85] text-muted-foreground">
                  {pick(lang, s.bodyEn, s.bodyZh)}
                </p>
              </div>
            </section>
          ))}
        </div>

        {/* The letter is a keepsake: it can be opened again at any time. */}
        <button
          type="button"
          onClick={onOpenLetter}
          className="mt-14 flex w-full items-center justify-between gap-4 rounded-3xl border border-border/60 bg-background/70 px-5 py-5 text-left transition hover:border-foreground/30"
        >
          <span>
            <span className="block text-[0.62rem] tracking-[0.28em] uppercase text-muted-foreground">
              {pick(lang, "In the little wooden box", "小木箱里")}
            </span>
            <span className="mt-1 block font-display text-2xl text-foreground">
              {pick(lang, "Read the letter again", "再读一次这封信")}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {pick(lang, "Keep it as a small keepsake — you can open it again later.", "信件也可以作为一个小收藏保留，访客之后能够再次打开阅读。")}
            </span>
          </span>
          <span aria-hidden className="text-2xl text-muted-foreground">
            →
          </span>
        </button>

        {/* Ending of the chapter: the collie leads the way to the Fun Zone. */}
        <section className="mt-16 rounded-3xl border border-border/60 bg-background/50 px-6 py-8 text-center">
          <p className="text-[0.6rem] tracking-[0.3em] uppercase text-accent-foreground">
            {pick(lang, "A NEW PLACE TO DISCOVER", "云雾的另一边")}
          </p>
          <h2 className="mt-3 font-display text-4xl text-foreground">Fun Zone</h2>
          <p className="mx-auto mt-4 max-w-sm text-[0.88rem] leading-[1.85] text-muted-foreground">
            {pick(
              lang,
              "The world is more fun when you play.",
              "世界不只有值得收藏的风景，还有值得亲自参与的冒险。",
            )}
          </p>
          <Button variant="soft" className="mt-7" onClick={onFollow}>
            {pick(lang, "Follow her", "跟上它")} <span aria-hidden>→</span>
          </Button>
        </section>

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
