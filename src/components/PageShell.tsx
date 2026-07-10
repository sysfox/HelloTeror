"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { usePage, PAGE_ORDER, type PageId } from "@/contexts/PageContext";
import { useFullPageScroll } from "@/hooks/useFullPageScroll";
import { runTransition, clearTransitionStyles } from "@/lib/pageTransitions";
import { TRANSITION_MS } from "@/lib/anime";
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

const PAGE_LABELS: Record<PageId, string> = {
  home: "Home",
  about: "About",
  tech: "Tech",
  stats: "Stats",
  projects: "Projects",
  blog: "Blog",
};

/** tiles 网格规格（须与 pageTransitions 的 TILE_GRID 一致：8 列 × 6 行 = 48 格） */
const TILE_COLS = 8;
const TILE_ROWS = 6;
const TILE_COUNT = TILE_COLS * TILE_ROWS;

/**
 * SPA 页面容器（anime.js 驱动切换）：
 * - 永远只有一个 active page 居中渲染
 * - 切换时 enter 层（新页）与 exit 层（旧页快照）同时存在，runTransition 用 timeline 驱动
 * - 四种切换：tiles 瓦片翻面 / curtain 幕布横扫 / zoom-blur 缩放模糊 / reveal iris 揭示
 * - exit 层用 .transition-exit-snapshot 强制子树可见，避免重挂载触发的 FOUC / 动画重播
 * - enter 层修复了旧版 bug（旧版 enter 永不动画）：现在 enter 渲染 pending（新页）
 * - 滚轮 / 触摸 / 方向键切换（useFullPageScroll），transitioning 期间锁定
 */
export function PageShell() {
  const { current, transition, direction, navigate } = usePage();
  const [displayed, setDisplayed] = useState<PageId>(current);
  const [pending, setPending] = useState<PageId | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  const exitRef = useRef<HTMLDivElement>(null);
  const enterRef = useRef<HTMLDivElement>(null);
  const tilesRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);

  // current 变化 → 锁定 + 记录 pending（让两层同时渲染）
  useEffect(() => {
    if (current === displayed) return;
    const next = current;
    queueMicrotask(() => {
      setTransitioning(true);
      window.setTimeout(() => setPending(next), 0);
    });
  }, [current, displayed]);

  // pending 变化 → 运行切换动画；onComplete / 安全超时触发 finish 切换显示态
  useEffect(() => {
    if (pending === null || pending === displayed) return;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      // 清掉 enter 层残留的 scale/filter/clipPath inline 样式，避免影响后续交互
      clearTransitionStyles(enterRef.current);
      setDisplayed(pending);
      setPending(null);
      setTransitioning(false);
    };

    const cleanup = runTransition(transition, direction === "forward", {
      exitEl: exitRef.current,
      enterEl: enterRef.current,
      tilesContainer: tilesRef.current,
      curtainPanel: curtainRef.current,
      finish,
    });

    // 安全兜底：即使 timeline 异常未触发 onComplete，也能解锁
    const safety = window.setTimeout(finish, TRANSITION_MS + 400);

    return () => {
      window.clearTimeout(safety);
      cleanup?.();
    };
  }, [pending, displayed, transition, direction]);

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

  useFullPageScroll({ onStep: handleStep, isLocked: transitioning });

  const showTiles = pending !== null && transition === "tiles";
  const showCurtain = pending !== null && transition === "curtain";
  const ActivePage = PAGES[pending ?? displayed];
  const ExitingPage = pending !== null ? PAGES[displayed] : null;

  return (
    <div data-direction={direction} className="relative w-full h-full">
      {/* 退出层（旧页快照）：wrapper 由 runTransition 淡出；内部 .transition-exit-snapshot 强制子树可见 */}
      {ExitingPage && (
        <div
          key={`exit-${displayed}`}
          ref={exitRef}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          aria-hidden
        >
          <div className="transition-exit-snapshot absolute inset-0 flex items-center justify-center">
            <ExitingPage />
          </div>
        </div>
      )}

      {/* 进入层 / 当前页：pending 时初始 opacity 0 防 FOUC，runTransition 淡入；key=新页保证重挂载触发各 section 入场动画 */}
      <div
        key={`enter-${pending ?? displayed}`}
        ref={enterRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{ opacity: pending !== null ? 0 : 1 }}
      >
        <ActivePage />
      </div>

      {/* tiles 过渡叠加层：8×6 网格，中心扩散翻面 */}
      {showTiles && (
        <div
          key={`tiles-${displayed}-to-${pending}`}
          ref={tilesRef}
          className="tiles-overlay grid-cols-8 grid-rows-6"
          aria-hidden
        >
          {Array.from({ length: TILE_COUNT }).map((_, i) => (
            <span key={i} className="tile-cell tile-cell--accent" data-tile />
          ))}
        </div>
      )}

      {/* curtain 过渡面板：强调色幕布横扫覆盖→揭示 */}
      {showCurtain && (
        <div
          key={`curtain-${displayed}-to-${pending}`}
          ref={curtainRef}
          className="curtain-panel curtain-panel--accent"
          aria-hidden
        />
      )}

      <PageIndicator />
      <ScrollHint visible={!transitioning && current === "home"} />
    </div>
  );
}

/**
 * 右侧圆点导航：圆点 = 各 section，长条 = 当前。
 * 点击圆点直接跳转到对应 section（受 transitioning 锁保护）。
 */
function PageIndicator() {
  const { current, navigate } = usePage();
  const [locked, setLocked] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!locked) return;
    const t = window.setTimeout(() => setLocked(false), 700);
    return () => window.clearTimeout(t);
  }, [locked, current]);

  return (
    <nav
      aria-label="Section navigation"
      className="side-nav-rail theme-transition"
      onMouseLeave={() => setHoverIdx(null)}
    >
      {PAGE_ORDER.map((id, i) => {
        const active = current === id;
        const showLabel = active || hoverIdx === i;
        return (
          <button
            key={id}
            type="button"
            className={`page-dot ${active ? "is-active" : ""}`}
            onClick={() => {
              if (locked || current === id) return;
              setLocked(true);
              navigate(id);
            }}
            onMouseEnter={() => setHoverIdx(i)}
            onFocus={() => setHoverIdx(i)}
            onBlur={() => setHoverIdx(null)}
            aria-label={`Go to ${PAGE_LABELS[id]}`}
            aria-current={active ? "true" : undefined}
          >
            <span
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 whitespace-nowrap text-[10px] font-mono uppercase tracking-wider opacity-0 transition-opacity duration-200"
              style={{
                color: "var(--text-tertiary)",
                opacity: showLabel ? 0.9 : 0,
              }}
            >
              {PAGE_LABELS[id]}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

/**
 * Home 页底部的"向下滚动"提示：呼吸式 chevron，提示用户可以滚轮切换。
 * 仅在首页且未在动画中显示。
 */
function ScrollHint({ visible }: { visible: boolean }) {
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
        scroll
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
