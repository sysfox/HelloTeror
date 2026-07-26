"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PageId =
  | "home"
  | "about"
  | "tech"
  | "stats"
  | "projects"
  | "blog";

/**
 * anime.js 驱动的切换动画（kinetic-tech 风格）：
 *  - curtain    强调色幕布横扫覆盖→揭示（两段式，融合站点主色）
 *  - zoom-blur  缩放+模糊交叉淡入淡出（一段式，电影感）
 *  - type-wipe  幕布上印目标页超大词标，与幕布反向视差掠过（两段式，拍板感）
 *  - slats      竖条百叶窗逐条覆盖再逐条揭开（两段式，机械感）
 *
 * forward / backward 方向由 navigate 时按 PAGE_ORDER 索引判定，
 * 影响幕布类切换的覆盖方向。
 *
 * 新增类型需同步四处：本联合类型、TRANSITION_CYCLE、
 * pageTransitions.ts 的 TRANSITION_DURATIONS（Record 完备性会强制）与 runTransition，
 * 以及 PageShell 里对应的 overlay DOM。
 */
export type TransitionType = "curtain" | "zoom-blur" | "type-wipe" | "slats";

/**
 * 页面顺序常量（用于判断 forward / backward 方向以决定 curtain 方向）
 */
export const PAGE_ORDER: PageId[] = [
  "home",
  "about",
  "tech",
  "stats",
  "projects",
  "blog",
];

/**
 * 循环序列：按顺序轮换，避免连续切换单调。
 * 排列上让"幕布类"与"非幕布类"交替出现，节奏对比更明显。
 */
const TRANSITION_CYCLE: TransitionType[] = [
  "curtain",
  "zoom-blur",
  "type-wipe",
  "slats",
];

interface PageContextValue {
  current: PageId;
  direction: "forward" | "backward";
  transition: TransitionType;
  navigate: (id: PageId) => void;
  /**
   * 是否正在切换。由 PageShell 写入（它拥有 enter/exit 两层的时序），
   * 上提到 context 是为了让 PageShell 之外的持久层也能参与转场
   *（目前的消费者：AuroraBackground 的转场脉冲）。
   */
  transitioning: boolean;
  setTransitioning: (value: boolean) => void;
}

const PageContext = createContext<PageContextValue | null>(null);

export function PageProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<PageId>("home");
  const [transitionIndex, setTransitionIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [transitioning, setTransitioning] = useState(false);

  const navigate = useCallback(
    (id: PageId) => {
      if (id === current) return;
      const fromIndex = PAGE_ORDER.indexOf(current);
      const toIndex = PAGE_ORDER.indexOf(id);
      setDirection(toIndex > fromIndex ? "forward" : "backward");
      setTransitionIndex((i) => (i + 1) % TRANSITION_CYCLE.length);
      setCurrent(id);
    },
    [current]
  );

  const value = useMemo<PageContextValue>(
    () => ({
      current,
      direction,
      transition: TRANSITION_CYCLE[transitionIndex],
      navigate,
      transitioning,
      setTransitioning,
    }),
    [current, direction, transitionIndex, navigate, transitioning]
  );

  return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
}

export function usePage() {
  const ctx = useContext(PageContext);
  if (!ctx) {
    throw new Error("usePage must be used within a PageProvider");
  }
  return ctx;
}
