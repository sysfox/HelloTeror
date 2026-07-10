"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  createAnimatable,
  springSnappy,
  prefersReducedMotion,
} from "@/lib/anime";

/**
 * 磁吸 + 3D 倾斜按钮：双层 span 包裹。
 *  - 外层：perspective 容器
 *  - 内层：createAnimatable 注册 x/y/rotateX/rotateY，spring 缓动跟随光标
 * 鼠标在元素上方时，内层向光标方向位移并做 3D 倾斜；离开时弹回原位。
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

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const anim = createAnimatable(inner, {
      x: { ease: springSnappy() },
      y: { ease: springSnappy() },
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
      if (enableTilt) {
        anim.rotateX(-dy * tilt);
        anim.rotateY(dx * tilt);
      }
    };

    const onLeave = () => {
      anim.x(0);
      anim.y(0);
      if (enableTilt) {
        anim.rotateX(0);
        anim.rotateY(0);
      }
    };

    outer.addEventListener("mousemove", onMove);
    outer.addEventListener("mouseleave", onLeave);
    return () => {
      outer.removeEventListener("mousemove", onMove);
      outer.removeEventListener("mouseleave", onLeave);
      anim.revert();
    };
  }, [strength, tilt, enableTilt]);

  return (
    <span ref={outerRef} className={`inline-block [perspective:600px] ${className}`}>
      <span ref={innerRef} className="inline-block preserve-3d">
        {children}
      </span>
    </span>
  );
}
