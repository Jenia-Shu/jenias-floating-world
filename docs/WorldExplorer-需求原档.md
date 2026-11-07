> 存档时间：2026-11-07 13:44（北京时间），用户随本条消息发来。
> 来源：用户消息中的 long-text 全文。**以下正文逐字保留，未改写、未删减。**
> 同批用户原话（关于三个游戏与交付方式）见 `想法记录.md`。

---

# JENIA'S WORLD — FUN ZONE
# GAME 01: WORLD EXPLORER
# COMPLETE GAME DESIGN & DEVELOPMENT SPECIFICATION

请基于现有的 Jenia's World 网站和 Fun Zone 3D 游乐园继续开发第一个小游戏 World Explorer。

这是一个完整的游戏开发任务，不只是制作视觉概念图或静态页面。

必须同时实现：
- 真实的3D场景
- 可操作的游戏流程
- 三个章节和随机题库
- 答题反馈
- 边牧角色公主
- 地图探索和奖励
- 无限次重新挑战
- 本地进度保存
- 与 Fun Zone 游乐园的解锁系统联动

不要擅自改变已经确认的游戏规则。

---

# PART 01 — GAME IDENTITY

## 1. Game Name

WORLD EXPLORER

Subtitle:

Every little detail tells a story.

中文主题：

世界探索 · 一场关于 Jenia's World 的小小探险。

## 2. Core Story

访客来到一座森林探险营地。

公主发现了一张残缺的探险地图。地图上记录着关于 Jenia's World 的许多故事、收藏和秘密，但其中有些区域尚未被发现。

访客需要和公主一起完成三个章节的探索任务，通过观察、记忆和推理回答问题。

每一次正确回答都会让地图上的一个区域逐渐显现。

完成三个章节后，地图恢复完整，中央宝箱开启，访客获得自己的探索纪念奖励。

这不是普通考试，而是一场轻松、有趣、具有收藏感的探索旅程。

---

# PART 02 — MAIN ART DIRECTION

## 1. Overall Style

Create a premium, cozy, stylized 3D forest exploration campsite.

Visual keywords:
- Cozy
- Natural
- Curious
- Adventure
- Warm
- Elegant
- Rounded
- Immersive
- Miniature 3D diorama

The scene must feel like a small living world.

Do not use a flat illustration as a substitute for the actual 3D environment.

Do not create a generic quiz interface with a decorative background.

## 2. Color Palette

Primary:
- Sky blue
- Cream white
- Natural forest green
- Light warm wood
- Subtle champagne gold

Use soft natural lighting and realistic material depth.

Avoid:
- Neon colors
- Excessive purple or pink
- Excessively dark fantasy aesthetics
- Harsh high-saturation blue
- Cold corporate UI
- Flat geometric low-poly graphics
- Overly complicated game HUDs

## 3. Materials

Use:
- Smooth natural wood with subtle grain.
- Rounded stones.
- Clear flowing water.
- Detailed trees, grass, flowers, and bushes.
- Soft fabric for tents.
- Subtle glass effects for floating quest cards.
- Small metallic champagne-gold details.

The overall result should be polished, soft, dimensional, and visually coherent with Jenia's World.

---

# PART 03 — 3D EXPLORER CAMPSITE

Create a compact but richly detailed 3D campsite.

Use a three-quarter isometric camera angle.

The campsite contains five main areas.

## 1. Explorer Cabin

A small rounded wooden cabin.

Details:
- World Explorer wooden sign.
- Small windows.
- Warm interior light.
- A backpack near the entrance.
- Compass decorations.
- A small lantern.
- A wooden path leading into the campsite.

## 2. Central Map Table

This is the most important object in the scene.

Create a large wooden exploration table with:
- One continuous miniature 3D adventure map.
- A compass.
- Small map markers.
- A few stars.
- A treasure chest that becomes active after all chapters are completed.

The map table must remain visually prominent.

## 3. Rest Area

Include:
- A small explorer tent.
- Wooden bench.
- Picnic basket.
- Lantern.
- Small plants and flowers.

These are environmental details, not interactive game objectives.

## 4. Forest Stream

Include:
- A small flowing stream.
- A tiny waterfall.
- Rounded river stones.
- A small wooden bridge.
- Grass and flowers near the water.

Use subtle continuous water animation.

## 5. Princess's Area

Provide a small natural resting area for Princess near the map table.

She may sit, walk around, observe the visitor, or move between nearby campsite positions.

Do not make her too large.

---

# PART 04 — THE BORDER COLLIE CHARACTER: 公主

## 1. Character Identity

The character's name is:

公主

All player-facing character dialogue and first-person introductions must use this identity.

When speaking about herself, she says:

“我是公主。”

Never make her introduce herself as “我是边牧”.

Do not replace her name with generic labels such as “the dog” in player-facing dialogue.

