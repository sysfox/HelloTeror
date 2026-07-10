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
 * 两种 anime.js 驱动的切换动画（kinetic-tech 风格）：
 *  - curtain    强调色幕布横扫覆盖→揭示（两段式，融合站点主色）
 *  - zoom-blur  缩放+模糊交叉淡入淡出（一段式，电影感）
 *
 * forward / backward 方向由 navigate 时按 PAGE_ORDER 索引判定，
 * 影响 curtain 的覆盖方向。
 */
export type TransitionType = "curtain" | "zoom-blur";

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
 * 循环序列：两种动画交替，避免连续切换单调。
 * curtain 横扫与 zoom-blur 缩放模糊节奏对比，频率各 1/2。
 */
const TRANSITION_CYCLE: TransitionType[] = ["curtain", "zoom-blur"];

interface PageContextValue {
  current: PageId;
  direction: "forward" | "backward";
  transition: TransitionType;
  navigate: (id: PageId) => void;
}

const PageContext = createContext<PageContextValue | null>(null);

export function PageProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<PageId>("home");
  const [transitionIndex, setTransitionIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

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
    }),
    [current, direction, transitionIndex, navigate]
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
