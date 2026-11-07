// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Pure static build: the build prerenders one route-less shell and the client SPA
    // takes over from there.
    // Shell is written as index.html so a plain static server serves "/" without rewrites;
    // deep links get the catch-all rewrite in A4.
    spa: { enabled: true, prerender: { outputPath: "/index.html" } },
  },
  // Skip nitro entirely — the lovable wrapper only loads it when this isn't false.
  nitro: false,
  vite: {
    optimizeDeps: {
      // The 3D stack is a deep module tree. Pre-bundling it turns hundreds of
      // dev-server requests into one file, which is the difference between
      // "the islands appear" and "the islands never arrive" on a modest machine.
      include: ["three", "@react-three/fiber", "@react-three/drei"],
    },
  },
});