The developer may identify the model internally as a black-and-white Border Collie for accurate asset generation.

## 2. Appearance

Princess is a recognizable black-and-white Border Collie.

Appearance:
- Black ears.
- Black upper head.
- White muzzle.
- White chest.
- White legs.
- Fluffy but clean stylized fur.
- Expressive eyes.
- Natural ears and tail.
- Small, cute, recognizable silhouette.

Optional accessory:
- A small sky-blue explorer backpack.
- A tiny compass accessory.

Do not overload the character with clothing or accessories.

## 3. Animations

Required animations:

| Trigger | Animation |
|---|---|
| Entering game | Princess runs into the campsite |
| Idle | Breathing, blinking, tail movement |
| Showing a question | Looks toward the floating card |
| Correct answer | Wags tail and makes a small happy jump |
| Incorrect answer | Tilts head and blinks |
| Hint | Points toward the relevant clue |
| Chapter completed | Runs toward the corresponding map region |
| Full completion | Celebrates beside the treasure chest |

The dog must look like a living 3D character rather than a static decoration.

Use natural transitions and avoid excessive repetitive animation.

## 4. Character Dialogue

Possible opening dialogue:

“你好呀！我是公主！”

“我发现了一张残缺的地图，你愿意和我一起找回它吗？”

Possible incorrect-answer reaction:

“嗯？我们再想想吧！”

Possible correct-answer reaction:

“答对啦！我们又发现了一颗星星！”

Possible chapter-completion dialogue:

“这一片地图终于亮起来啦！”

Keep dialogue short, warm, natural, and consistent with Princess's personality.

---

# PART 05 — COMPLETE GAME FLOW

The game must follow this sequence.

## Stage 1 — Enter the Explorer Campsite

When the visitor clicks the World Explorer facility in the 3D amusement park:

1. Smoothly zoom toward the explorer campsite.
2. Reveal the full 3D campsite.
3. Show the cabin, map table, stream, tent, and Princess.
4. Princess runs into the scene.
5. Show the game title and subtitle.
6. Present a Start Exploring interaction.

Do not immediately display a flat quiz interface.

## Stage 2 — Story Introduction

Princess discovers the incomplete map.

Display a short introduction explaining that the visitor will help her recover the map.

Show:
- The incomplete map.
- Three chapter markers.
- A brief explanation of the rules.
- Start Exploring button.

## Stage 3 — Three Fixed Chapters

The chapter order must always be:

1. Chapter 01 — Who Is Jenia?
2. Chapter 02 — The Collection Room
3. Chapter 03 — Explore the World

Each chapter contains three randomly selected questions.

Total questions per round: 9.

## Stage 4 — Question Interaction

When a chapter begins:

1. Camera moves closer to the map table.
2. Princess looks toward the map.
3. A floating quest card rises above the map.
4. Question and answer options appear.
5. Visitor selects an answer.
6. Show immediate feedback.
7. Correct answer triggers a map discovery effect.
8. Move to the next question.

## Stage 5 — Chapter Completion

After three questions:
- Reveal the corresponding map region.
- Animate stars traveling toward the map.
- Princess runs toward the newly discovered region.
- Show a brief chapter completion animation.
- Continue to the next chapter.

## Stage 6 — Full Map Restoration

After all three chapters:
- All nine questions are complete.
- The three map regions illuminate.
- The complete map becomes visible.
- The treasure chest opens.
- Princess celebrates beside it.
- Display the visitor's result and rewards.

## Stage 7 — Final Result

Display:
- Current round score.
- Historical best score.
- Total challenge count.
- Achievement grade.
- Rewards earned.
- Complete adventure map.
- Replay button.
- Return to Fun Zone button.

The visitor can replay the game infinitely.

---

# PART 06 — QUESTION BANK

Use a configurable question-bank architecture.

Initial question bank: 8 questions per chapter, 24 questions total.

Each round randomly selects 3 questions from each chapter.

Requirements:
- Chapter order remains fixed.
- Questions inside each chapter must not repeat within one round.
- Randomly select a balanced mix of easy, medium, and slightly challenging questions.
- Avoid repeating exactly the same combination as the previous round whenever possible.
- Question content must be configurable independently from the UI.
- Support normal multiple-choice questions, image recognition questions, and clue-based reasoning questions.
- Use the actual confirmed content of Jenia's World.
- Do not invent personal facts or experiences.

## Chapter 01 — Who Is Jenia?

Question topics:

1. Jenia's favorite color: blue.
2. Homepage quote: “我爱我生命里的大雪，然后是永驻的春天。”
3. Jenia's interests: music, exploration, helping others, and discovering new things.
4. Jenia's view of success: success is defined by oneself.
5. Jenia's view of personal growth: growth is not about becoming a standard answer, but finding one's own answer.
6. Areas of interest: psychology and philosophy.
7. Personal keywords: independence, curiosity, reflection, and exploration.
8. English exploration keyword: Keep discovering.

