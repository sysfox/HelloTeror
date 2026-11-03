# VOID PROTOCOL — 全站 UI 重构总纲

> 本文件是所有并行 Agent 的唯一设计事实来源。冲突时以本文件为准。

## 1. 概念

彻底抛弃现有的「Apple 式极简 + 极光光球」设计。新站点是 **VOID PROTOCOL / 深渊协议**：
一台环绕死星运行的机器智能的操控界面。内容不再是"卡片铺在白底上"，而是悬浮在
有纵深的体积黑暗中的仪表层；背后持续运行 3D 机械结构（线框巨构、轨道环、数据晶格），
随页面与指针变化。页面切换是**镜头运动**，不是淡入淡出。

关键词：深空黑、磷光青、等离子洋红、信号琥珀、HUD 工业排版、非对称构图、
体积光、扫描线、色差、景深、机械呼吸感。

## 2. 技术栈（已安装，不要新增依赖）

- `three@0.187` + `@react-three/fiber@9` + `@react-three/drei@10` — 交互式 3D 场景
- `@designcodeio/threeui@1.2` — 现成 shader 组件（`@designcodeio/threeui/components/<Name>`）
- `vgpu@0.6` + `@vgpu/wgsl` — WebGPU 计算/全屏 shader（用 `prepareShader` + 内联 WGSL 字符串，
  不要 `import x from "./x.wgsl"`，本项目未接 WGSL loader）
- `animejs@4` 通过 `@/lib/anime` 使用（不要直接 import `animejs`）

已验证：vgpu + threeui 在本项目 Next 16 / Turbopack 下可编译、可 build。

## 3. 颜色 token（暗色 "VOID"）

| token | 值 | 用途 |
|---|---|---|
| `--background` | `#03040a` | 页面底色 |
| `--foreground` | `#e6f7ff` | 主文字 |
| `--text-primary` | `#e6f7ff` | 标题/正文 |
| `--text-secondary` | `#8fa6b8` | 描述 |
| `--text-tertiary` | `#5b7085` | HUD/弱化 |
| `--card` | `#070b16` | 卡片底 |
| `--surface` | `rgba(120,200,255,0.035)` | 玻璃面板 |
| `--surface-hover` | `rgba(120,200,255,0.07)` | 悬浮 |
| `--surface-strong` | `rgba(120,200,255,0.11)` | 强调面板 |
| `--border-subtle` | `rgba(120,220,255,0.12)` | 细边框 |
| `--border-strong` | `rgba(120,220,255,0.28)` | 强调边框 |
| `--accent` | `#5af2ff` | 磷光青（主） |
| `--accent-2` | `#ff3ec9` | 等离子洋红 |
| `--accent-3` | `#ffc46b` | 信号琥珀 |
| `--accent-4` | `#7c5cff` | 紫 |
| `--accent-soft` | `rgba(90,242,255,0.10)` | 色块 |
| `--accent-border` | `rgba(90,242,255,0.42)` | 发光边框 |
| `--accent-glow` | `rgba(90,242,255,0.35)` | 外发光 |
| `--grid-line` | `rgba(90,242,255,0.14)` | 网格/标尺 |
| `--terminal-bg` | `#050810` | 终端 |
| `--header-bg` | `rgba(3,4,10,0.62)` | 导航 |
| `--selection-bg` | `rgba(90,242,255,0.30)` | 选区 |
| `--shadow-card` | `0 24px 80px rgba(0,0,0,0.6)` | 深阴影 |
| `--transition-curtain-bg` | 深空渐变 | 转场覆盖 |

亮色主题 "DAYLIGHT PROTOCOL"：`--background:#e9eef6`，`--foreground:#050a14`，
`--accent:#007e99`，`--accent-2:#c2008f`，`--accent-3:#a86200`，`--accent-4:#4b32c3`，
表面/边框改为冷蓝墨水的低透明度。**两套 token 都必须可读、对比度足够。**

shadcn 兼容 token（`--card/--popover/--primary/--border/--ring/...`）必须同步改写，
`@theme inline` 映射保留。旧的 `--aurora-*` 可以删除。

字体保持系统栈（避免构建期联网），但排版规则改为 HUD：
- display：`-apple-system, "SF Pro Display", "Helvetica Neue", Arial`，字重 600–800，
  大标题 `letter-spacing: -0.03em`，可局部用极宽字距的 mono 小标签
- mono：`ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace`
- 元数据一律 mono、大写、`letter-spacing: 0.18em`、11–12px

## 4. 运动语言

1. **纵深**：所有内容存在于 Z 轴。卡片随指针做 perspective 倾斜；背景 3D 层与内容层
   以不同速率视差；入场从 `translateZ(-120px)` + blur + clip-path 展开。
2. **材质化入场**：不用简单 fade-up。用 clip-path 揭幕、色差分离（青/洋红错位）、
   扫描线扫过、边框能量点亮。
