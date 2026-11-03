"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
} from "react";
import { usePage, PAGE_ORDER, type PageId } from "@/contexts/PageContext";
import { useLocale, useT } from "@/contexts/LocaleContext";
import { useFullPageScroll } from "@/hooks/useFullPageScroll";
import {
  runTransition,
  clearTransitionStyles,
  TRANSITION_DURATIONS,
  MAX_TRANSITION_MS,
  DIVE_RING_COUNT,
  FRACTURE_SHARD_COUNT,
  FRACTURE_COLS,
  WARP_STREAK_COUNT,
  LATTICE_LINE_COUNT,
} from "@/lib/pageTransitions";
import { HeroSection } from "@/components/HeroSection";
import { AboutSection } from "@/components/AboutSection";
import { TechStackSection } from "@/components/TechStackSection";
import { StatsSection } from "@/components/StatsSection";
import { ProjectsSection } from "@/components/ProjectsSection";
import { BlogSection } from "@/components/BlogSection";

const PAGES: Record<PageId, ComponentType> = {
  home: HeroSection,
  about: AboutSection,
  tech: TechStackSection,
  stats: StatsSection,
  projects: ProjectsSection,
  blog: BlogSection,
};

/* ───────────────────────── overlay 静态几何 ───────────────────────── */

const FRACTURE_ROWS = FRACTURE_SHARD_COUNT / FRACTURE_COLS;

/**
 * 确定性哈希（不用 Math.random）。
 * 碎片顶点抖动 / 速度线长度必须在每次渲染间完全一致：overlay 会随每次切换重挂载，
 * 随机值会让同一块碎片在重渲染时改变形状，还会在 strict-mode 双挂载下闪动。
 */
