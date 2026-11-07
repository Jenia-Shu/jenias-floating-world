/**
 * Tiny Maze — level data (Chapters 01–03).
 *
 * The grid is only a *description* of the world: the player moves in continuous
 * world space and collides with AABBs generated from `#` cells. That keeps the
 * "free movement, not tile stepping" requirement while a plain string stays
 * easy to author, read and validate.
 *
 * Legend
 *   #  hedge wall        .  path          P  start        S  star
 *   C  hidden chest      E  exit          G  gate (wall until the puzzle opens it)
 *   D  statue (sits in a hedge niche, so it also blocks)   H  clue sign
 *   h  hidden passage (looks like a hedge, but you can walk through it)
 */

import type { Lang } from "@/lib/i18n";

export type Bi = { en: string; zh: string };

export type Theme = {
  sky: string;
  ground: string;
  hedge: string;
  hedgeTop: string;
  accent: string;
};

export type LevelDef = {
  id: number;
  num: string;
  name: Bi;
  subtitle: Bi;
  story: Bi;
  goal: Bi;
  rules: Bi[];
  mechanism: Bi;
  controls: Bi;
  collect: Bi;
  clue: Bi;
  hint1: Bi;
  hint2: Bi;
  flowers: Bi[];
  /** 0 = North (-z), 1 = East (+x), 2 = South (+z), 3 = West (-x). */
  answers: number[];
  initialDirs: number[];
  theme: Theme;
  grid: string[];
};

export const CELL = 1.15;
export const PLAYER_RADIUS = 0.26;
export const MOVE_SPEED = 2.45;
/** Hold Shift to let the princess hurry — a gentle boost, not a sprint. */
export const SHIFT_BOOST = 1.7;
/** A cell is 1.15 wide. Reach must comfortably cover a whole adjacent cell
 *  (so a statue is interactable even when the princess arrives at the far edge
 *  of the cell next to it), but stay under two cells so it never latches onto
 *  something two squares away. */
export const INTERACT_RANGE = 1.9;

export const DIRECTIONS: Bi[] = [
  { en: "North", zh: "北" },
  { en: "East", zh: "东" },
  { en: "South", zh: "南" },
  { en: "West", zh: "西" },
];

