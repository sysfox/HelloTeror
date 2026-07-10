"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 磁吸光标：跟随鼠标的双层光标。
 * - 内层：小圆点，瞬时跟随
 * - 外层：柔光圆环，使用 lerp 平滑插值，营造拖尾感
 * - 悬停可交互元素（a/button）时，外环放大并变为蓝色光晕
 * - 仅在支持悬停的桌面端启用，移动端自动隐藏
 */
export function MagneticCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    // 仅在支持 hover 且精细指针的设备上启用
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!mq.matches) return;

    // 异步启用，避免 effect 内同步 setState
    const enableRaf = requestAnimationFrame(() => setEnabled(true));

    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let frame = 0;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      setHidden(false);
      // 内层圆点瞬时跟随
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;

      // 检测是否悬停在可交互元素上
      const target = e.target as Element;
      const interactive = target.closest("a, button, [data-cursor='hover']");
      setHovering(Boolean(interactive));
    };

    const onLeave = () => setHidden(true);
    const onEnter = () => setHidden(false);

    // 平滑插值更新外环位置
    const tick = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    document.documentElement.classList.add("cursor-hidden");
    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    return () => {
      cancelAnimationFrame(enableRaf);
      cancelAnimationFrame(frame);
      document.documentElement.classList.remove("cursor-hidden");
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9998 }}>
      {/* 外环：平滑跟随 + 悬停时放大变色 */}
      <div
        ref={ringRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: hovering ? "56px" : "34px",
          height: hovering ? "56px" : "34px",
          borderRadius: "50%",
          border: `1px solid ${hovering ? "rgba(41,151,255,0.9)" : "rgba(245,245,247,0.55)"}`,
          background: hovering
            ? "radial-gradient(circle, rgba(41,151,255,0.18) 0%, rgba(41,151,255,0) 70%)"
            : "transparent",
          boxShadow: hovering
            ? "0 0 24px rgba(41,151,255,0.45)"
            : "0 0 8px rgba(245,245,247,0.15)",
          opacity: hidden ? 0 : 1,
          transition:
            "width 280ms cubic-bezier(0.16,1,0.3,1), height 280ms cubic-bezier(0.16,1,0.3,1), border-color 280ms ease, background 280ms ease, box-shadow 280ms ease, opacity 240ms ease",
          willChange: "transform",
        }}
      />
      {/* 内层圆点：瞬时跟随 */}
      <div
        ref={dotRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: hovering ? "#2997ff" : "#f5f5f7",
          boxShadow: "0 0 6px rgba(255,255,255,0.6)",
          opacity: hidden ? 0 : 1,
          transition: "background 240ms ease, opacity 240ms ease",
          willChange: "transform",
        }}
      />
    </div>
  );
}