## Chapter 02 — The Collection Room

Question topics:

1. Piano piece often listened to during middle-school lunch: Summer by Joe Hisaishi.
2. Current WeChat ringtone: 希望有羽毛和翅膀.
3. Book exploring the boundary between reality and cognition: 天才在左疯子在右.
4. Book with a distinctive examination setting and worldbuilding: 全球高考.
5. Movie about dreams and reality: Inception.
6. Movie about space exploration: Interstellar.
7. Cities in the personal collection: Chengdu, Dali, Lijiang, Xi'an, and Bengbu.
8. Drink preference: no extra sugar and no ice.

## Chapter 03 — Explore the World

Question topics:

1. Clicking the Border Collie moving between the five islands unlocks 小狗追踪员.
2. The special object on the message-bottle island: a message bottle containing a letter.
3. Character leading visitors to Fun Zone: Princess.
4. Number of Fun Zone game areas: three.
5. First game: World Explorer.
6. Second game: Tiny Maze.
7. Third game: The Choice Adventure.
8. Difference between Gallery and Collections: Gallery displays works; Collections displays personally collected favorites.

Before publishing, validate all questions against the latest public website content.

Do not use outdated content if the website has changed.

---

# PART 07 — ANSWER MECHANICS

## 1. Answer Options

Use four answer options whenever appropriate.

Each option must:
- Be readable.
- Have a sufficiently large click area.
- Have a clear selected state.
- Have a subtle hover state on desktop.
- Have a clear touch state on mobile.

## 2. Correct Answer

When the visitor answers correctly:
- Highlight the correct option.
- Play a soft positive sound.
- Princess wags her tail.
- A star appears.
- The star travels toward the corresponding map area.
- The map area lights up.

## 3. Incorrect Answer

When the visitor answers incorrectly:
- Highlight the incorrect option gently.
- Show a warm hint or explanation.
- Princess tilts her head.
- Allow the visitor to select again.
- Do not immediately end the question.
- Do not punish the visitor.

Record the first submitted answer separately from subsequent retries.

Score each question based on whether the first submitted answer was correct.

## 4. Hint System

Each chapter provides one additional hint opportunity.

A hint should:
- Narrow down the possible answer.
- Provide a useful clue.
- Never directly reveal the correct answer.
- Be optional.

Record hint usage locally.

---

# PART 08 — SCORING AND ACHIEVEMENT GRADES

There are nine questions per round.

Record first-attempt correct answers.

Grades:

| First-attempt correct answers | Grade | Reward |
|---|---|---|
| 0–5 | Brave Explorer | Basic explorer ticket |
| 6–7 | Careful Observer | Ticket + explorer star |
| 8 | Excellent Explorer | Ticket + special star |
| 9 | Perfect Explorer | Ticket + limited collectible card |

Completing all nine questions counts as completing the round.

The visitor may replay to improve their score.

The first successful completion unlocks Tiny Maze permanently, regardless of the score grade.

A low score must not prevent the visitor from progressing through the Fun Zone.

The first-time completion badge is awarded only once.

The Perfect Explorer limited collectible card is awarded only once, the first time a visitor achieves 9/9.

---

# PART 09 — INFINITE REPLAY SYSTEM

The visitor can replay World Explorer without a limit.

Each replay:
- Randomly selects three questions from each chapter.
- Maintains the same three-chapter order.
- Avoids duplicate questions within the same round.
- Tries to avoid repeating the previous round's exact combination.
- Resets the current round's answer state.
- Preserves historical best score.
- Preserves total challenge count.
- Preserves all previously earned rewards.

Additional features:
- Track consecutive perfect rounds.
- Trigger a special Princess celebration after multiple consecutive 9/9 rounds.
- Do not issue duplicate limited rewards.
- Do not duplicate achievement records.

---

# PART 10 — REWARD DESIGN

Use one consistent collectible visual language.

## 1. Explorer Ticket

A dimensional ticket with:
- World Explorer title.
- Completion date.
- Score grade.
- Small map illustration.
- Subtle champagne-gold trim.

## 2. Explorer Star

A small dimensional collectible star.

## 3. Perfect Explorer Card

A limited collectible card awarded on the first 9/9 score.

## 4. 世界初探者 Badge

A unique badge awarded upon first successful completion.

Use rounded edges, soft material depth, clear typography, and tasteful lighting.

Rewards should feel like souvenirs from the Jenia's World universe.

Do not create duplicate first-time rewards on replays.

---

# PART 11 — MAP AND VISUAL FEEDBACK

Use one continuous 3D map.

Do not create nine separate puzzle pieces.

Progression:

Initial:
- Three regions are dimmed or partially hidden.

