"use client";

import { useSyncExternalStore } from "react";

/**
 * Projects「机库」视图只在宽屏 + 允许动效时启用；窄屏或 reduced-motion
 * 退化为紧凑列表（3D 焦点切换在触屏上无法用 hover 表达，且减少动效用户
 * 需要静态布局）。
 *
 * 用 useSyncExternalStore 而不是 useEffect + setState：
 *  - 服务端快照固定 false，避免 hydration mismatch；
 *  - 媒体查询订阅是同步的，也不触发 react-hooks/set-state-in-effect。
 */
const NARROW_QUERY = "(max-width: 767px)";
const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const queries = [
    window.matchMedia(NARROW_QUERY),
    window.matchMedia(REDUCE_QUERY),
  ];
  for (const q of queries) q.addEventListener("change", onChange);
  return () => {
    for (const q of queries) q.removeEventListener("change", onChange);
  };
}

function getSnapshot() {
  return (
    window.matchMedia(NARROW_QUERY).matches ||
    window.matchMedia(REDUCE_QUERY).matches
  );
}

/** 服务端没有 matchMedia：先按宽屏渲染， hydration 后由快照纠正 */
function getServerSnapshot() {
  return false;
}

export function useCompactMode(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
