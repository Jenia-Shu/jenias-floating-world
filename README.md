# Jenias Floating World

Build the first real, runnable version of a personal website named "Jenia's World". This is an ongoing project that will be refined in this same Lovable project. Follow the visual and technical constraints carefully.

CORE VISUAL DIRECTION
- The main map must be an actual interactive 3D WebGL scene built with Three.js (prefer React Three Fiber + drei if supported). This is a hard requirement. Do NOT fake 3D with CSS perspective, box shadows, gradients, tilted divs, SVG islands, canvas 2D, or a static illustration.
- Create actual 3D geometry/meshes for the floating islands and the scene objects. Islands need visibly thick rocky undersides and uneven, rounded terrain profiles, grass top surfaces, real perspective, soft contact shadows, and clear depth between foreground/background. The camera should let visitors see the island top AND its vertical sides.
- Make the visual style cozy, rounded, cute, clean, warm, healing, nature-exploration miniature diorama / clay-toy world. Not watercolor, ink wash, flat illustration, anime game login screen, sci-fi HUD, neon, or overloaded fantasy UI.
- Use restrained misty blue, glacier blue, soft green, warm cream, silver-gray, and small champagne-gold accents. Avoid excessive purple/pink and saturated neon.
- The result should feel like a handcrafted miniature world with a lot of small, thoughtful natural detail but a calm uncluttered composition.

VISITOR FLOW
1. First render a full-screen welcome page ONLY. Minimal composition: large flowing "Jenia" wordmark in Great Vibes (Google Font import acceptable), one small line exactly "Welcome to Jenia's World.", and one understated Enter button. Nothing else: no avatar, map preview, castle, menu bar, cards, star field, or long explanatory copy. Keep the backdrop simple and refined, slightly atmospheric but not overly dreamy.
2. Only after clicking Enter, reveal the 3D island map with a soft camera/scene entrance transition.
3. On the map, show one accessible active starter region titled "About Me"; show several separate nearby floating islands as locked regions, visibly locked and not clickable. Make the map feel like a connected archipelago, not a row/grid of buttons.
4. Clicking the active About Me region opens a small elegant content panel with placeholder copy only (do not invent personal biography). Add an easy way to close the panel and a simple back/home action to the welcome screen.
5. Make the region name readable in the scene or in a neat adjacent label; active/locked state must be obvious. Keep overlays sparse so the 3D world remains the focus.

3D SCENE DETAILS
- Use generated procedural Three.js geometry, not fetched stock images. Build 3-5 separate floating islands at different positions, scales, and heights with visible layered rock strata underneath. Use deformed sphere/parametric BufferGeometry or similar real meshes to form organic rounded landforms, with a grass top mesh and layered rock underside.
- The main island should have a meandering stone path, a small rounded cottage (real 3D walls, roof, door/windows), clusters of rounded trees (trunks + separate foliage meshes), a little pond (water mesh), a small bridge, flowers, mushrooms/rocks, and a tiny waterfall made from actual 3D geometry. Add a few gentle clouds in the distance if performance allows.
- Other islands should have a few charming silhouettes/details and small lock markers, but keep them visually secondary.
- Use real lighting, ambient occlusion/shadow approximations, soft ambient + key light, and material roughness. Use antialiasing and sensible performance defaults.
- Support orbit/drag rotation and wheel/pinch zoom with sensible limits; the user should be able to inspect the islands in 3D. Avoid disorienting controls; keep initial framing attractive. Add subtle idle floating/bobbing where it does not impair comfort.
- Handle window resizing, device pixel ratio cap, and mobile touch interaction. Offer graceful fallback/error text if WebGL is unavailable. Respect prefers-reduced-motion.

TECHNICAL QUALITY
- Use TypeScript React with clean component structure and reusable 3D scene components. Install/use the necessary Three.js / React Three Fiber dependencies. Do not substitute CSS-only styling.
- Make the page responsive on desktop and mobile, avoid overflow, show proper loading state while the 3D scene initializes.
- Keep the app fast: use shared geometries/materials or instancing for repeated details where practical; avoid huge particle counts.
- All buttons and click targets must work. No dead controls.
- Do not add sign-in, guestbook, database, analytics, weather, external social links, or private personal details yet. This first milestone is the opening screen + real 3D archipelago + About Me placeholder panel only.
- Use the exact name spelling "Jenia" and brand "Jenia's World" everywhere. The homepage typography must use Great Vibes.
- After implementing, run/build-check the app, fix TypeScript/runtime issues, and make sure the preview loads. Do not declare completion if the actual 3D canvas or core interactions are missing.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://jenias-floating-world.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/519cb444-11d7-42cf-a019-6de6399f7895).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
