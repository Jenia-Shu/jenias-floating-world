import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SignIn } from "@/components/SignIn";
import { Diag } from "@/components/Diag";
import { Welcome } from "@/components/Welcome";
import { WorldMap } from "@/components/WorldMap";
import { LastLightHome } from "@/components/LastLightHome";
import { currentSession, signOut, type Session } from "@/lib/user";
import { recordVisit } from "@/lib/achievements/store";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Jenia's World" },
      { name: "description", content: "Welcome to Jenia's World — a small floating archipelago to explore." },
      { property: "og:title", content: "Jenia's World" },
      { property: "og:description", content: "Welcome to Jenia's World — a small floating archipelago to explore." },
      { property: "og:type", content: "website" },
      { property: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  // ?diag=1 renders a bare WebGL self-check — the fastest way to find out why a
  // browser refuses to draw the islands.
  const diag = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("diag");
  const [user, setUser] = useState<Session | null>(() => {
    // ?world=1 is the debug entry: it also skips the gate so the map can be
    // opened from a headless browser without an existing session.
    const debug = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("world");
    return currentSession() ?? (debug ? { en: "Guest", zh: "访客" } : null);
  });
  const [stage, setStage] = useState<"welcome" | "leaving" | "world">(() =>
    // ?world=1 jumps straight to the map — handy for checking it without clicking through.
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("world")
      ? "world"
      : "welcome",
  );
  const [worldMounted, setWorldMounted] = useState(false);
  // Game 03's closing curtain. It belongs at the app root so it survives the
  // swap from the 3D world back to the Welcome cover.
  const [lastLight, setLastLight] = useState(false);
  const inWorld = stage === "world";

  useEffect(() => {
    if (!user) return;
    // One visit per page load, per visitor. A refresh counts; a re-render does not.
    recordVisit(user);
    // Warm the 3D chunk, then mount the map once and keep it mounted.
    // Tearing the Canvas down on every trip back Home leaks WebGL contexts,
    // and after a few round trips the browser refuses to create a new one —
    // which is what dumped visitors onto the fallback list.
    void import("@/components/world/WorldScene");
    const id = window.setTimeout(() => setWorldMounted(true), 400);
    return () => window.clearTimeout(id);
  }, [user]);

  if (diag) return <Diag />;

  if (!user) {
    return <SignIn onSignedIn={setUser} />;
  }

  const leave = () => {
    signOut();
    setUser(null);
    setStage("welcome");
    setWorldMounted(false);
  };

  return (
    <>
      {worldMounted && (
        <div
          className={inWorld ? "fixed inset-0" : "invisible pointer-events-none fixed inset-0"}
          aria-hidden={!inWorld}
        >
          <WorldMap
            onHome={() => setStage("welcome")}
            user={user}
            onSignOut={leave}
            onNicknameChange={setUser}
            active={inWorld}
            onFinishJourney={() => setLastLight(true)}
          />
        </div>
      )}
      {!inWorld && (
        <Welcome
          leaving={stage === "leaving"}
          onEnter={() => {
            setStage("leaving");
            window.setTimeout(() => setStage("world"), 650);
          }}
        />
      )}
      {lastLight && (
        <LastLightHome
          onReveal={() => {
            // Mount the real cover behind the curtain while it is still opaque.
            setStage("welcome");
            // The preview shortcut should not linger after the journey ends.
            if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("lastlight")) {
              const u = new URL(window.location.href);
              u.searchParams.delete("lastlight");
              window.history.replaceState(null, "", u.toString());
            }
          }}
          onDone={() => setLastLight(false)}
        />
      )}
    </>
  );
}