function hash01(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * 生成 4×3 碎片的静态 clip-path。
 *
 * 每个 shard 是一个铺满全屏的 div，clip-path 裁出它的那一块：
 * 动画只作用在 transform/opacity 上，clip-path 保持静态
 *（动画 clip-path 的插值在浏览器间不可靠，旧方案因此放弃）。
 *
 * 顶点用共享的 (cols+1)×(rows+1) 网格 + 固定抖动，相邻碎片共用顶点，
 * 因此裂开前能无缝铺满整屏；边界顶点不抖动，保证四条外边缘贴合视口。
 */
function buildFractureClipPaths(): string[] {
  const jitterX = (c: number, r: number) =>
    c > 0 && c < FRACTURE_COLS ? (hash01(r * 17 + c * 5) - 0.5) * 5 : 0;
  const jitterY = (c: number, r: number) =>
    r > 0 && r < FRACTURE_ROWS ? (hash01(r * 31 + c * 11 + 7) - 0.5) * 6 : 0;

  const vx = (c: number, r: number) => (c / FRACTURE_COLS) * 100 + jitterX(c, r);
  const vy = (c: number, r: number) => (r / FRACTURE_ROWS) * 100 + jitterY(c, r);

  const paths: string[] = [];
  for (let i = 0; i < FRACTURE_SHARD_COUNT; i++) {
    const c = i % FRACTURE_COLS;
    const r = Math.floor(i / FRACTURE_COLS);
    const points = [
      [vx(c, r), vy(c, r)],
      [vx(c + 1, r), vy(c + 1, r)],
      [vx(c + 1, r + 1), vy(c + 1, r + 1)],
      [vx(c, r + 1), vy(c, r + 1)],
    ]
      .map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`)
      .join(", ");
    paths.push(`polygon(${points})`);
  }
  return paths;
}

const FRACTURE_CLIP_PATHS = buildFractureClipPaths();

/**
 * 径向速度线几何：角度均分 360°，长度做确定性抖动。
 * 每条线的旋转走 CSS 独立属性 `rotate`（而不是 transform 字符串），
 * 这样 runTransition 只动画 scaleY，不会把角度一起覆盖掉。
 */
const WARP_STREAKS = Array.from({ length: WARP_STREAK_COUNT }, (_, i) => ({
  angle: (360 / WARP_STREAK_COUNT) * i,
  len: 16 + hash01(i * 7.3 + 1.7) * 34,
  width: i % 5 === 0 ? 2 : 1,
}));

/* ───────────────────────── PageShell ───────────────────────── */

/**
 * SPA 页面容器（VOID PROTOCOL / 镜头式转场）：
 * - 永远只有一个 active page 居中渲染
 * - 切换时 enter 层（新页）与 exit 层（旧页快照）同时存在，runTransition 用 timeline 驱动
 * - 切换类型见 contexts/PageContext 的 TransitionType（depth-dive / fracture /
 *   warp-tunnel / lattice-wipe）；每种类型有各自的 overlay DOM
 * - exit 层用 .transition-exit-snapshot 强制子树可见，避免重挂载触发的 FOUC / 动画重播
 * - enter 层 key 带 page 与 locale，导航和语言切换都会重挂载并重播入场动画
 * - 滚轮 / 触摸 / 方向键切换（useFullPageScroll），transitioning 期间锁定
 *
 * overlay 基础样式全部内联（globals.css 由其他 agent 维护，不在这里加类）：
 * 每个子元素初始 opacity:0 / scaleY(0) / 屏外位移，
 * 因此 reduced-motion 下 runTransition 直接 finish、overlay 只存在一帧时也不可见。
 */
export function PageShell() {
  const {
    current,
    transition,
    direction,
    navigate,
    transitioning,
    setTransitioning,
  } = usePage();
  const { locale } = useLocale();
  const [displayed, setDisplayed] = useState<PageId>(current);
  const [pending, setPending] = useState<PageId | null>(null);

  const exitRef = useRef<HTMLDivElement>(null);
  const enterRef = useRef<HTMLDivElement>(null);
  const diveRef = useRef<HTMLDivElement>(null);
  const fractureRef = useRef<HTMLDivElement>(null);
  const warpRef = useRef<HTMLDivElement>(null);
  const latticeRef = useRef<HTMLDivElement>(null);

  // current 变化 → 锁定 + 记录 pending（让两层同时渲染）
  useEffect(() => {
    if (current === displayed) return;
    const next = current;
    queueMicrotask(() => {
      setTransitioning(true);
      window.setTimeout(() => setPending(next), 0);
    });
  }, [current, displayed, setTransitioning]);

  // pending 变化 → 运行切换动画；onComplete / 安全超时触发 finish 切换显示态
  useEffect(() => {
    if (pending === null || pending === displayed) return;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      // 清掉 enter 层残留的 transform/filter/opacity inline 样式，避免影响后续交互
      clearTransitionStyles(enterRef.current);
      setDisplayed(pending);
      setPending(null);
      setTransitioning(false);
    };

    const cleanup = runTransition(transition, direction === "forward", {
      exitEl: exitRef.current,
      enterEl: enterRef.current,
      diveTunnel: diveRef.current,
      fractureLayer: fractureRef.current,
      warpLayer: warpRef.current,
      latticeLayer: latticeRef.current,
      finish,
    });

    // 安全兜底：即使 timeline 异常未触发 onComplete，也能解锁（按本次切换类型的时长）
    const safety = window.setTimeout(
      finish,
      TRANSITION_DURATIONS[transition] + 400
    );

    return () => {
      window.clearTimeout(safety);
      cleanup?.();
    };
  }, [pending, displayed, transition, direction, setTransitioning]);

  const handleStep = useCallback(
    (dir: 1 | -1) => {
      if (transitioning) return;
      const fromIndex = PAGE_ORDER.indexOf(current);
      const toIndex = fromIndex + dir;
      if (toIndex < 0 || toIndex >= PAGE_ORDER.length) return;
      navigate(PAGE_ORDER[toIndex]);
    },
    [current, navigate, transitioning]
  );

  // 冷却按最长切换时长取，避免"改了某个切换时长忘了改 cooldown"的老问题
  useFullPageScroll({
    onStep: handleStep,
    isLocked: transitioning,
    cooldownMs: MAX_TRANSITION_MS + 60,
  });

  // 每种转场的 overlay 只在切换期间挂载；pending 归零即卸载
  const showDive = pending !== null && transition === "depth-dive";
  const showFracture = pending !== null && transition === "fracture";
  const showWarp = pending !== null && transition === "warp-tunnel";
  const showLattice = pending !== null && transition === "lattice-wipe";

  const ActivePage = PAGES[pending ?? displayed];
  const ExitingPage = pending !== null ? PAGES[displayed] : null;

  return (
    <div
      data-direction={direction}
      className="relative w-full h-full overflow-hidden"
    >
      {/* 退出层（旧页快照）：wrapper 由 runTransition 缩放/模糊/淡出；
          内部 .transition-exit-snapshot 强制子树可见 */}
      {ExitingPage && (
        <div
          key={`exit-${displayed}`}
          ref={exitRef}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ willChange: "transform, opacity, filter" }}
          aria-hidden
        >
          <div className="transition-exit-snapshot absolute inset-0 flex items-center justify-center">
            <ExitingPage />
          </div>
        </div>
      )}

      {/* 进入层 / 当前页：pending 时初始 opacity 0 防 FOUC，runTransition 拉入；
          key=新页保证重挂载触发各 section 入场动画。
          key 里带 locale：切换语言时同样重挂载，让新文案带着入场动画出现，
          而不是原地替换字符串。 */}
      <div
        key={`enter-${pending ?? displayed}-${locale}`}
        ref={enterRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{
          opacity: pending !== null ? 0 : 1,
          willChange: pending !== null ? "transform, opacity, filter" : "auto",
        }}
      >
        <ActivePage />
      </div>

      {/* depth-dive：同心环隧道。环从中心向外扩张并推向镜头，
          容器自带 perspective 只作用于 overlay 子元素，不影响 section 内的 fixed 定位。 */}
      {showDive && (
        <div
          ref={diveRef}
          className="dive-tunnel"
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "hidden",
            zIndex: 70,
            // 容器整体也初始隐藏：个别 overlay 自带背景（见 globals.css 的
            // .warp-layer 径向辉光），reduced-motion 下单帧挂载也不能闪出来
            opacity: 0,
            perspective: "800px",
          }}
        >
          {Array.from({ length: DIVE_RING_COUNT }).map((_, i) => (
            <span
              key={i}
              data-dive-ring
              className="dive-ring"
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: "60vmax",
                height: "60vmax",
                marginLeft: "-30vmax",
                marginTop: "-30vmax",
                borderRadius: "50%",
                border: "1px solid var(--accent-border, rgba(90,242,255,0.42))",
                boxShadow:
                  "inset 0 0 60px var(--accent-soft, rgba(90,242,255,0.10)), 0 0 24px rgba(90,242,255,0.10)",
                opacity: 0,
                // 归零 globals.css 里的 translate(-50%,-50%)：
                // anime 只会解析/重写 inline transform，类里的居中位移会在
                // 第一帧被覆盖，导致环突然跳位。改用 margin 居中，与 transform 解耦。
                transform: "none",
                willChange: "transform, opacity",
              }}
            />
          ))}
        </div>
      )}

      {/* fracture：12 片多边形碎片。每片是铺满全屏 + 静态 clip-path 的 div，
          由 runTransition 做位移/旋转/缩放（见 buildFractureClipPaths 的 why）。 */}
      {showFracture && (
        <div
          ref={fractureRef}
          className="fracture-layer"
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "hidden",
            zIndex: 70,
            opacity: 0,
          }}
        >
          {FRACTURE_CLIP_PATHS.map((clipPath, i) => (
            <div
              key={i}
              data-fracture-shard
              className="fracture-shard"
              style={{
                position: "absolute",
                inset: 0,
                clipPath,
                backgroundImage:
                  "linear-gradient(120deg, color-mix(in srgb, var(--accent) 30%, transparent) 0%, color-mix(in srgb, var(--accent-2) 16%, transparent) 24%, var(--card, #070b16) 58%, var(--background, #03040a) 100%)",
                opacity: 0,
                transformOrigin: "50% 50%",
                willChange: "transform, opacity",
              }}
            />
          ))}
        </div>
      )}

      {/* warp-tunnel：24 条径向速度线 + 中点爆闪。
          --angle / --len 是几何自定义属性；rotate 走独立 CSS 属性，
          与 runTransition 动画的 scaleY（transform）互不覆盖。 */}
      {showWarp && (
        <div
          ref={warpRef}
          className="warp-layer"
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "hidden",
            zIndex: 70,
            // 见 globals.css：warp-layer 自带径向辉光，容器必须跟着转场淡入淡出
            opacity: 0,
          }}
        >
          {WARP_STREAKS.map((streak, i) => (
            <span
              key={i}
              data-warp-streak
              className="warp-streak"
              style={
                {
                  "--angle": `${streak.angle}deg`,
                  "--len": `${streak.len}vmax`,
                  position: "absolute",
                  left: `calc(50% - ${streak.width / 2}px)`,
                  // 元素底边落在屏幕中心，transform-origin 也在底边，
                  // 旋转后射线就从正中向外发散
                  top: "calc(50% - var(--len))",
                  width: streak.width,
                  height: "var(--len)",
                  transformOrigin: "50% 100%",
                  transform: "scaleY(0)",
                  rotate: "var(--angle)",
                  backgroundImage:
                    "linear-gradient(to top, transparent 0%, color-mix(in srgb, var(--accent) 75%, transparent) 100%)",
                  opacity: 0,
                  willChange: "transform, opacity",
                } as CSSProperties
              }
            />
          ))}
          <span
            data-warp-flash
            className="warp-flash"
            aria-hidden
            style={{
              position: "absolute",
              inset: "-20%",
              pointerEvents: "none",
              backgroundImage:
                "radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--foreground) 85%, transparent) 0%, color-mix(in srgb, var(--accent) 35%, transparent) 38%, transparent 70%)",
              opacity: 0,
              transform: "scale(0.55)",
              willChange: "transform, opacity",
            }}
          />
        </div>
      )}

      {/* lattice-wipe：14 条水平线 + 一条扫光带。
          forward 时线从左向右生长、扫光带自上而下；backward 全部反向。 */}
      {showLattice && (
        <div
          ref={latticeRef}
          className="lattice-wipe"
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "hidden",
            zIndex: 70,
            opacity: 0,
          }}
        >
          {Array.from({ length: LATTICE_LINE_COUNT }).map((_, i) => (
            <span
              key={i}
              data-lattice-line
              className="lattice-line"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: `${(i / (LATTICE_LINE_COUNT - 1)) * 100}%`,
                height: 1,
                transform: "scaleX(0)",
                transformOrigin:
                  direction === "forward" ? "0% 50%" : "100% 50%",
                backgroundImage:
                  "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--accent) 45%, transparent) 22%, color-mix(in srgb, var(--accent) 90%, transparent) 50%, color-mix(in srgb, var(--accent) 45%, transparent) 78%, transparent 100%)",
                opacity: 0,
                willChange: "transform, opacity",
              }}
            />
          ))}
          <span
            data-lattice-sweep
            className="lattice-sweep"
            aria-hidden
            style={{
              position: "absolute",
              left: "-10%",
              right: "-10%",
              top: 0,
              height: "28%",
              backgroundImage:
                "linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--accent) 8%, transparent) 55%, color-mix(in srgb, var(--accent) 28%, transparent) 92%, color-mix(in srgb, var(--foreground) 50%, transparent) 100%)",
              opacity: 0,
              // 初始就把光带放在即将进入的方向之外，防单帧闪烁
              transform:
                direction === "forward"
                  ? "translateY(-120%)"
                  : "translateY(120%)",
              willChange: "transform, opacity",
            }}
          />
        </div>
      )}

      <ScrollHint visible={!transitioning && current === "home"} />
    </div>
  );
}

/**
 * Home 页底部的"向下滚动"提示：呼吸式 chevron，提示用户可以滚轮切换。
 * 仅在首页且未在动画中显示。
 */
function ScrollHint({ visible }: { visible: boolean }) {
  const t = useT();
  if (!visible) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-[var(--text-tertiary)]"
      style={{
        opacity: 0.7,
        animation: "fade-up-soft 1s 1.5s cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      <span className="text-[10px] font-mono uppercase tracking-[0.3em]">
        {t.common.scroll}
      </span>
      <svg
        width="14"
        height="22"
        viewBox="0 0 14 22"
        fill="none"
        className="breathe-glow"
      >
        <path
          d="M7 1V20M7 20L1 14M7 20L13 14"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