export const LEVELS: LevelDef[] = [
  {
    id: 1,
    num: "01",
    name: { en: "Garden Path", zh: "花园小径" },
    subtitle: { en: "A little maze, a little mystery.", zh: "一座小迷宫，一点小秘密。" },
    story: {
      en: "Princess found a quiet garden wrapped in flowers and hedges. Somewhere deep inside, a secret path is waiting to be noticed.",
      zh: "公主发现了一座被花朵和树篱围住的安静花园。花园深处，有一条不容易被发现的小路在等着她。",
    },
    goal: {
      en: "Explore the garden, solve the three statues and find the exit behind the hidden gate.",
      zh: "探索花园，解开三座雕像的谜题，找到隐藏小门后的出口。",
    },
    rules: [
      { en: "Walk freely — there is no timer and no penalty for a wrong turn.", zh: "自由走动，没有倒计时，走错也不会扣分。" },
      { en: "Read the wooden clue sign in the middle of the garden.", zh: "读一读花园中央的木质提示牌。" },
      { en: "Turn each statue so its flower faces the direction written on the sign.", zh: "按照提示牌，把每座雕像上的花朵转到对应的方向。" },
      { en: "When all three are right, the hidden gate opens.", zh: "三座都转对后，隐藏小门就会打开。" },
      { en: "You do not need every star to finish the chapter.", zh: "不收集齐星星也可以通关。" },
    ],
    mechanism: {
      en: "Three statues carry three flowers: Rose, Daisy and Tulip. Stand beside one and press Space to turn it a quarter-turn. A small golden pointer shows which way it is facing.",
      zh: "三座雕像分别刻着玫瑰、雏菊和郁金香。站在雕像旁按空格，它会转四分之一圈；底座上的金色小指针指向它当前的方向。",
    },
    controls: {
      en: "WASD / arrow keys to walk · Space to interact · M for the map · Esc to pause. On a phone, use the joystick and the round button.",
      zh: "WASD／方向键走动 · 空格互动 · M 打开地图 · Esc 暂停。手机上用左下角摇杆和右下角圆按钮。",
    },
    collect: {
      en: "Three stars are tucked into different paths, and one hidden chest waits behind a hedge that is not quite as solid as it looks. Finding them is optional — but lovely.",
      zh: "三颗星星藏在不同的小路里，一只隐藏宝箱等在某段「看起来是树篱」的地方后面。找不找都可以，但找到会很高兴。",
    },
    clue: {
      en: "Rose → North · Daisy → East · Tulip → South",
      zh: "玫瑰朝北 · 雏菊朝东 · 郁金香朝南",
    },
    hint1: {
      en: "The wooden sign in the middle of the garden tells you which way every flower should face. Look for the gold pointer on each statue's base.",
      zh: "花园中央的木牌写着每种花该朝哪个方向。注意每座雕像底座上的金色指针。",
    },
    hint2: {
      en: "Rose faces North, Daisy faces East, Tulip faces South. Press Space beside a statue to turn it — wrong turns are free.",
      zh: "玫瑰朝北、雏菊朝东、郁金香朝南。站在雕像旁按空格转动它，转错没有任何惩罚。",
    },
    flowers: [
      { en: "Rose", zh: "玫瑰" },
      { en: "Daisy", zh: "雏菊" },
      { en: "Tulip", zh: "郁金香" },
    ],
    answers: [0, 1, 2],
    initialDirs: [2, 3, 0],
    theme: {
      sky: "#e2f0e4",
      ground: "#f3ead2",
      hedge: "#7fae7b",
      hedgeTop: "#a8c995",
      accent: "#d9b877",
    },
    grid: [
      "###############",
      "#P.........S###",
      "##.D.#.#.#.####",
      "#.....H.....###",
      "##.#.#.#.#.####",
      "#...........#.#",
      "##.#.D.#.#..GE#",
      "#.S.........#.#",
      "##.#.#.#.#.####",
      "#...........###",
      "#h.#.#.#.D..###",
      "#C#.......S.###",
      "###############",
    ],
  },
  {
    id: 2,
    num: "02",
    name: { en: "Lantern Court", zh: "灯笼庭院" },
    subtitle: { en: "A warm little puzzle as the sun goes down.", zh: "夕阳里一座暖暖的小谜题。" },
    story: {
      en: "Lanterns have been lit along the hedge, but the three flower statues have been turned the wrong way. Help Princess set them right before the courtyard goes quiet.",
      zh: "树篱边上的灯笼已经点亮，可三座花朵雕像却被人转错了方向。趁庭院还亮着，帮公主把它们转回来。",
    },
    goal: {
      en: "Turn the three flower statues to the directions on the lantern sign, then find the exit behind the hidden gate.",
      zh: "把三座花朵雕像转到灯笼牌上写的方向，再找到隐藏小门后的出口。",
    },
    rules: [
      { en: "Walk freely — no timer, no penalty for a wrong turn.", zh: "自由走动，没有倒计时，走错也不扣分。" },
      { en: "Read the lantern clue sign in the middle of the court.", zh: "读一读庭院中央的灯笼提示牌。" },
      { en: "Turn each statue with Space so its flower faces the way the sign says.", zh: "站在雕像旁按空格转动，让花朵朝向牌上写的方向。" },
      { en: "When all three are right, the hidden gate opens.", zh: "三座都转对后，隐藏小门就会打开。" },
      { en: "You do not need every star to finish the chapter.", zh: "不收集齐星星也可以通关。" },
    ],
    mechanism: {
      en: "Three statues carry Rose, Daisy and Tulip. Stand beside one and press Space to turn it a quarter-turn. A small golden pointer shows which way it is facing.",
      zh: "三座雕像分别刻着玫瑰、雏菊和郁金香。站在雕像旁按空格，它会转四分之一圈；底座上的金色小指针指向它当前的方向。",
    },
    controls: {
      en: "WASD / arrow keys to walk · Space to interact · M for the map · Esc to pause. On a phone, use the joystick and the round button.",
      zh: "WASD／方向键走动 · 空格互动 · M 打开地图 · Esc 暂停。手机上用左下角摇杆和右下角圆按钮。",
    },
    collect: {
      en: "Three stars are tucked into the lantern-lit paths, and one hidden chest waits behind a hedge that is not quite as solid as it looks. Finding them is optional — but lovely.",
      zh: "三颗星星藏在灯笼照亮的岔路上，一只隐藏宝箱等在某段「看起来是树篱」的地方后面。找不找都可以，但找到会很高兴。",
    },
    clue: {
      en: "Rose → East · Daisy → South · Tulip → West",
      zh: "玫瑰朝东 · 雏菊朝南 · 郁金香朝西",
    },
    hint1: {
      en: "The lantern sign in the middle of the court tells you which way every flower should face. Look for the gold pointer on each statue's base.",
      zh: "庭院中央的灯笼牌写着每种花该朝哪个方向。注意每座雕像底座上的金色指针。",
    },
    hint2: {
      en: "Rose faces East, Daisy faces South, Tulip faces West. Press Space beside a statue to turn it — wrong turns are free.",
      zh: "玫瑰朝东、雏菊朝南、郁金香朝西。站在雕像旁按空格转动它，转错没有任何惩罚。",
    },
    flowers: [
      { en: "Rose", zh: "玫瑰" },
      { en: "Daisy", zh: "雏菊" },
      { en: "Tulip", zh: "郁金香" },
    ],
    answers: [1, 2, 3],
    initialDirs: [3, 0, 1],
    theme: {
      sky: "#f4ead9",
      ground: "#efe3c6",
      hedge: "#8ab182",
      hedgeTop: "#bcd3a2",
      accent: "#e0a85a",
    },
    grid: [
      "###############",
      "#P#....S..#..S#",
      "#.#.###.###.#.#",
      "#.#G.E#.....#.#",
      "#.#####.#####.#",
      "#.....#h.C#...#",
      "#####.#####.###",
      "#D#...#..H#...#",
      "#.#.###.#.###.#",
      "#.#.#D..#.#..S#",
      "#.#.###.#.#.#.#",
      "#.......#...#D#",
      "###############",
    ],
  },
  {
    id: 3,
    num: "03",
    name: { en: "Starfall Hollow", zh: "落星幽谷" },
    subtitle: { en: "One last maze, under a sky full of stars.", zh: "星空下，最后一座迷宫。" },
    story: {
      en: "Under the first stars, the court has gone quiet and the statues wait in the dark. Turn the three flowers to the signs written in starlight, and the last gate will open.",
      zh: "第一颗星星亮起，庭院安静下来，雕像在夜色里等着。把三朵花转到星光写出的方向，最后一道门就会打开。",
    },
    goal: {
      en: "Turn the three flower statues to the directions on the starlight sign, then step through the hidden gate to the exit.",
      zh: "把三座花朵雕像转到星光牌上写的方向，再穿过隐藏小门走向出口。",
    },
    rules: [
      { en: "Walk freely — no timer, no penalty for a wrong turn.", zh: "自由走动，没有倒计时，走错也不扣分。" },
      { en: "Read the starlight clue sign in the middle of the hollow.", zh: "读一读幽谷中央的星光提示牌。" },
      { en: "Turn each statue with Space so its flower faces the way the sign says.", zh: "站在雕像旁按空格转动，让花朵朝向牌上写的方向。" },
      { en: "When all three are right, the hidden gate opens.", zh: "三座都转对后，隐藏小门就会打开。" },
      { en: "You do not need every star to finish the chapter.", zh: "不收集齐星星也可以通关。" },
    ],
    mechanism: {
      en: "Three statues carry Rose, Daisy and Tulip. Stand beside one and press Space to turn it a quarter-turn. A small golden pointer shows which way it is facing.",
      zh: "三座雕像分别刻着玫瑰、雏菊和郁金香。站在雕像旁按空格，它会转四分之一圈；底座上的金色小指针指向它当前的方向。",
    },
    controls: {
      en: "WASD / arrow keys to walk · Space to interact · M for the map · Esc to pause. On a phone, use the joystick and the round button.",
      zh: "WASD／方向键走动 · 空格互动 · M 打开地图 · Esc 暂停。手机上用左下角摇杆和右下角圆按钮。",
    },
    collect: {
      en: "Three stars are scattered across the moonlit paths, and one hidden chest waits behind a hedge that is not quite as solid as it looks. Finding them is optional — but lovely.",
      zh: "三颗星星散落在月光照亮的岔路上，一只隐藏宝箱等在某段「看起来是树篱」的地方后面。找不找都可以，但找到会很高兴。",
    },
    clue: {
      en: "Rose → South · Daisy → North · Tulip → East",
      zh: "玫瑰朝南 · 雏菊朝北 · 郁金香朝东",
    },
    hint1: {
      en: "The starlight sign in the middle of the hollow tells you which way every flower should face. Look for the gold pointer on each statue's base.",
      zh: "幽谷中央的星光牌写着每种花该朝哪个方向。注意每座雕像底座上的金色指针。",
    },
    hint2: {
      en: "Rose faces South, Daisy faces North, Tulip faces East. Press Space beside a statue to turn it — wrong turns are free.",
      zh: "玫瑰朝南、雏菊朝北、郁金香朝东。站在雕像旁按空格转动它，转错没有任何惩罚。",
    },
    flowers: [
      { en: "Rose", zh: "玫瑰" },
      { en: "Daisy", zh: "雏菊" },
      { en: "Tulip", zh: "郁金香" },
    ],
    answers: [2, 0, 1],
    initialDirs: [0, 3, 2],
    theme: {
      sky: "#2c3a57",
      ground: "#d9e0ea",
      hedge: "#5f7e8c",
      hedgeTop: "#90b0ac",
      accent: "#d9c46a",
    },
    grid: [
      "###############",
      "#P..#D....#C.h#",
      "###.###.#.###.#",
      "#D#..H..#..S..#",
      "#.###########.#",
      "#.........#...#",
      "#.#######.#.###",
      "#...#E.G..#.#.#",
      "#.#.#######.#.#",
      "#.#...#....S#.#",
      "#.###.#.#####.#",
      "#..D#....S....#",
      "###############",
    ],
  },
];