3. **持续呼吸**：HUD 刻度、扫描线、场景几何始终有低速运动；静止画面视为 bug。
4. **能量响应**：hover = 边框发光 + 扫描带掠过 + 轻微 Z 位移；点击 = 短促的
   scale/glitch 反馈。
5. **降级**：`prefers-reduced-motion: reduce` 时全部退化为静态高对比布局；
   任何新增的 init-hidden 类必须加入 `globals.css` 底部的 reduced-motion 解除块
   （转场覆盖层除外，沿用旧规则）。

## 5. 新的页面转场（`PageContext` 的 `TransitionType`）

彻底替换旧的 `curtain | zoom-blur | type-wipe | slats`，改为：

| type | 形态 | overlay DOM | 时长 |
|---|---|---|---|
| `depth-dive` | 旧页向镜头外冲出（scale↑ blur↑），新页从深空 Z=-2000 拉回；同心环隧道 overlay | `.dive-tunnel` > `.dive-ring` × 6 | 900 |
| `fracture` | 屏幕按多边形碎片裂开飞出/飞入，stagger | `.fracture-layer` > `.fracture-shard` × 12 | 980 |
| `warp-tunnel` | 径向速度线 + 色差 + 白闪，旧页被吸入中心，新页从中心炸开 | `.warp-layer` > `.warp-streak` × 24 | 860 |
| `lattice-wipe` | 3D 线框网格平面横扫，旧页被"切片"带走 | `.lattice-wipe` > `.lattice-line` × 14 | 950 |

必须保留的既有不变量（详见 CLAUDE.md 与现有 PageShell / pageTransitions）：
- enter 层 `key = enter-${page}-${locale}`，语言切换也要重播入场
- exit 层 `.transition-exit-snapshot` 强制可见，且不碰 `transform`
- `TRANSITION_DURATIONS` 用 `Record<TransitionType, number>` 保证完备
- `setTimeout(finish, ...)` 安全网
- `useFullPageScroll` 的 cooldown 从 `MAX_TRANSITION_MS` 派生
- reduced-motion 直接 finish；overlay 的初始隐藏样式要保证单帧不可见

## 6. 文件所有权（并行期间严禁越界）

| Agent | 独占文件 |
|---|---|
| A 场景核心 | `src/components/scene/**`（`contracts.ts` 已存在，可读可扩展但保留现有导出） |
| B 设计系统 | `src/app/globals.css`、`src/components/SiteNav.tsx`、`src/components/SiteFooter.tsx`、`src/contexts/ThemeContext.tsx`、`src/components/void/**`、`src/components/ui/**` |
| C 转场 | `src/contexts/PageContext.tsx`、`src/lib/pageTransitions.ts`、`src/components/PageShell.tsx`、`src/hooks/useFullPageScroll.ts` |
| D Hero/About | `src/components/HeroSection.tsx`、`src/components/AboutSection.tsx`、`src/components/sections/hero/**`、`src/components/sections/about/**` |
| E Tech/Stats | `src/components/TechStackSection.tsx`、`src/components/StatsSection.tsx`、`src/components/animations/ContributionGraph.tsx`、`src/components/sections/tech/**`、`src/components/sections/stats/**`、`src/hooks/useCountUp.ts` |
| F Projects/Blog | `src/components/ProjectsSection.tsx`、`src/components/BlogSection.tsx`、`src/components/sections/projects/**`、`src/components/sections/blog/**` |
| G 动画原语 | `src/components/animations/**`，但 **排除** `ContributionGraph.tsx`（E）与 `AuroraBackground.tsx`（集成时删除） |

谁都不要改：`src/app/page.tsx`、`src/app/layout.tsx`、`src/i18n/**`、`src/lib/github.ts`、
`src/lib/mxspace.ts`、`src/lib/anime.ts`、`src/hooks/useApiData.ts`、`src/types/index.ts`、
`package.json`、`docs/REDESIGN.md`、`next.config.ts`、`tsconfig.json`。

## 7. 内容与逻辑必须保留

- 六个页面（home/about/tech/stats/projects/blog）与 `PAGE_ORDER` 不变
- `useT()` 字典键不变；不得新增/修改 `src/i18n/dictionaries.ts`
- 主题切换、语言切换、cookie/bootstrap、API 数据层、fallback 数据全部保留
- 上游数据（GitHub/MX-Space 文本）不翻译
- `SectionHeading` / `StaggerGroup` / `SectionGhostNumber` / `TiltCard` / `MagneticButton`
  等原语的**导出名与 props 保持向后兼容**（G 负责重做视觉，不改 API）
- 代码注释用中文，解释 why
- 不新增依赖、不提交 git

## 8. 自检

并行期间**不要**运行 `pnpm build` / `pnpm check`（其他人的半成品会导致假失败）。
只对自己拥有的文件做针对性检查：

```bash
pnpm exec tsc --noEmit 2>&1 | grep -F "你的文件路径"
```

最后集成由主 Agent 统一跑 `pnpm check`。
