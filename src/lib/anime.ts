/**
 * anime.js v4 统一封装：
 *  - re-export 常用方法，避免各组件散落 import
 *  - 集中缓动 / spring 预设（spring 用工厂函数，每次生成新实例，避免并发复用 parent 状态）
 *  - prefers-reduced-motion 守卫 + 过渡总时长常量
 *
 * 所有动画均在 "use client" 组件的 useEffect 中执行，SSR 安全。
 */
// 先 import 到本地作用域（spring 工厂函数需在本地调用 spring()），
// 再 re-export 供其它组件直接引用。
import {
  animate,
  stagger,
  spring,
  createTimeline,
  createScope,
  createAnimatable,
  utils,
  set,
} from "animejs";

export {
  animate,
  stagger,
  spring,
  createTimeline,
  createScope,
  createAnimatable,
  utils,
  set,
};

export type {
  Scope,
  JSAnimation,
  Timeline,
  AnimatableObject,
} from "animejs";

/** 页面切换过渡总时长（ms），须与 useFullPageScroll 的 cooldownMs(600) 配套 */
export const TRANSITION_MS = 550;

/** 字符串缓动预设（anime.js v4 用 ease 而非 easing） */
export const EASE = {
  expo: "outExpo",
  quart: "inOutQuart",
  back: "outBack",
  circ: "outCirc",
} as const;

/** 柔和弹簧：按钮回弹、光标拖尾 */
export const springSoft = () => spring({ bounce: 0.2, duration: 520 });
/** 干脆弹簧：磁吸按钮、卡片倾斜 */
export const springSnappy = () => spring({ stiffness: 120, damping: 13 });
/** 弹跳弹簧：强调回弹效果 */
export const springBouncy = () => spring({ bounce: 0.4, duration: 600 });

/**
 * 是否偏好减少动效。SSR 安全（typeof window 守卫）。
 * 命中时各组件应跳过动画、直接置终态。
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
