"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  createAnimatable,
  springSnappy,
  prefersReducedMotion,
} from "@/lib/anime";

/**
 * 3D 光标倾斜卡片（VOID PROTOCOL）：
 *  - 真透视：外层 perspective 1000px，内层 rotateX/rotateY + 轻微 translateZ 抬升
 *  - glare sweep：跟随指针的径向光斑 + 随指针角度旋转的斜向扫描带（叠加两层背景）
 *  - border energy：hover 时对内层做 drop-shadow(accent-glow)，
 *    filter 沿卡片轮廓发光（比矩形边框层更贴合圆角，不需要知道 radius）
 *
 * 分层互不冲突：
 *   StaggerGroup(item 透明度/位移/scale/filter) → TiltCard 外层(perspective) →
 *   TiltCard 内层(rotateX/rotateY/translateZ/scale) → 卡片自身 hover transform
 *
 * 触屏 / prefers-reduced-motion 禁用倾斜，保留原生交互与静态外观。
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
      translateZ: { ease: springSnappy() },
      scale: { ease: springSnappy() },
    });

    const onMove = (e: MouseEvent) => {
      const rect = outer.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width; // 0..1
      const py = (e.clientY - rect.top) / rect.height; // 0..1
      anim.rotateX((0.5 - py) * maxTilt * 2);
      anim.rotateY((px - 0.5) * maxTilt * 2);
      anim.translateZ(18);
      anim.scale(scale);

      if (glareRef.current) {
        glareRef.current.style.setProperty("--mx", `${px * 100}%`);
        glareRef.current.style.setProperty("--my", `${py * 100}%`);
        // 斜向扫描带角度跟随指针：让「反光」始终从指针方向掠过
        const angle = (Math.atan2(py - 0.5, px - 0.5) * 180) / Math.PI + 90;
        glareRef.current.style.setProperty("--ga", `${angle}deg`);
        glareRef.current.style.opacity = "1";
      }
    };

    // border energy：沿卡片轮廓的辉光，只在进入/离开时各写一次
    const onEnter = () => {
      inner.style.filter = "drop-shadow(0 0 16px var(--accent-glow))";
    };

    const onLeave = () => {
      anim.rotateX(0);
      anim.rotateY(0);
      anim.translateZ(0);
      anim.scale(1);
      inner.style.filter = "";
      if (glareRef.current) glareRef.current.style.opacity = "0";
    };

    outer.addEventListener("mousemove", onMove);
    outer.addEventListener("mouseenter", onEnter);
    outer.addEventListener("mouseleave", onLeave);
    return () => {
      outer.removeEventListener("mousemove", onMove);
      outer.removeEventListener("mouseenter", onEnter);
      outer.removeEventListener("mouseleave", onLeave);
      anim.revert();
      inner.style.filter = "";
    };
  }, [maxTilt, glare, scale]);

  return (
    <div ref={outerRef} className={`group [perspective:1000px] ${className}`}>
      <div
        ref={innerRef}
        className="relative"
        style={{
          transformStyle: "preserve-3d",
          transition: "filter 260ms ease",
        }}
      >
        {children}
        {glare && (
          <div
            ref={glareRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0"
            style={{
              background:
                "radial-gradient(circle at var(--mx, 50%) var(--my, 50%), var(--accent-soft), transparent 55%), linear-gradient(var(--ga, 120deg), transparent 38%, var(--accent-soft) 50%, transparent 62%)",
              transition: "opacity 200ms ease",
              willChange: "opacity",
            }}
          />
        )}
      </div>
    </div>
  );
}
