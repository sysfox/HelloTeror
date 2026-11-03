"use client";

import { useSyncExternalStore } from "react";

/**
 * reduced-motion 订阅。
 *
 * 归档隧道本身是静态布局，但 hover 的 translateZ / 展开高度属于动效，
 * 减少动效偏好下要直接关掉。用 useSyncExternalStore：
 * 服务端快照 false 保证 hydration 一致，且避免 setState-in-effect。
 */
const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(REDUCE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(REDUCE_QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
