"use client";

import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type RefObject,
} from "react";
import type { ScenePointer } from "./contracts";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * 偏好减少动效的 SSR 安全订阅。
 * 用 useSyncExternalStore 而不是 useEffect + setState：后者在首帧会先按
 * "非 reduced" 渲染再校正，可能让 WebGPU / WebGL 画布先挂载一帧 ——
 * 对 reduced-motion 用户来说这就是一次闪烁。
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCED_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false
  );
}

/**
 * 场景层共用的输入遥测。
 *
 * 为什么用 ref 而不是 state：
 * 指针与转场脉冲每帧都在变，走 state 会让 SceneRoot 及其子树每帧重渲染，
 * 既昂贵又会打断 R3F/vgpu 的渲染循环。消费者（VgpuField / ThreeField）
 * 在自己的帧循环里读 `.current` 即可，React 树保持静止。
 *
 * 所有监听都挂在 window（SceneRoot 是 pointer-events-none），
 * 并在卸载时移除；rAF 循环在数值收敛后自动停止，空闲时不占 CPU。
 */
export interface SceneTelemetry {
  /** 阻尼后的归一化指针（-1..1，y 轴向上） */
  pointerRef: RefObject<ScenePointer>;
  /** 转场脉冲：切换开始冲到 1，结束后缓慢衰减到 0 */
  pulseRef: RefObject<number>;
  /** document 可见性（隐藏时 vgpu/three 应暂停降频） */
  visibleRef: RefObject<boolean>;
}

export function useSceneTelemetry(transitioning: boolean): SceneTelemetry {
  const pointerRef = useRef<ScenePointer>({ x: 0, y: 0 });
  const pulseRef = useRef(0);
  const visibleRef = useRef(true);

  // 目标值 / 调度函数都放 ref，避免主 effect 因 transitioning 变化重装监听
  const targetRef = useRef<ScenePointer>({ x: 0, y: 0 });
  const pulseTargetRef = useRef(0);
  const reducedRef = useRef(false);
  const kickRef = useRef<() => void>(() => {});

  // 主 effect：只挂一次监听，卸载时彻底清理（strict-mode 双挂载安全）
  useEffect(() => {
    if (typeof window === "undefined") return;

    let raf = 0;
    let last = 0;

    const tick = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(64, now - last) : 16;
      last = now;
      let active = false;

      // 指针阻尼：指数逼近，和帧率无关
      const p = pointerRef.current;
      const target = targetRef.current;
      const damp = 1 - Math.exp(-dt / 130);
      if (
        Math.abs(p.x - target.x) > 0.0004 ||
        Math.abs(p.y - target.y) > 0.0004
      ) {
        p.x += (target.x - p.x) * damp;
        p.y += (target.y - p.y) * damp;
        active = true;
      } else {
        p.x = target.x;
        p.y = target.y;
      }

      // 脉冲：起得快（120ms 量级）、落得慢（350ms 量级），形成“能量释放”感
      const pulseTarget = reducedRef.current ? 0 : pulseTargetRef.current;
      if (Math.abs(pulseRef.current - pulseTarget) > 0.001) {
        const tau = pulseTarget > pulseRef.current ? 90 : 300;
        pulseRef.current += (pulseTarget - pulseRef.current) * (1 - Math.exp(-dt / tau));
        active = true;
      } else {
        pulseRef.current = pulseTarget;
      }

      if (active) {
        raf = window.requestAnimationFrame(tick);
      } else {
        // 收敛后清空时间基准，下次 kick 时重新计 dt
        last = 0;
      }
    };

    const kick = () => {
      if (raf) return;
      last = 0;
      raf = window.requestAnimationFrame(tick);
    };
    kickRef.current = kick;

    const onPointer = (event: PointerEvent) => {
      const x = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      const y = -((event.clientY / Math.max(1, window.innerHeight)) * 2 - 1);
      targetRef.current.x = Math.max(-1, Math.min(1, x));
      targetRef.current.y = Math.max(-1, Math.min(1, y));
      kick();
    };

    // 指针移出窗口时回中，避免场景长期卡在边缘姿态。
    // pointerout 会在任意子元素之间冒泡触发，只有 relatedTarget 为空才是真正离开文档。
    const onLeave = (event: PointerEvent) => {
      if (event.relatedTarget) return;
      targetRef.current.x = 0;
      targetRef.current.y = 0;
      kick();
    };

    const onVisibility = () => {
      visibleRef.current = !document.hidden;
      if (!document.hidden) kick();
    };

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedRef.current = mq.matches;
    const onReducedChange = () => {
      reducedRef.current = mq.matches;
      kick();
    };

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });
    window.addEventListener("pointerout", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    mq.addEventListener("change", onReducedChange);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("pointerout", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      mq.removeEventListener("change", onReducedChange);
      kickRef.current = () => {};
    };
  }, []);

  // transitioning 变化时更新目标并唤醒循环
  useEffect(() => {
    pulseTargetRef.current = transitioning ? 1 : 0;
    kickRef.current();
  }, [transitioning]);

  return { pointerRef, pulseRef, visibleRef };
}
