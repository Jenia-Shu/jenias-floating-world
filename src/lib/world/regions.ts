export type Section = { id: string; title: string; body: string };

export type RegionMeta = {
  id: string;
  name: string;
  nameZh: string;
  kicker: string;
  kickerZh: string;
  sections: Section[];
};

/**
 * Visit order. The main island is always reachable; each satellite unlocks
 * once the one before it has been visited, so the map fills up one island
 * at a time instead of all at once.
 *
 * `about` is the main island itself — its panel holds the My World sections.
 * `community` is the Message Island (A Little Message): a drifting-bottle
 * chapter that ends with the collie leading the visitor into `fun`.
 * Keep that pair adjacent — the story depends on it.
 */
export const REGIONS: RegionMeta[] = [
  {
    id: "about",
    name: "My World",
    nameZh: "我的世界",
    kicker: "Who lives here",
    kickerZh: "住在这里的人",
    sections: [
      {
        id: "about",
        title: "About Me",
        body: "[Placeholder] A short introduction from Jenia will live here — who I am, in a few lines.",
      },
      {
        id: "interests",
        title: "Interests",
        body: "[Placeholder] The things that keep me curious: books, music, films, games, making.",
      },
      {
        id: "journey",
        title: "Journey",
        body: "[Placeholder] A short timeline — places, schools, jobs, turning points, written as moments.",
      },
    ],
  },
  {
    id: "gallery",
    name: "Gallery",
    nameZh: "作品集",
    kicker: "Things I've made",
    kickerZh: "我做过的东西",
    sections: [
      {
        id: "wall",
        title: "The wall",
        body: "One plate per moment, hung in the order they happened — twenty-five of them, from the summer before Grade 10 to the debate cup in November 2026.",
      },
    ],
  },
  {
    id: "collections",
    name: "Collections",
    nameZh: "收藏",
    kicker: "What I keep coming back to",
    kickerZh: "反复回到的东西",
    sections: [
      {
        id: "books",
        title: "Books",
        body: "[Placeholder] The shelf that shaped me, and the one I'm on now.",
      },
      {
        id: "music",
        title: "Music",
        body: "[Placeholder] Songs and playlists — always muted until a visitor asks for sound.",
      },
      {
        id: "movies",
        title: "Movies",
        body: "[Placeholder] Films worth rewatching, and the ones I defend too hard.",
      },
    ],
  },
  {
    id: "community",
    name: "A Little Message",
    nameZh: "一封信的岛",
    kicker: "A little message across the world",
    kickerZh: "漂过海来的一封信",
    // The reading surface is a dedicated page (MessageIslandPage). These
    // sections stay as a plain-language fallback / map of the island's scenes.
    sections: [
      {
        id: "shore",
        title: "The Shore",
        body: "Shells, driftwood and shallow waves. A border collie waits here with a bottle in her mouth.",
      },
      {
        id: "letter",
        title: "The Letter",
        body: "A letter from Jenia's World, kept in the little wooden box so it can be opened again.",
      },
      {
        id: "post",
        title: "Message Post",
        body: "A tiny wooden post office with maps, paper, bottles and letters that were never sent.",
      },
      {
        id: "lighthouse",
        title: "The Lighthouse",
        body: "A white lighthouse on the highest point, its beam turning slowly over the clouds and the other islands.",
      },
      {
        id: "bridge",
        title: "The Bridge",
        body: "A wooden bridge leading into the mist. Follow the collie and it opens onto the Fun Zone.",
      },
    ],
  },
  {
    id: "fun",
    name: "Fun Zone",
    nameZh: "乐园",
    kicker: "Play a little",
    kickerZh: "玩一会儿",
    sections: [
      {
        id: "games",
        title: "Games",
        body: "[Placeholder] Small things to poke at — quizzes, mini games, silly experiments.",
      },
      {
        id: "badges",
        title: "Badges",
        body: "[Placeholder] Achievements visitors collect by wandering the islands and finding secrets.",
      },
    ],
  },
];

/** Legacy shared key from before per-nickname progress; `lib/user.ts` reads it once on first sign-in. */
export const VISITED_KEY = "jenia:visited:v1";

/** The first region is always reachable; the rest need their predecessor visited. */
export function isUnlocked(id: string, visited: readonly string[]): boolean {
  const i = REGIONS.findIndex((r) => r.id === id);
  return i <= 0 || visited.includes(REGIONS[i - 1]!.id);
}

export function regionById(id: string): RegionMeta | undefined {
  return REGIONS.find((r) => r.id === id);
}
