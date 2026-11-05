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
  {
    id: "community",
    name: "Community",
    nameZh: "留言",
    kicker: "Say hello",
    kickerZh: "打个招呼",
    sections: [
      {
        id: "guestbook",
        title: "Guestbook",
        body: "[Placeholder] A guestbook, once there's a backend to hold it. No sign-in required.",
      },
      {
        id: "contact",
        title: "Contact",
        body: "[Placeholder] How to reach me — links and handles, only the ones meant to be public.",
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
