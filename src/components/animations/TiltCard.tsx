"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  createAnimatable,
  springSnappy,
  prefersReducedMotion,
} from "@/lib/anime";

/**
 * 3D 光标倾斜卡片：包裹卡片，mousemove 按 spring 驱动 rotateX/rotateY，
 * 内部光晕 radial-gradient 跟随光标位置（更新 CSS var --mx/--my），离开弹回。
 *
 * 三层 transform 互不冲突：
 *   StaggerGroup(item 透明度/translateY/scale) → TiltCard 外层(perspective) →
 *   TiltCard 内层(rotateX/rotateY/scale) → 卡片自身 hover transform
 *
 * 触屏 / prefers-reduced-motion 禁用倾斜，保留原生交互。
 */
type TiltCardProps = {
  children: ReactNode;
  className?: string;
  /** 最大倾斜角（deg） */
  maxTilt?: number;
  /** 是否启用光晕跟随 */
  glare?: boolean;
  /** 悬停轻微放大 */
  scale?: number;
};

export function TiltCard({
  children,
  className = "",
  maxTilt = 8,
  glare = true,
  scale = 1.02,
}: TiltCardProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;
    if (!finePointer || prefersReducedMotion()) return;
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const anim = createAnimatable(inner, {
      rotateX: { ease: springSnappy() },
      rotateY: { ease: springSnappy() },
      scale: { ease: springSnappy() },
    });

    const onMove = (e: MouseEvent) => {
      const rect = outer.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width; // 0..1
      const py = (e.clientY - rect.top) / rect.height; // 0..1
      anim.rotateX((0.5 - py) * maxTilt * 2);
      anim.rotateY((px - 0.5) * maxTilt * 2);
      anim.scale(scale);
      if (glareRef.current) {
        glareRef.current.style.setProperty("--mx", `${px * 100}%`);
        glareRef.current.style.setProperty("--my", `${py * 100}%`);
        glareRef.current.style.opacity = "1";
      }
    };

    const onLeave = () => {
      anim.rotateX(0);
      anim.rotateY(0);
      anim.scale(1);
      if (glareRef.current) glareRef.current.style.opacity = "0";
    };

    outer.addEventListener("mousemove", onMove);
    outer.addEventListener("mouseleave", onLeave);
    return () => {
      outer.removeEventListener("mousemove", onMove);
      outer.removeEventListener("mouseleave", onLeave);
      anim.revert();
    };
  }, [maxTilt, glare, scale]);

  return (
    <div ref={outerRef} className={`group [perspective:900px] ${className}`}>
      <div ref={innerRef} className="relative preserve-3d">
        {children}
        {glare && (
          <div
            ref={glareRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-200"
            style={{
              background:
                "radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(41,151,255,0.18), transparent 55%)",
            }}
          />
        )}
      </div>
    </div>
  );
}
