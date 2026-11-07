# Jenia's World · 项目交接文档

> **这份文档给谁**：给下一个接手这个项目的 AI（或下一个会话的你自己）。
> **什么时候读**：开工前完整读一遍，尤其第 7 节（数据模型）和第 12 节（已知坑）。
> **配套文件**：`任务清单.md`（进度表）、`任务交接单.md`（任务 prompt）；`docs/工作记录.md`（做过的事）、`docs/想法记录.md`（用户想法）、`docs/同步与记录规范.md`（新规矩）、`docs/漂流瓶岛-需求原档.md` 与 `docs/FunZone-需求原档.md`（两份长需求原文）。
> **最后更新**：2026-11-07 13:41（北京时间）· 本次：Fun Zone 3D 改造方案与文案拍板、任务拆解；**未改业务代码**

> ⚠️ **13:41 状态更新（覆盖本文第 9 / 10 / 11 节里所有关于 Fun Zone 的旧表述）**
> 1. 用户 13:31 发来长需求，把 Fun Zone 从「1 个纯前端小游戏、放最后」改成**完整的 3D 浮空游乐园岛**：云雾散开 → 相机推进 → 三座 3D 设施（知识探索站 / 迷宫入口 / 故事剧场）+ 环境动态 + 阶段性解锁与开锁动画 + localStorage 持久化。逐字原文、7 条冲突结论、四项决策与中英文案定稿全在 `docs/FunZone-需求原档.md`。
> 2. 用户选「先收尾 C1 再开工」，并同意 Fun Zone 提前到 C1 之后；B1 / A4 顺延。第 11 节的旧顺序作废，以 `任务清单.md` 第五节为准。
> 3. 本次只做 3D 入口 + 选择岛 + 解锁框架，三个游戏本体玩法仍未定义；「完成前一款」只预留接口。第 9 节「Fun Zone 的内容 ⬜ 完全没做」仍属实，但范围已变。
> 4. 第 10 节决策表新增：「小游戏放最后」已被 13:31 的决定取代；文案定稿见原档第四节。
> 5. **磁盘真实状态**：C1a 漂流瓶岛改造（迁岛、改 `REGIONS` 顺序、岛名、信件定稿、新增 `MessageIslandPage`）**已在磁盘上做完但未验证未提交**（13 个 M + `src/components/message/`）；第 9 节说的「28 项未提交」是 13:00 的旧状态，已过时。

---

## 1. 一句话

「Jenia's World」是一个**个人作品站**：打开是一片手写体字标 "Jenia" 的欢迎页，点 Enter 进入真正的 3D（Three.js / R3F）浮岛群岛，一共五座岛，前一座看过才解锁下一座，每座岛是一个内容板块（关于我 / 作品集 / 收藏 / 留言位 / 乐园）。

作者：舒予彤（Jenia Shu），高二学生。这是她自己的作品与收藏，不是模板站。

**核心诉求（用户原话，2026-11-07）**：
> 先做功能方面的，把这整个东西做完整了，然后咱们再来扣细节。分列个大清单，分成很多很多个小任务，每个小任务作为一个会话，挨个解决。

---

## 2. 项目坐标

| 项 | 值 |
|---|---|
| 本地路径 | `D:\mlsstu\Desktop\SELF\jenias-floating-world` |
| 线上（Lovable） | https://jenias-floating-world.lovable.app |
| Git 远程 | https://github.com/Jenia-Shu/jenias-floating-world.git |
| 分支 | `main` |
| 最后提交 | `51ef55b Gallery wall: date + two-word tag under every frame, sorted by date`（2026-11-05） |
| 未提交改动 | 约 28 个文件（M/D/??），见第 9 节 |
| 静态产物 | `dist/client/`（已构建，2026-11-07 12:26） |

