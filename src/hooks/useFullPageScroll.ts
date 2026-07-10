"use client";

import { useEffect, useRef } from "react";

interface UseFullPageScrollOptions {
  /** 容器（默认 window），需要监听滚轮的 DOM 元素 */
  container?: HTMLElement | null;
  /** 切换方向回调：1 = 下一个页面，-1 = 上一个页面，0 = 不切换 */
  onStep: (direction: 1 | -1) => void;
  /** 是否处于锁定状态（动画进行中）。为 true 时所有滚轮/触摸事件被忽略。 */
  isLocked: boolean;
  /** 触发阈值：wheel 累加 |deltaY| 超过此值才触发一次切换，默认 50 */
  wheelThreshold?: number;
  /** 触发阈值：touch swipe 位移像素，默认 60 */
  swipeThreshold?: number;
  /** 节流冷却：即使未锁定，连续两次触发的最小间隔（ms），默认 600 */
  cooldownMs?: number;
  /** 主动停用（如输入框聚焦、菜单打开时） */
  enabled?: boolean;
}

/**
 * 全屏页面滚动驱动：
 *  - 鼠标滚轮：累加 |deltaY|，超过阈值后切换一次并重置累加器（避免误触发）
 *  - 触摸滑动：touchstart 记录起点，touchmove 计算位移，超过阈值切一次
 *  - 冷却 + 锁定：避免动画进行中重复触发 / 短时间内误连发
 *  - prefers-reduced-motion 时整体禁用
 */
export function useFullPageScroll({
  container,
  onStep,
  isLocked,
  wheelThreshold = 50,
  swipeThreshold = 60,
  cooldownMs = 600,
  enabled = true,
}: UseFullPageScrollOptions) {
  // 用 ref 持有最新回调，避免 effect 频繁重绑
  const onStepRef = useRef(onStep);
  const isLockedRef = useRef(isLocked);

  useEffect(() => {
    onStepRef.current = onStep;
    isLockedRef.current = isLocked;
  });

  useEffect(() => {
    if (!enabled) return;

    // 减少动效偏好下，禁用滚轮/触摸导航
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mq.matches) return;
    }

    const target: HTMLElement | Window = container ?? window;
    let lastTriggerAt = 0;
    let wheelAccum = 0;
    let lastWheelDir: 1 | -1 | 0 = 0;
    let touchStartY: number | null = null;
    let touchActive = false;

    const canTrigger = () => {
      if (isLockedRef.current) return false;
      const now = performance.now();
      if (now - lastTriggerAt < cooldownMs) return false;
      return true;
    };

    const tryTrigger = (dir: 1 | -1) => {
      if (!canTrigger()) return;
      lastTriggerAt = performance.now();
      onStepRef.current(dir);
    };

    // ===== Wheel =====
    const onWheel = (e: WheelEvent) => {
      // 任何带垂直分量的滚轮都参与累加；忽略完全水平的滚动
      const dy = e.deltaY;
      if (dy === 0) return;

      // 重置时方向不一致说明用户改变了意图，丢弃旧累加
      const dir: 1 | -1 = dy > 0 ? 1 : -1;
      if (lastWheelDir !== 0 && lastWheelDir !== dir) {
        wheelAccum = 0;
      }
      lastWheelDir = dir;
      wheelAccum += Math.abs(dy);

      if (wheelAccum >= wheelThreshold) {
        wheelAccum = 0;
        tryTrigger(dir);
      }
    };

    // ===== Touch =====
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      touchStartY = e.touches[0].clientY;
      touchActive = true;
    };
    const onTouchMove = () => {
      // 仅在 start 之后追踪，不在这里触发
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!touchActive || touchStartY === null) {
        touchStartY = null;
        touchActive = false;
        return;
      }
      const t = e.changedTouches[0];
      if (!t) {
        touchStartY = null;
        touchActive = false;
        return;
      }
      const dy = touchStartY - t.clientY; // 向上滑 = 正数 = 下一个
      if (Math.abs(dy) >= swipeThreshold) {
        const dir: 1 | -1 = dy > 0 ? 1 : -1;
        tryTrigger(dir);
      }
      touchStartY = null;
      touchActive = false;
    };

    // ===== Keyboard（可选辅助：↑/↓、PageUp/PageDown、Home/End） =====
    const onKey = (e: KeyboardEvent) => {
      if (isLockedRef.current) return;
      const target = e.target as HTMLElement | null;
      // 输入控件聚焦时不拦截
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      switch (e.key) {
        case "ArrowDown":
        case "PageDown":
          e.preventDefault();
          tryTrigger(1);
          break;
        case "ArrowUp":
        case "PageUp":
          e.preventDefault();
          tryTrigger(-1);
          break;
        default:
          break;
      }
    };

    // 滚轮：passive listener（不阻塞滚动）
    target.addEventListener("wheel", onWheel as EventListener, { passive: true });
    // 触摸：需要 preventDefault 以避免页面级 scroll（已 overflow-hidden，但 touchmove 仍可能影响）
    target.addEventListener("touchstart", onTouchStart as EventListener, { passive: true });
    target.addEventListener("touchmove", onTouchMove as EventListener, { passive: true });
    target.addEventListener("touchend", onTouchEnd as EventListener, { passive: true });
    target.addEventListener("touchcancel", onTouchEnd as EventListener, { passive: true });
    window.addEventListener("keydown", onKey);

    return () => {
      target.removeEventListener("wheel", onWheel as EventListener);
      target.removeEventListener("touchstart", onTouchStart as EventListener);
      target.removeEventListener("touchmove", onTouchMove as EventListener);
      target.removeEventListener("touchend", onTouchEnd as EventListener);
      target.removeEventListener("touchcancel", onTouchEnd as EventListener);
      window.removeEventListener("keydown", onKey);
    };
  }, [container, wheelThreshold, swipeThreshold, cooldownMs, enabled]);
}
