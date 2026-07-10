"use client";

import { useEffect, useRef, useState } from "react";
import { createAnimatable, springSoft, spring } from "@/lib/anime";

/**
 * 增强光标（替换 MagneticCursor）：
 *  - 圆点：瞬时跟随（直接写 transform）
 *  - 外环：anime.js spring 平滑跟随（springSoft）
 *  - 拖尾环：更慢 spring 跟随，营造拖尾
 *  - 悬停可交互元素（a/button/[data-cursor='hover']）：外环 spring 放大 + 变色
 * 仅 (hover:hover) 且 (pointer:fine) 桌面端启用，移动端隐藏。
 *
 * 注意：圆点/外环/拖尾的 transform 由 JS 直接管理（anime.js 或手写），
 * 故 React style 不含 transform，避免 re-render 覆盖 anime.js 写入的 inline transform。
 */
export function EnhancedCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!mq.matches) return;
    const enableRaf = requestAnimationFrame(() => setEnabled(true));

    const dot = dotRef.current;
    const ring = ringRef.current;
    const trail = trailRef.current;
    if (!dot || !ring || !trail) return;

    const ringAnim = createAnimatable(ring, {
      x: { ease: springSoft() },
      y: { ease: springSoft() },
      scale: { ease: springSoft() },
    });
    const slowSpring = () => spring({ bounce: 0.1, duration: 850 });
    const trailAnim = createAnimatable(trail, {
      x: { ease: slowSpring() },
      y: { ease: slowSpring() },
    });

    const onMove = (e: MouseEvent) => {
      const mx = e.clientX;
      const my = e.clientY;
      setHidden(false);
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
      ringAnim.x(mx);
      ringAnim.y(my);
      trailAnim.x(mx);
      trailAnim.y(my);

      const target = e.target as Element | null;
      const interactive = Boolean(target?.closest("a, button, [data-cursor='hover']"));
      ringAnim.scale(interactive ? 1.7 : 1);
      setHovering(interactive);
    };

    const onLeave = () => setHidden(true);
    const onEnter = () => setHidden(false);

    document.documentElement.classList.add("cursor-hidden");
    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    return () => {
      cancelAnimationFrame(enableRaf);
      document.documentElement.classList.remove("cursor-hidden");
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      ringAnim.revert();
      trailAnim.revert();
    };
  }, []);

  if (!enabled) return null;

  const ringColor = hovering ? "rgba(41,151,255,0.9)" : "rgba(245,245,247,0.55)";
  const ringBg = hovering
    ? "radial-gradient(circle, rgba(41,151,255,0.18) 0%, rgba(41,151,255,0) 70%)"
    : "transparent";
  const ringShadow = hovering
    ? "0 0 24px rgba(41,151,255,0.45)"
    : "0 0 8px rgba(245,245,247,0.15)";

  return (
    <div
      aria-hidden
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9998 }}
    >
      {/* 拖尾环：慢 spring 跟随 */}
      <div
        ref={trailRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "44px",
          height: "44px",
          marginLeft: "-22px",
          marginTop: "-22px",
          borderRadius: "50%",
          border: "1px solid rgba(41,151,255,0.25)",
          opacity: hidden ? 0 : 0.6,
          willChange: "transform",
        }}
      />
      {/* 外环：spring 跟随 + 悬停弹性放大变色 */}
      <div
        ref={ringRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "34px",
          height: "34px",
          marginLeft: "-17px",
          marginTop: "-17px",
          borderRadius: "50%",
          border: `1px solid ${ringColor}`,
          background: ringBg,
          boxShadow: ringShadow,
          opacity: hidden ? 0 : 1,
          transition:
            "border-color 240ms ease, background 240ms ease, box-shadow 240ms ease, opacity 240ms ease",
          willChange: "transform",
        }}
      />
      {/* 圆点：瞬时跟随 */}
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
