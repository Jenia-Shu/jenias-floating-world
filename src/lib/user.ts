/**
 * A local, no-backend sign-in. There is no server to check credentials against,
 * so this is a doorman rather than real authentication: it keeps each visitor's
 * exploration track on their own name and stops someone reusing a name that is
 * already set up on this device.
 *
 * A visitor picks both a Chinese and an English name. The English one is the
 * storage key (lowercased); the Chinese one is only ever shown in the Chinese UI.
 */

export type Session = { zh: string; en: string };

export type StoredUser = Session & { hash: string; createdAt: number };

export type SignInResult =
  | { ok: true; user: Session }
  | { ok: false; code: "empty" | "answer" | "password" };

const USERS_KEY = "jenia:users:v1";
const SESSION_KEY = "jenia:session:v1";
const LEGACY_VISITED_KEY = "jenia:visited:v1";

/** Either of the host's names opens the door, case and padding ignored. */
const HOST_NAMES = ["舒予彤", "jenia"];

export function hashPassword(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

export function answerCorrect(raw: string): boolean {
  return HOST_NAMES.includes(raw.trim().toLowerCase());
}

function readUsers(): Record<string, StoredUser> {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, StoredUser>;
  } catch {
    return {};
  }
}

function writeUsers(users: Record<string, StoredUser>) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // storage full or blocked — the session still works, the password just won't stick
  }
}

/** Sessions written before the two-name change were plain strings. */
export function currentSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    if (raw.startsWith("{")) {
      const parsed = JSON.parse(raw) as Partial<Session>;
      if (typeof parsed.en === "string" && typeof parsed.zh === "string") return { en: parsed.en, zh: parsed.zh };
      return null;
    }
    return { en: raw, zh: raw };
  } catch {
    return null;
  }
}

export function signOut() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // nothing to do
  }
}

/** Progress is per English name, so two visitors can explore side by side. */
export function visitedKey(name: Session | string): string {
  const key = (typeof name === "string" ? name : name.en).trim().toLowerCase();
  return `jenia:visited:${key}:v1`;
}

export function signIn(rawEn: string, rawZh: string, password: string, answer: string): SignInResult {
  const en = rawEn.trim();
  const zh = rawZh.trim();
  if (!en || !zh || !password.trim()) return { ok: false, code: "empty" };
  if (!answerCorrect(answer)) return { ok: false, code: "answer" };

  const id = en.toLowerCase();
  const users = readUsers();
  const hash = hashPassword(password);
  const existing = users[id];

  if (existing && existing.hash !== hash) return { ok: false, code: "password" };

  if (!existing) {
    users[id] = { en, zh, hash, createdAt: Date.now() };
    writeUsers(users);
    // First sign-in on this device keeps whatever was explored before accounts existed.
    try {
      const legacy = localStorage.getItem(LEGACY_VISITED_KEY);
      const mine = visitedKey(en);
      if (legacy && !localStorage.getItem(mine)) localStorage.setItem(mine, legacy);
    } catch {
      // best effort
    }
  } else if (existing.zh !== zh) {
    // Renaming in Chinese is fine and cheap; the English name stays the storage key.
    existing.zh = zh;
    writeUsers(users);
  }

  const session: Session = { en, zh };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // session still held in memory by the caller
  }
  return { ok: true, user: session };
}