/* ------------------------------------------------------------- grid plan */

export type Wall = { minX: number; maxX: number; minZ: number; maxZ: number };
export type Pt = [number, number];
export type Cell = { row: number; col: number; x: number; z: number };

export type MazePlan = {
  rows: number;
  cols: number;
  start: Pt;
  stars: Pt[];
  chest: Pt | null;
  exit: Pt | null;
  gate: Pt | null;
  gateWall: Wall | null;
  statues: Pt[];
  sign: Pt | null;
  hidden: Cell[];
  hedgeCells: Cell[];
  openCells: Cell[];
  walls: Wall[];
  /** Character at each cell, for the fog-of-war map. */
  cells: string[];
};

export const cellCenter = (row: number, col: number, rows: number, cols: number): Pt => [
  (col - (cols - 1) / 2) * CELL,
  (row - (rows - 1) / 2) * CELL,
];

export const worldToCell = (x: number, z: number, rows: number, cols: number): [number, number] => [
  Math.round(z / CELL + (rows - 1) / 2),
  Math.round(x / CELL + (cols - 1) / 2),
];

const wallAt = (x: number, z: number): Wall => ({
  minX: x - CELL / 2,
  maxX: x + CELL / 2,
  minZ: z - CELL / 2,
  maxZ: z + CELL / 2,
});

