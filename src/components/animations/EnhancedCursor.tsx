"use client";

import { useEffect, useRef, useState } from "react";
import {
  animate,
  createAnimatable,
  springSoft,
  spring,
  prefersReducedMotion,
  type JSAnimation,
} from "@/lib/anime";

/**
 * 增强光标（VOID PROTOCOL 瞄具）：
 *  - 中心点：瞬时跟随（直接写 transform）
 *  - 主环：anime.js spring 平滑跟随（springSoft），环内四向准星刻度
 *  - 旋转虚线环：极慢匀速自转，制造「持续运转」的 HUD 呼吸感
 *  - 拖尾环：更慢 spring 跟随，营造拖尾
 *  - 悬停可交互元素（a/button/[data-cursor='hover']）：主环 spring 放大 +
 *    切到 accent 色 + accent-soft 内晕
 * 仅 (hover:hover) 且 (pointer:fine) 桌面端启用，移动端隐藏。
 * prefers-reduced-motion 时保留跟随（交互必需），但停掉自转。
 *
 * 注意：圆点/外环/拖尾的 transform 由 JS 直接管理（anime.js 或手写），
 * 故 React style 不含 transform，避免 re-render 覆盖 anime.js 写入的 inline transform。
 */
export function EnhancedCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const reticleRef = useRef<HTMLDivElement>(null);
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
    const reticle = reticleRef.current;
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

    // 旋转虚线环：匀速 14s/圈；reduced-motion 下不创建
    let spin: JSAnimation | null = null;
    if (reticle && !prefersReducedMotion()) {
      spin = animate(reticle, {
        rotate: [0, 360],
        duration: 14000,
        loop: true,
        ease: "linear",
      });
    }

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
      ringAnim.scale(interactive ? 1.6 : 1);
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
      spin?.revert();
      ringAnim.revert();
      trailAnim.revert();
    };
  }, []);

  if (!enabled) return null;

  const ringColor = hovering
    ? "var(--accent-border, rgba(90,242,255,0.42))"
    : "var(--border-strong)";
  const ringBg = hovering ? "var(--accent-soft)" : "transparent";
  const ringShadow = hovering
    ? "0 0 26px var(--accent-glow), inset 0 0 12px var(--accent-soft)"
    : "0 0 10px rgba(0,0,0,0.5)";
  const tickColor = hovering ? "var(--accent, #5af2ff)" : "var(--text-tertiary)";

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
          width: "46px",
          height: "46px",
          marginLeft: "-23px",
          marginTop: "-23px",
          borderRadius: "50%",
          border: "1px solid var(--accent-border)",
          opacity: hidden ? 0 : 0.35,
          willChange: "transform",
          transition: "opacity 240ms ease",
        }}
      />

      {/* 主环：spring 跟随 + 悬停弹性放大变色 + 准星刻度 + 旋转虚线环 */}
      <div
        ref={ringRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "36px",
          height: "36px",
          marginLeft: "-18px",
          marginTop: "-18px",
          borderRadius: "50%",
          border: `1px solid ${ringColor}`,
          background: ringBg,
          boxShadow: ringShadow,
          opacity: hidden ? 0 : 1,
          transition:
            "border-color 240ms ease, background 240ms ease, box-shadow 240ms ease, opacity 240ms ease",
          willChange: "transform",
        }}
      >
        {/* 四向准星刻度 */}
        {[
          { top: "-1px", left: "50%", width: "1px", height: "5px", marginLeft: "-0.5px" },
          { bottom: "-1px", left: "50%", width: "1px", height: "5px", marginLeft: "-0.5px" },
          { left: "-1px", top: "50%", width: "5px", height: "1px", marginTop: "-0.5px" },
          { right: "-1px", top: "50%", width: "5px", height: "1px", marginTop: "-0.5px" },
        ].map((pos, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              background: tickColor,
              ...pos,
            }}
          />
        ))}
        {/* 旋转虚线环：由 anime 匀速自转 */}
        <div
          ref={reticleRef}
          style={{
            position: "absolute",
            inset: "-7px",
            borderRadius: "50%",
            border: "1px dashed var(--accent-border)",
            opacity: 0.45,
          }}
        />
      </div>

      {/* 中心点：瞬时跟随 */}
      <div
        ref={dotRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: hovering
            ? "var(--accent, #5af2ff)"
            : "var(--text-primary)",
          boxShadow: hovering
            ? "0 0 12px var(--accent-glow)"
            : "0 0 6px rgba(230,247,255,0.5)",
          opacity: hidden ? 0 : 1,
          transition: "background 240ms ease, opacity 240ms ease",
          willChange: "transform",
        }}
      />
    </div>
  );
}
