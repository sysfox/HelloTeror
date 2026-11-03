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
 * 页面切换类型（VOID PROTOCOL 的"镜头运动"）。
 *
 * 旧版的 curtain / zoom-blur / type-wipe / slats 已整体替换。新转场全部带 Z 轴纵深，
 * 页面切换读作镜头在深空中运动，而不是两块平面淡入淡出：
 *  - depth-dive    旧页向镜头外冲出，新页从深空 Z=-2000 拉回；同心环隧道 overlay
 *  - fracture      屏幕按 4×3 多边形碎片裂开飞出；新页放大回正 + 去模糊显影
 *  - warp-tunnel   径向速度线 + 中点白闪；旧页被吸入中心，新页从中心炸开
 *  - lattice-wipe  线框平面自上而下横扫，旧页被"切片"带走，新页自下浮起
 *
 * forward / backward 方向由 navigate 时按 PAGE_ORDER 索引判定，
 * 决定每种转场的扫过方向（forward = 左→右 / 上→下，backward 反之）。
 *
 * 新增类型需同步四处：本联合类型、TRANSITION_CYCLE、
 * pageTransitions.ts 的 TRANSITION_DURATIONS（Record 完备性会强制）与 runTransition，
 * 以及 PageShell 里对应的 overlay DOM。
 */
export type TransitionType =
  | "depth-dive"
  | "fracture"
  | "warp-tunnel"
  | "lattice-wipe";

/**
 * 页面顺序常量（用于判断 forward / backward 方向以决定转场方向）
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
 * 循环序列：每次切换前进一格，避免连续切换单调。
 * 排列上让"整体缩放类"（depth-dive / warp-tunnel）与
 * "遮挡/切片类"（fracture / lattice-wipe）交替出现，节奏对比更明显。
 */
const TRANSITION_CYCLE: TransitionType[] = [
  "depth-dive",
  "fracture",
  "warp-tunnel",
  "lattice-wipe",
];

interface PageContextValue {
  current: PageId;
  direction: "forward" | "backward";
  transition: TransitionType;
  navigate: (id: PageId) => void;
  /**
   * 是否正在切换。由 PageShell 写入（它拥有 enter/exit 两层的时序），
   * 上提到 context 是为了让 PageShell 之外的持久层也能参与转场
   *（消费者：背景场景 / HUD 层的转场脉冲）。
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
