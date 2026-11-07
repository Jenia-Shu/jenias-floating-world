import { beforeEach, describe, expect, it } from "vitest";
import { GUEST, currentSession, migrateLegacyVisited, setNickname, visitedKey } from "./user";

const LEGACY = "jenia:visited:v1";
const MARKER = "jenia:legacy-migrated:v1";
const SESSION = "jenia:session:v1";

beforeEach(() => localStorage.clear());

describe("session", () => {
  it("keeps an old visitor signed in through a plain-string session", () => {
    localStorage.setItem(SESSION, "Rainy");
    expect(currentSession()).toEqual({ en: "Rainy", zh: "Rainy" });
  });

  it("reads a two-name session", () => {
    localStorage.setItem(SESSION, JSON.stringify({ en: "Rainy", zh: "小雨" }));
    expect(currentSession()).toEqual({ en: "Rainy", zh: "小雨" });
  });

  it("ignores a broken session instead of throwing", () => {
    localStorage.setItem(SESSION, "{nope");
    expect(currentSession()).toBeNull();
  });

  it("keeps the storage key format existing saves were written with", () => {
    expect(visitedKey({ en: "Rainy", zh: "小雨" })).toBe("jenia:visited:rainy:v1");
    expect(visitedKey("Rainy")).toBe("jenia:visited:rainy:v1");
  });
});

describe("legacy progress migration", () => {
  const list = JSON.stringify(["about", "gallery"]);

  it("moves the shared list under Guest and keeps the old key", () => {
    localStorage.setItem(LEGACY, list);
    expect(migrateLegacyVisited()).toBe(true);
    expect(localStorage.getItem(visitedKey(GUEST))).toBe(list);
    expect(localStorage.getItem(LEGACY)).toBe(list);
    expect(localStorage.getItem(MARKER)).toBe("1");
    expect(migrateLegacyVisited()).toBe(false);
  });

  it("runs once per device, even if the old key changes later", () => {
    localStorage.setItem(LEGACY, JSON.stringify(["about"]));
    currentSession();
    localStorage.setItem(LEGACY, list);
    currentSession();
    expect(localStorage.getItem(visitedKey(GUEST))).toBe(JSON.stringify(["about"]));
  });

  it("never overwrites progress Guest already has", () => {
    localStorage.setItem(visitedKey(GUEST), JSON.stringify(["story"]));
    localStorage.setItem(LEGACY, list);
    migrateLegacyVisited();
    expect(localStorage.getItem(visitedKey(GUEST))).toBe(JSON.stringify(["story"]));
  });
});

describe("setNickname", () => {
  it("writes the session and trims the names", () => {
    expect(setNickname("  Rainy ", " 小雨 ")).toEqual({ en: "Rainy", zh: "小雨" });
    expect(currentSession()).toEqual({ en: "Rainy", zh: "小雨" });
  });

  it("refuses an empty name", () => {
    expect(setNickname("", "小雨")).toBeNull();
    expect(setNickname("Rainy", "  ")).toBeNull();
    expect(currentSession()).toBeNull();
  });

  it("leaves old progress under the old nickname and writes new progress to the new key", () => {
    const old = { en: "Rainy", zh: "小雨" };
    const fresh = { en: "Sunny", zh: "晴天" };
    localStorage.setItem(visitedKey(old), JSON.stringify(["about"]));

    setNickname(fresh.en, fresh.zh);

    expect(localStorage.getItem(visitedKey(old))).toBe(JSON.stringify(["about"]));
    expect(localStorage.getItem(visitedKey(fresh))).toBeNull();

    localStorage.setItem(visitedKey(fresh), JSON.stringify(["gallery"]));
    expect(localStorage.getItem(visitedKey(old))).toBe(JSON.stringify(["about"]));
  });
});
