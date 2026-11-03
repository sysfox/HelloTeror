"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  animate,
  createAnimatable,
  springSnappy,
  prefersReducedMotion,
  type JSAnimation,
} from "@/lib/anime";

/**
 * 磁吸 + 3D 倾斜 + 扫描带按钮（VOID PROTOCOL）：
 *  - 外层：perspective 容器
 *  - 内层：createAnimatable 注册 x/y/translateZ/rotateX/rotateY，spring 跟随光标；
 *    悬停时沿 Z 轴抬升，配合倾斜产生真实的「浮起」感
 *  - 扫描带：hover 进入时一条 accent 光带从左掠到右（一次性，不随 mousemove 重播）
 *  - border energy：悬停对内层做 drop-shadow(accent-glow)，沿按钮轮廓发光
 * 内层内部再放真实按钮/链接（保留其自身 hover transform），三层 transform 互不冲突。
 * 命中 prefers-reduced-motion 时完全跳过，元素保持原生交互。
 */
type MagneticButtonProps = {
  children: ReactNode;
  className?: string;
  /** 磁吸强度（0~1），越大跟随越远 */
  strength?: number;
  /** 倾斜系数（弧度比例） */
  tilt?: number;
  /** 是否启用 3D 倾斜 */
  enableTilt?: boolean;
};

export function MagneticButton({
  children,
  className = "",
  strength = 0.35,
  tilt = 0.06,
  enableTilt = true,
}: MagneticButtonProps) {
  const outerRef = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const sweepRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const anim = createAnimatable(inner, {
      x: { ease: springSnappy() },
      y: { ease: springSnappy() },
      translateZ: { ease: springSnappy() },
      ...(enableTilt
        ? {
            rotateX: { ease: springSnappy() },
            rotateY: { ease: springSnappy() },
          }
        : {}),
    });

    const onMove = (e: MouseEvent) => {
      const rect = outer.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      anim.x(dx * strength);
      anim.y(dy * strength);
      anim.translateZ(14);
      if (enableTilt) {
        anim.rotateX(-dy * tilt);
        anim.rotateY(dx * tilt);
      }
    };

    // 扫描带：每次 mouseenter 播一次；hover 中反复移动不重播
    let sweep: JSAnimation | null = null;
    const onEnter = () => {
      inner.style.filter = "drop-shadow(0 0 14px var(--accent-glow))";
      const el = sweepRef.current;
      if (!el) return;
      sweep?.revert();
      sweep = animate(el, {
        translateX: ["-150%", "250%"],
        opacity: [0, 0.85, 0],
        duration: 680,
        ease: "inOutQuad",
      });
    };

    const onLeave = () => {
      anim.x(0);
      anim.y(0);
      anim.translateZ(0);
      if (enableTilt) {
        anim.rotateX(0);
        anim.rotateY(0);
      }
      inner.style.filter = "";
      if (sweepRef.current) sweepRef.current.style.opacity = "0";
    };

    outer.addEventListener("mousemove", onMove);
    outer.addEventListener("mouseenter", onEnter);
    outer.addEventListener("mouseleave", onLeave);
    return () => {
      outer.removeEventListener("mousemove", onMove);
      outer.removeEventListener("mouseenter", onEnter);
      outer.removeEventListener("mouseleave", onLeave);
      sweep?.revert();
      anim.revert();
      inner.style.filter = "";
    };
  }, [strength, tilt, enableTilt]);

  return (
    <span ref={outerRef} className={`inline-block [perspective:600px] ${className}`}>
      <span
        ref={innerRef}
        className="relative inline-block"
        style={{ transformStyle: "preserve-3d", transition: "filter 260ms ease" }}
      >
        {children}
        {/* 扫描带：内层加 relative 已建立包含块；blur 消解矩形边缘 */}
        <span
          ref={sweepRef}
          aria-hidden
          className="pointer-events-none absolute top-0 bottom-0 left-0 w-[38%]"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--accent-soft), transparent)",
            filter: "blur(3px)",
            transform: "translateX(-150%)",
            opacity: 0,
            willChange: "transform, opacity",
          }}
        />
      </span>
    </span>
  );
}
