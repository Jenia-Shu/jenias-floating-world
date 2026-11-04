import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Welcome } from "@/components/Welcome";
import { WorldMap } from "@/components/WorldMap";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Jenia's World" },
      { name: "description", content: "Welcome to Jenia's World — a small floating archipelago to explore." },
      { property: "og:title", content: "Jenia's World" },
      { property: "og:description", content: "Welcome to Jenia's World — a small floating archipelago to explore." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [stage, setStage] = useState<"welcome" | "leaving" | "world">("welcome");

  useEffect(() => {
    // warm up the 3D chunk while the visitor reads the welcome screen
    void import("@/components/world/WorldScene");
  }, []);

  if (stage === "world") return <WorldMap onHome={() => setStage("welcome")} />;
  return (
    <Welcome
      leaving={stage === "leaving"}
      onEnter={() => {
        setStage("leaving");
        setTimeout(() => setStage("world"), 650);
      }}
    />
  );
}