After a correct answer:
- A glowing star travels toward the relevant map region.
- The map gradually gains illuminated details.

After each chapter:
- The corresponding region becomes fully visible.

After all three chapters:
- The complete map lights up.
- A treasure chest appears or opens at the center.
- Princess celebrates.

The map should be the visual representation of the visitor's progress.

---

# PART 12 — SOUND AND ANIMATION

Use moderate animation intensity.

Environmental animations:
- Flowing stream.
- Small waterfall.
- Gently moving leaves.
- Slight grass movement.
- Subtle lantern flicker.

Game animations:
- Floating quest cards.
- Smooth camera transitions.
- Selected-answer feedback.
- Star collection.
- Map illumination.
- Treasure chest opening.

Character animations:
- Blinking.
- Breathing.
- Tail movement.
- Walking.
- Running.
- Sitting.
- Head tilting.
- Celebrating.

Sound:
- Soft stream ambience.
- Gentle birdsong.
- Quiet interaction sound.
- Positive correct-answer sound.
- Soft incorrect-answer sound.
- Short completion celebration.

Provide a sound toggle.

Do not autoplay loud audio.

Respect reduced-motion settings.

---

# PART 13 — LOCAL DATA AND PERSISTENCE

This is a static website.

Use the existing local persistence architecture, preferably localStorage.

No backend database is required.

Store:
- Current round state.
- Current chapter.
- Current question index.
- First-attempt correctness for each question.
- Hint usage.
- Historical best score.
- Total challenge count.
- First completion status.
- Reward claims.
- Achievement unlock status.
- Consecutive perfect-round count.
- Game unlock status.

Separate progress by visitor nickname using the existing website's local identity mechanism.

Use versioned data structures so future updates do not break saved progress.

Important:
- Data is stored only in the current browser/device.
- Do not claim that progress synchronizes across devices.
- Do not implement a cloud leaderboard.
- Do not require user accounts or a backend server.

The first completion unlock must be permanent on that device and must not be reversed by a later low score.

---

# PART 14 — FUN ZONE INTEGRATION

World Explorer is Game 01 in the three-game Fun Zone progression.

Game sequence:

1. World Explorer
2. Tiny Maze
3. The Choice Adventure

Unlock rules:

- Initially, World Explorer is available.
- Tiny Maze is locked.
- The Choice Adventure is locked.
- Completing World Explorer unlocks Tiny Maze.
- Completing Tiny Maze unlocks The Choice Adventure.
- Completing The Choice Adventure completes the entire Fun Zone game sequence.

Locked facilities remain visible.

When clicked, a locked facility should show a short, friendly explanation of what must be completed first.

Unlock animation:
1. Lock gently shakes.
2. Lock opens.
3. Lock disappears.
4. Facility lights turn on.
5. A soft glow spreads around the facility.

Do not redesign the entire Fun Zone navigation system.

---

# PART 15 — FINAL UI AND RESPONSIVENESS

Desktop:
- Main 3D scene occupies most of the screen.
- Floating quest card is near the central map.
- Answer options are large and readable.
- Supporting UI stays minimal.

Mobile:
- Adjust camera framing.
- Keep the question card readable.
- Use large touch targets.
- Avoid overlapping controls.
- Preserve the visual identity of the 3D campsite.

Use smooth transitions between:
- Fun Zone amusement park.
- Explorer campsite overview.
- Map table close-up.
- Chapter completion.
- Final reward view.

The visitor must always be able to understand where they are and what to do next.

---

# PART 16 — PERFORMANCE AND IMPLEMENTATION QUALITY

This game must run smoothly in a browser.

Requirements:
- Use real 3D assets and models wherever practical.
- Do not replace the 3D environment with a static background image.
- Optimize geometry, materials, textures, and animation count.
- Load nonessential environmental details progressively.
- Avoid unnecessary continuous rendering when the scene is idle.
- Use efficient camera and animation management.
- Ensure all controls work with mouse, keyboard, and touch.
- Provide graceful fallbacks if a 3D asset fails to load.
- Preserve existing website sections and unrelated game logic.
- Do not overwrite other completed features.

Before considering the game complete, test:
1. Entering the game from Fun Zone.
2. Princess's opening animation and dialogue.
3. All three chapters.
4. Random question selection.
5. No duplicate questions within a round.
6. Correct and incorrect answer feedback.
7. Hint usage.
8. Map progression.
9. Final treasure chest and rewards.
10. Infinite replay.
11. Historical best score.
12. Local persistence after refresh.
13. Tiny Maze unlocking.
14. Mobile layout.
15. Reduced-motion and sound settings.

The final result should feel like a polished, living miniature forest exploration world.

The visitor should feel that they are exploring Jenia's World together with Princess, not simply completing a quiz.

Preserve all previously approved game rules and the existing Fun Zone architecture.