**注意还有另一个独立站点**：`D:\mlsstu\Desktop\SELF\作品集-2026\`
- 纯 HTML 离线作品集，标题「舒予彤 · Jenia Shu 2025–2026」，双击 `index.html` 就能看
- 25 张作品图 + `作品总表.md`（5,312 个文件 / 20.2 GB 的盘点） + PDF
- **和 Jenia's World 不是一个东西**，不要合并、不要在没问过的情况下动它

---

## 3. 用户最初的需求（来自项目 README，写作"原始契约"）

1. 欢迎页只放三样：Great Vibes 手写字标 "Jenia"、一句 "Welcome to Jenia's World."、一个 Enter 按钮
2. 点 Enter 之后是**真正的 3D 浮岛群岛**，不是图片拼接、不是假透视
3. 一开始只有 About Me 能点，其余岛锁住；每看过一个解锁下一个
4. 明确要求：**No sign-in, guestbook, database, analytics, weather, external social links**

> ⚠️ 第 4 条和现状有冲突：后来实际做了本地登录（`SignIn.tsx`）和成就系统。这是**已知的产品矛盾**，用户 2026-11-07 已同意"登录要重新考虑"，见第 10 节。

---

## 4. 用户后来提过的所有想法（按时间，尽量保留原意）

### 2026-11-07 第一次沟通
- **先做功能完整度，不精修细节**；扣细节留到最后
- 把整体拆成**很多很多小任务**，每个小任务**单独开一个会话**解决
- **不做留言功能**（"我不能加留言功能了"），以后再加
- 现在需要一个**静态网站**：不买域名、不买服务器，"点点点点点"就能上线
- 让我判断**登录功能到底有没有必要**，先做静态站
- 让我说明：改成静态站之后哪些功能要改，并给建议

### 2026-11-07 第二次沟通
- **每个任务都要有一份交接文本**，可以直接投给下一个会话
- 不做留言的话，**那个板块能做什么**？要很多建议让他选
- **把游乐园（小游戏）放到最后**做
- 那空出来的位置又要放什么新功能板块，**再给很多建议**

### 2026-11-07 第三次沟通（本文档的由来）
- 需要一份**完整总结**：做过什么、链接、细节、结构、开发环境、要求、所有想法
- 原因：**可能换环境**，要让另一个 AI 能靠这些资料接着干
- 要求"准确一点"，不要含糊

### 已确认的偏好（从执行过程中体现）
- 中文沟通，保留英文术语
- 不要"完成一半就停"，但要**一次只做一个任务**
- 不要顺手改设计、改文案；改完让他看
- 不确定的事要先问，不要自己拍板

---

## 5. 技术架构

| 层 | 选型 | 说明 |
|---|---|---|
| 框架 | TanStack Start 1.168.60 + TanStack Router 1.170.41 | 全站**只有一个路由 `/`** |
| UI | React 19.2 + Tailwind CSS 4 + shadcn/Radix | `src/components/ui/*` 是标准 shadcn 组件 |
| 3D | three 0.187 + @react-three/fiber 9 + drei 10 | 3D 场景全部懒加载 |
| 构建 | Vite 8.1.5 + `@lovable.dev/vite-tanstack-config` 2.26.5 | 已有 SPA 静态构建配置 |
| 后端 | **没有** | 全项目 `createServerFn` 用量 = 0；所有状态在 localStorage |
| 校验 | zod | 基本没用到 |
| 测试 | vitest 4 | 3 个测试文件，本机沙箱跑不起来（见第 12 节） |

**渲染策略**：
- `src/routes/index.tsx` 声明 `ssr: false`（WebGL 只能在浏览器）
- 静态构建走 **SPA 模式**：预渲染一个 shell 写到 `dist/client/index.html`，其余由客户端接管
- 不需要服务端，所以 `nitro: false`

**状态流向**（重要，改任何东西前先理解这条链）：
```
localStorage
  → src/lib/user.ts          （会话：谁在看）
  → visitedKey(user)          （这台设备上这个名字的存档前缀）
  → WorldMap.tsx              （读 visited 数组 → 算哪些岛解锁）
  → WorldScene.tsx            （isUnlocked 决定草色/锁）
  → 点岛 → WorldPage.tsx      （按 region.id 分派内容页）
  → 看完 → finishRegion()     （写 visited + 成就）
```

---

## 6. 目录结构（关键文件与职责）

```
jenias-floating-world/
├─ AGENTS.md                      # Lovable 规则：禁止改写已推送历史
├─ README.md                      # 原始需求
├─ CONTENT-FORM.md                # 给作者填的 About 内容清单（部分未填）
├─ vite.config.ts                 # SPA 静态构建 + nitro:false + three prebundle
├─ vercel.json                    # 旧的 Vercel 配置（已不用，待清理）
├─ package.json                   # npm scripts
├─ public/
│  ├─ fonts/                      # great-vibes-latin.woff2、nunito-latin.woff2（已自托管）
│  ├─ gallery/                    # 25 张作品图，共 6.66MB
│  ├─ favicon.ico                 # 20KB
│  └─ robots.txt
├─ dist/                          # 构建产物（client/ 是要部署的；server/ 忽略）
└─ src/
   ├─ routes/
   │  ├─ __root.tsx               # html 外壳、404、错误页
   │  └─ index.tsx                # 唯一路由：welcome|leaving|world 状态机 + 登录门
   ├─ router.tsx / start.ts / server.ts   # 路由实例、错误中间件、SSR 入口（静态站点不需要 server.ts）
   ├─ components/
   │  ├─ Welcome.tsx              # 欢迎页（字标 + Enter）
   │  ├─ SignIn.tsx               # 登录门：中英昵称 + 密码 + 验证问题
   │  ├─ WorldMap.tsx             # 地图外壳：WebGL 探测、FlatMap 降级、header、昵称面板、进度
   │  ├─ WorldPage.tsx            # 按 region.id 分派内容页
   │  ├─ Diag.tsx                 # /?diag=1 自检页
   │  ├─ LangSwitch.tsx           # 中英切换
   │  ├─ about/AboutPage.tsx      # 五章长页 + 进度条
   │  ├─ about/StoryWorld.tsx     # About 页里的 3D 场景
   │  ├─ gallery/GalleryPage.tsx  # 25 幅画框墙 + 详情
   │  ├─ collections/             # CollectionsPage / AlbumPages / CardView / CardEditor
   │  ├─ achievements/            # AchievementWall / Emblem / emblems.ts（22 个徽章图形）
   │  ├─ world/
   │  │  ├─ WorldScene.tsx        # 3D 总装：相机、雾、标签、岛屿、彩蛋
   │  │  ├─ MainIsland.tsx        # 主岛（About 入口 + 小屋门彩蛋）
   │  │  ├─ islands.tsx           # 四座卫星岛的建筑主题 + 彩蛋
   │  │  ├─ Island.tsx            # 岛屿外壳（草皮、悬浮、点击）
   │  │  ├─ terrain.ts（lib）     # 地形数学，纯函数、无 React/three 依赖
   │  │  ├─ collie.tsx            # 巡逻的边牧（点击给徽章）
   │  │  ├─ CollieDelivery.tsx    # 边牧把漂流瓶送进第三岛的池塘
   │  │  ├─ LetterModal.tsx       # 读瓶子里的信
   │  │  ├─ creatures.tsx / details.tsx / Grow.tsx   # 动物、云/石/树/花、生长动画
   │  └─ ui/                      # shadcn 组件（大部分没被用到）
   ├─ lib/
   │  ├─ user.ts                  # 会话、昵称、旧数据迁移、bottleKey
   │  ├─ i18n.ts                  # 中英字典 + 切换事件
   │  ├─ world/regions.ts         # 五个板块的元数据 + 解锁规则（★改内容先看这里）
   │  ├─ world/gallery.ts         # 25 条作品数据
   │  ├─ world/collections.ts     # 5 页收藏卡数据（26.7KB，最大）
   │  ├─ world/story.ts           # About 五章真实文本
   │  ├─ world/artworks.ts        # Gallery 岛上的公有领域名画
   │  ├─ world/bottle.ts          # 池塘几何 + 瓶子三阶段（pending/floating/read）
   │  ├─ world/letter.ts          # 信的内容（中英双版）
   │  ├─ world/about.ts           # ★死代码，无引用
   │  ├─ collections/store.ts     # 收藏卡本地覆盖/新增/删除
   │  ├─ achievements/            # badges（22 个）、store、life、stats、types
   │  └─ error-capture.ts / error-page.ts / lovable-error-reporting.ts
   └─ styles.css                  # 24.7KB，含 @font-face、主题变量、动画
```

---

## 7. 数据模型（★最容易搞错的地方）

**没有后端。所有持久化都是 localStorage，key 全靠名字拼。**

| key | 内容 | 谁写 |
|---|---|---|
| `jenia:session:v1` | `{en, zh}` 或旧版纯字符串 | `user.ts` |
| `jenia:users:v1` | 昵称 → `{en, zh, hash, createdAt}` | `signIn()`（旧登录） |
| `jenia:visited:v1` | 旧版共享探索数组（历史遗留） | 只在迁移时读 |
| `jenia:legacy-migrated:v1` | 迁移标记，"1" | `migrateLegacyVisited()` |
| `jenia:visited:<en小写>:v1` | `string[]` 已看过的 region id | `WorldMap` |
| `jenia:bottle:<en小写>:v1` | `"floating"` / `"read"` | `WorldMap`（漂流瓶） |
| `<visitedKey>:album:v1` | 收藏卡状态 `{v,discovered,badges,overrides,removed,custom}` | `collections/store.ts` |
| `<visitedKey>:ach:v1` | 成就状态 `{v,visits,eggs,animals,surprises,explored,sections,birthday,journal,confirmations,sound,unlocked}` | `achievements/store.ts` |
| `jenia:lang` | `"en"` / `"zh"` | `i18n.ts` |

**铁律**：
1. `visitedKey()` 的格式**不能改**（`jenia:visited:<名字>:v1`）——一改所有人的存档全丢。
2. `REGIONS` 数组里 region 的 **`id` 不能改**——`visited` 数组存的是 id，改了老访客进度错位。
3. `REGIONS` 的**顺序**不能随便调——解锁规则是"前一个看过才开下一个"。
4. 成就的 badge id 也不能改（`unlocked` 里存着）。

---

## 8. 开发环境

| 项 | 值 |
|---|---|
| 系统 | Windows |
| 工作区 | `D:\mlsstu\Desktop\SELF`（DSH 沙箱为 workspace-write） |
| Node | **v24.17.0** |
| npm | **11.13.0** |
| 包管理器 | npm（仓库里同时有 `bun.lock` 和 `package-lock.json`，用 npm 即可） |
| 是否已装依赖 | 是，`node_modules/` 存在 |

**命令**：
```bash
cd D:\mlsstu\Desktop\SELF\jenias-floating-world
npm run dev        # 开发服务器，看终端输出的端口
npm run build      # 产出 dist/client（要部署的就是它）
npm run preview    # 预览构建产物
npm run lint       # eslint
npm test           # vitest run ⚠️ 本机沙箱下会假失败，见第 12 节
```

**调试入口**：
- `/?diag=1` — WebGL 自检页，白屏时第一个该看的地方
- `/?world=1` — 跳过登录直接进地图（无 session 时的调试后门）
- `/?gallery=1` / `/?badges=1` — 直接打开画廊 / 徽章墙

---

## 9. 当前进度（2026-11-07 13:00 复核磁盘状态）

> 说明：以下按**磁盘上的真实代码**判断，不以"以前说过"为准。`dist/client/` 是今天 12:26 构建的，说明静态构建已经跑通。
> **12:51 复核补记**：A1（静态构建）、A3（字体自托管）、B2（昵称与迁移）确认完成；`任务清单.md` 与 `任务交接单.md` 的编号、状态已与本文同步，三份文档在 `docs/` 有相同副本。
> **13:00 复核补记**：用户认可「边牧送信小动画」，但指出**放错岛**——池塘 `POND`、`CollieDelivery`、边牧送信、`letter.ts` 的信、`WorldMap.tsx` 的 `bottleDue` 目前全挂在 **`collections` 收藏岛**（REGIONS 第 3 项），必须整体迁到 `community`（原留言岛）；收藏岛保持纯收藏。**第 4 岛方案已拍板 = 漂流瓶岛**（见第 10/11 节），Now 此刻 / Contact / 互动创造型等候选全部作废，长需求原文在 `docs/漂流瓶岛-需求原档.md`。新规矩：每完成一件事同步 GitHub + 记录到 `docs/`（第 15 节）。本轮**未改业务代码**。
> **仍未变的阻塞**：`src/routes/index.tsx:59-61` 仍是 `if (!user) return <SignIn />`，正常访客被登录表拦住，`?world=1` 是绕过它的调试后门 → 技术上的下一步仍是 B1。

### ✅ 已经做完

| 模块 | 证据 |
|---|---|
| 3D 浮岛群岛 | `WorldScene.tsx`（36.8KB）+ `MainIsland.tsx` + `islands.tsx` + `Island.tsx` + `terrain.ts` |
| 欢迎页 | `Welcome.tsx`：字标 + 一句话 + Enter，淡出转场 |
| About 长页 | `AboutPage.tsx` + `story.ts`（五章真实双语）+ `StoryWorld.tsx`（3D）+ 章节进度条 |
| Gallery | `gallery.ts` 25 条真实条目 + `public/gallery/` 25 张图 + `GalleryPage.tsx` 画框墙 |
| Gallery 岛上的名画 | `artworks.ts`（公有领域画作，一幅对应一个 moment） |
| Collections | 5 页卡 + 翻卡 + 发现 + 编辑/新增/删除/恢复，全部本地存档 |
| 成就系统 | `badges.ts` 22 个徽章、`AchievementWall.tsx`（28.9KB）、日志、生日、声音开关 |
| 彩蛋 | 5 个可点物件：gallery-plinth / listening-booth / ferris-wheel / mailbox / cottage-door |
| 巡逻边牧 | `collie.tsx`，点它给徽章 |
| **漂流瓶 + 信** | `bottle.ts` + `letter.ts` + `CollieDelivery.tsx` + `LetterModal.tsx`：看完前两岛后，第三岛长出池塘，边牧叼来瓶子，点开是一封信 |
| 中英切换 | `i18n.ts` + `LangSwitch.tsx`，全局事件同步 |
| 昵称系统（改名） | `user.ts` 的 `setNickname()` + `WorldMap` 的 `NicknamePanel`（改名 = 换档，旧档保留） |
| 旧数据迁移 | `migrateLegacyVisited()` 把 `jenia:visited:v1` 一次性并到 Guest |
| 无 WebGL 降级 | `WorldMap` 的 `FlatMap` 列表兜底 + `SceneStuck` |
| **字体自托管** | `public/fonts/*.woff2` + `styles.css` 的 `@font-face`，已不依赖 Google Fonts |
| **SPA 静态构建** | `vite.config.ts` 已配 `spa.enabled + prerender.outputPath:"/index.html" + nitro:false`；`dist/client/index.html` 已生成 |
| 基础 meta | 已有 title / description / og:title / og:description / og:type / twitter:card |

### 🟡 做了一半 / 需要收尾

| 项 | 现状 |
|---|---|
| 静态构建清理 | `dist/server/` 仍在生成（静态部署不需要）；`src/server.ts`、`vercel.json`、`start.ts` 的 csrf 中间件还没清 |
| 登录入口 | `signIn()` 和 `setNickname()` **并存**；`index.tsx` 仍然 `if (!user) return <SignIn>`，也就是**门还拦着** |
| 首屏体积 | `WorldScene` 已是懒加载 + 400ms 预热，但首屏到底有没有拉 three，**没有实测记录** |
| 分享卡片 | 有 og 文字，**没有 og:image** |
| 站点基础件 | `favicon.ico`（20KB，疑似默认图）、`robots.txt` 已存在，未核对内容 |

### ⬜ 完全没做

| 项 | 说明 |
|---|---|
| **第 4 岛的内容** | `regions.ts` 里 `community` 的 sections 仍是 `[Placeholder]`（Guestbook / Contact） |
| **Fun Zone 的内容** | `regions.ts` 里 `fun` 的 sections 仍是 `[Placeholder]`；页面只有一个徽章墙按钮 |
| 首次进站引导 | 没有 |
| 图片优化 | 25 张 jpg 6.66MB，未转 webp、未懒加载 |
| 移动端系统验证 | 没有记录 |
| 无障碍底线 | 没有系统做过 |
| 静态托管部署 | **没有拿到 pages.dev 之类的真实 URL**，现在只有 Lovable 的地址 |
| 维护文档 | 没有 |
| 留言 | 用户明确：本轮不做 |

### 未提交的改动（重要）

`git status`：28 项。修改了 WorldMap / WorldPage / CollectionsPage / GalleryPage / MainIsland / WorldScene / creatures / islands / user / collections / __root / index / styles.css / vite.config；删了 `src/lib/world/cards.ts`；新增了 achievements 全套、collections 三个组件、collie、CollieDelivery、LetterModal、bottle.ts、letter.ts、user.test.ts、`public/fonts/`。

**这些都还没提交。换环境前要么提交，要么把整个文件夹带走。**

---

## 10. 已定的决策（含理由，别推翻）

| 决策 | 理由 |
|---|---|
| **要静态站，不要 SSR/服务器** | 用户明确：不买域名、不买服务器、点点点上线。技术上可行：零 serverFn、只有一个路由 |
| **托管选 Cloudflare Pages Direct Upload** | 免费 `xxx.pages.dev`、拖 zip 即可、国内可达性最好。Vercel 国内基本不可用，已弃 |
| **登录要降级，不再拦路** | 它是纯 localStorage 的"假门"（密码 FNV-1a 哈希、验证问题问作者名字），没有真实保护，只增加摩擦；且原始需求本就写着 "No sign-in" |
| **保留"可选昵称"** | 进度/成就/收藏需要按人存档，昵称是存档的钥匙，不是门 |
| **留言本轮不做** | 静态站没有存储，需要第三方或后端；用户说"以后再加" |
| **小游戏（Fun Zone）放最后** | 用户明确要求 |
| **第 4 岛（原 Community 位）= 漂流瓶岛** | **2026-11-07 13:00 用户拍板**。不是留言板、不是 Contact、不是 Now 此刻、不是互动创造型板块，而是一段有情节的叙事章节：边牧送信 → 读信 → 收好 → 边牧带路去 Fun Zone。原文 `docs/漂流瓶岛-需求原档.md` |
| **漂流瓶剧情从 `collections` 迁到 `community`** | 用户原话：「这个狗呢，它并不会在收藏的这个岛上面放下漂流瓶，而是在原来的留言的这个岛上面」；收藏岛保持纯收藏 |
| **边牧送信动画保留** | 用户：「OK 我觉得这个小动画做的不错」 |
| **岛名 = `A Little Message` / `一封信的岛`** | 13:1x 用户从 10 个候选里选 2 号；其余作废，完整清单存 `docs/想法记录.md` |
| **信件文案 = 长文初稿定稿** | 13:1x 用户贴出定稿，逐字存 `docs/漂流瓶岛-需求原档.md` 末尾。⚠️ 定稿没有 P.S.、没有英文正文，别擅自补 |
| **把 `community` 挪到 `fun` 前面** | 13:1x 用户选「调顺序」而非「剧情跳转」；改 `REGIONS`，实现时要验证已解锁状态 |
| **每完成一件事同步 GitHub + 记录 docs** | 用户 13:00 明确要求，覆盖旧的「不主动 git commit」；见第 15 节 |
| **region id 保持 `community`** | 改 id 会让老访客进度错位；只改标题和内容 |
| **删死代码 `src/lib/world/about.ts`** | 无任何引用 |

---

## 11. 下一步（顺序）

完整拆解见 `任务交接单.md`（**编号权威**）和 `任务清单.md`（**状态权威**）。按 2026-11-07 13:00 的磁盘状态：

```
① B1 拆登录门 —— 技术上的下一步，改动最小，B2 已铺好路
② A4 首次部署（Cloudflare Pages）—— 拿到 xxx.pages.dev
③ C1 把漂流瓶剧情迁到 community 岛 + 改造成漂流瓶岛 —— 方案/岛名/信件/顺序已定，等岛上 sections 内容
④ A2 清 SSR 残留（纯清理，不阻塞）→ B3 首次引导 → B4 过渡复核
⑤ C2 About → C3 Gallery → C4 Collections → C5 删死代码
⑥ D1–D5 体验 → E1–E4 发布质量
⑦ F1 Fun Zone 小游戏（用户要求放最后）
```

**为什么 B1 排在 A4 前面**：现在正常访客被 `SignIn` 拦着，`?world=1` 只是绕过它的调试后门；先部署等于把一张登录表发给别人。
**已完成**：A1、A3、B2。三份文档编号与状态 12:51 统一，13:00 同步了新决策与新规矩。

### C1 子项：3 项已拍板（13:1x），4 项仍待定

| # | 事项 | 结论 |
|---|---|---|
| 1 | **岛名（中英）** | ✅ `A Little Message` / `一封信的岛`（10 个候选里选 2 号；其余作废，清单存 `docs/想法记录.md`） |
| 2 | **信件文案** | ✅ 用长文初稿；用户贴出定稿，逐字存 `docs/漂流瓶岛-需求原档.md` 末尾。⚠️ 定稿**没有 P.S.**、没有英文正文，别擅自补；现在 `letter.ts` 仍是《A letter from the water》 |
| 3 | **与 Fun Zone 的顺序** | ✅ 把 `community` 挪到 `fun` 前面（改 `REGIONS` 顺序）。`visited` 存 id 不丢进度，但已解锁状态会变，实现时一并验证 |
| 4 | 岛上内容页 `sections` | ⬜ 用户：「留言的这个岛我会重新给它弄一些东西」——等他给内容，别替他写 |
| 5 | `kicker` 副标题 | ⬜ 原 "Say hello / 打个招呼" 已不适用 |
| 6 | 交互范围 | ⬜ 「小型可自由走动的海岛」vs 俯视浮岛地图；长文自己又强调「小而精致」 |
| 7 | 五个小场景优先级 | ⬜ 哪些算主线、哪些算「可选小细节」 |

### 需求与代码的其它落差（13:00 核对，详见 `docs/工作记录.md`）

| 长需求 | 代码现状 |
|---|---|
| 五个小场景（漂流瓶海滩 / 海边小邮局 / 云海灯塔 / 海风秋千 / 远方木桥） | `Community()` 目前是信箱 / 小屋主题，无这些 3D 物件 |
| 信件可再次打开、沙滩随机短句、隐藏明信片入收藏 | `jenia:bottle:*` 只存 `pending / floating / read` 三阶段 |
| 电影式镜头沿木桥转场进入 Fun Zone | 现状是状态切换，没有相机跟随转场 |
| 边牧可点击、无按钮标记、首次点击给徽章 | **一致**：`collie.tsx` 可点击给「小狗追踪员」，无 UI 标记 |

**契约提醒**：region `id`、`visitedKey()`、badge id 不能改；改 `REGIONS` 顺序会改变解锁链（第 7 节）。

---

## 12. 已知坑（吃过亏的，别再吃）

1. **Lovable 历史规则**（`AGENTS.md`）：项目连着 Lovable，**绝不** force push / rebase / amend / squash 已推送的提交；推到连接分支会同步回 Lovable，必须保持可工作状态。
2. **本机 `npm test` 会假失败**：栈里出现 `optimizeSafeRealPathSync` → `child_process.exec` → `spawn` EPERM。原因是 DSH 沙箱禁止管道子进程，**不是代码问题**。要验证就 `npm run dev` 手动看，或如实说"未验证"。
3. **控制台读中文会乱码**：PowerShell 的 `Get-Content` 按 GBK 解码 UTF-8，中文显示成 `ä¸–ç•Œ`。**文件本身没问题**，别以为源码坏了。要读文件用 `read` 工具，不要用 shell。
4. **Lovable 配置包的行为**（已读源码确认）：只有 `LOVABLE_SANDBOX=1` 或 `SANDBOX_ENV_VAR` 存在时，它才强制 `cloudflare-module` 并锁死 prerender 选项；本地普通构建会把 `tanstackStart` 选项原样透传，`nitro: false` 时完全不加载 nitro。所以本地能出纯静态。
5. **`dist/server/` 仍然会生成**：SPA 模式下插件也会产出 server bundle。静态部署**只用 `dist/client/`**，server 可以忽略。
6. **只有一个路由**：刷新任意子路径靠 catch-all 重写（`/* /index.html 200`）。目前没有真实子路由，所以问题不大，但 `?gallery=1` 这类参数要保留。
7. **绝对路径资源**：`/fonts/`、`/gallery/`、`/favicon.ico` 都是根路径。**必须部署在域名根**，放到子目录会全挂。
8. **WebGL context 不能反复创建**：`WorldMap` 一旦挂载就保持挂载（回 Home 只是隐藏）。别为了"省内存"改成卸载重建，会泄漏。
9. **drei 的 `<Html>` 在 React 19 下不可靠**：场景标签是 DOM + `LabelProjector` 手动投影，别换回去。
10. **`regions.ts` 的 sections 大部分是占位**，但 `about`/`gallery`/`collections` 走的是专属组件，占位**不显示**；只有 `fun` 和 `community` 走通用渲染，所以只有那两处会看到 `[Placeholder]`。
11. **`visitedKey()` 与 region id 是契约**：见第 7 节铁律。
12. **图片 6.66MB**：首屏慢的主因之一，D2 处理。
13. **中文文案要双语**：`pick(lang, en, zh)`，任何新文案都要两版，别只写英文。

---

## 13. 给接手的 AI 的工作要求

1. **先说结论，再说依据**。中文，保留英文术语。
2. **一次只做一个任务**。做完停下让用户看，不要连着改五个文件。
3. **先读再改**。改 `regions.ts` / `user.ts` / `store.ts` 之前，先读第 7 节的契约。
4. **每完成一件事就同步 GitHub + 记录 docs**（13:00 用户定，覆盖旧的「不主动 git commit」）：见第 15 节。
5. **不顺手改设计、文案、字号、留白**。这些等"扣细节"阶段。
6. **不虚构**：没验证的就说没验证，没跑的测试就说没跑。
7. **改完给三句话**：改了什么 / 怎么验证的 / 哪里没覆盖。
8. **用户是作者本人**，不是工程师。解释要具体，不要甩术语。
9. **遇到"要不要改某个产品决策"**（比如第 4 岛做什么、登录留不留），**给选项让他选**，不要自己拍板。

---

## 14. 换环境清单（如果换机器 / 换 AI）

### 未提交改动 / 历史状态（13:00 起已按新规矩提交）

`git log -1` 曾长期停在 `51ef55b`（11-05），成就系统、收藏卡组件、漂流瓶+信、字体文件、昵称迁移测试等**一度只在磁盘上**。13:00 用户定下「每完成一件事同步 GitHub」后，这批改动已正常 commit + push（见 `docs/工作记录.md` 与仓库内 `docs/`）。
若之后仍遇到未提交改动：

1. **最稳**：整个文件夹拷走（含未提交改动；`node_modules/` 可以不拷）。
2. **不要只带 `.patch` / `git diff`**：`public/fonts/*.woff2` 等 untracked 二进制文件不在 diff 里，只带补丁会丢字体。
3. 提交用正常 `git add -A && git commit -m "..." && git push origin main`；绝不 force push / rebase / amend / squash 已推送历史（`AGENTS.md`）。注意提交会同步回 Lovable，要保持可工作状态。

### 步骤

1. 拷贝 / clone `D:\mlsstu\Desktop\SELF\jenias-floating-world`
2. 新机器装 Node 20+（当前用 24.17.0），`npm install`
3. 带上资料：三份交接文档 + `docs/` 全部（`工作记录.md`、`想法记录.md`、`同步与记录规范.md`、`漂流瓶岛-需求原档.md`、`想法与要求.docx`）。根目录 `docs/` 是主档，仓库内 `docs/` 是进 GitHub 的镜像，两边内容一致；若不一致以根目录为准
4. 让新 AI 先读本文第 7 节（数据契约）和第 12 节（已知坑），再读 `AGENTS.md` 与 `docs/同步与记录规范.md`
5. 第一件事验证环境：`npm run dev` 能起、`/?world=1` 能进地图、`npm run build` 能出 `dist/client/`
6. 验证通过后，**从 B1 继续**：复制 `任务交接单.md` 的【通用前提】+【任务 B1｜登录改访客直入】。**不要按旧文档从 A2 开始**
7. 编号以 `任务交接单.md` 为准；状态与实际顺序以 `任务清单.md` 第四、五节为准

---

## 15. 同步与记录规范（2026-11-07 13:00 用户定）

用户原话：「你做的每一个东西都要同步到 GitHub 上面去」「你做的一些东西，你要把它记录下来，还有我的想法把它记录下来，记录到 docs 那个文件夹里面」。

1. **每完成一件事 = 一次 commit + push**：`git add -A` → `git commit -m "<一句话>"` → `git push origin main`（远程 `https://github.com/Jenia-Shu/jenias-floating-world.git`，分支 `main`）。不要攒着。
2. **仍然禁止** force push / rebase / amend / squash 已推送历史；推之前确认代码可工作（构建或 dev 验证），跑不了就如实写「未验证」；推送失败如实说明，不假装已同步。
3. **每完成一件事 = 一条记录**：`docs/工作记录.md` 记「改了什么 / 怎么验证 / 哪里没覆盖」；`docs/想法记录.md` 记用户想法与原话；长需求逐字存档（如 `docs/漂流瓶岛-需求原档.md`）。
4. **docs 双份**：主档 `d:\mlsstu\Desktop\SELF\docs\` 在 git 仓库外，必须镜像到 `jenias-floating-world\docs\` 才能进 GitHub；写完主档立刻同步，提交前 `cmp` 抽查。
5. 三份交接文档根目录 / `docs/` / 仓库 `docs/` 三处都要同步。
6. 规范全文见 `docs/同步与记录规范.md`。