/**
 * Pure parse — no React, no three.js. Kept separate so the grid can be checked
 * by a plain node script (length, connectivity, reachability of every item).
 */
export function parseGrid(level: LevelDef): MazePlan {
  const rows = level.grid.length;
  const cols = Math.max(...level.grid.map((r) => r.length));
  const at = (r: number, c: number) => level.grid[r]![c] ?? "#";

  const walls: Wall[] = [];
  const hedgeCells: Cell[] = [];
  const openCells: Cell[] = [];
  const hidden: Cell[] = [];
  const stars: Pt[] = [];
  const statues: Pt[] = [];
  const cells: string[] = [];
  let start: Pt = [0, 0];
  let chest: Pt | null = null;
  let exit: Pt | null = null;
  let gate: Pt | null = null;
  let sign: Pt | null = null;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = at(r, c);
      const [x, z] = cellCenter(r, c, rows, cols);
      const cell: Cell = { row: r, col: c, x, z };
      cells.push(ch);

      if (ch === "#") {
        // Plain hedge: it blocks movement and is drawn as a green hedge.
        walls.push(wallAt(x, z));
        hedgeCells.push(cell);
        continue;
      }
      if (ch === "D") {
        // A statue fills this cell. It still blocks movement like a hedge, but
        // it must NOT be drawn as a hedge — otherwise the green block buries it
        // and the player can never see or recognise what the statue is.
        walls.push(wallAt(x, z));
        statues.push([x, z]);
        continue;
      }
      if (ch === "G") {
        gate = [x, z];
        openCells.push(cell);
        continue;
      }
      if (ch === "h") {
        // A secret gap in the hedge: rendered, but not collidable.
        hedgeCells.push(cell);
        hidden.push(cell);
        openCells.push(cell);
        continue;
      }
      openCells.push(cell);
      if (ch === "P") start = [x, z];
      else if (ch === "S") stars.push([x, z]);
      else if (ch === "C") chest = [x, z];
      else if (ch === "E") exit = [x, z];
      else if (ch === "H") sign = [x, z];
    }
  }

  return {
    rows,
    cols,
    start,
    stars,
    chest,
    exit,
    gate,
    gateWall: gate ? wallAt(gate[0], gate[1]) : null,
    statues,
    sign,
    hidden,
    hedgeCells,
    openCells,
    walls,
    cells,
  };
}

export const bi = (lang: Lang, b: Bi): string => (lang === "zh" ? b.zh : b.en);

/** Yaw that maps a +z pointer onto the direction 0=N / 1=E / 2=S / 3=W. */
export const yawForDir = (dir: number): number => [Math.PI, Math.PI / 2, 0, -Math.PI / 2][dir] ?? 0;
