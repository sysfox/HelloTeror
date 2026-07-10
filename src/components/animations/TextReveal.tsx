"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * 文字遮罩揭示：父容器 overflow:hidden 裁切，
 * 内层文字从 translateY(110%) 滑入到 0，配合 opacity 渐显。
 * 进入视口时触发，一次性触发后保持显示。
 */
type TextRevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** 触发阈值，0~1，越大越晚触发 */
  threshold?: number;
  /** 入场延迟（ms），用于多行错峰 */
  delay?: number;
  style?: React.CSSProperties;
};

export function TextReveal({
  children,
  as,
  className = "",
  threshold = 0.2,
  delay = 0,
  style,
}: TextRevealProps) {
  const Tag = (as ?? "span") as ElementType;
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 尊重减少动效偏好：异步直接显示
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const raf = requestAnimationFrame(() => setRevealed(true));
      return () => cancelAnimationFrame(raf);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
          }
        });
      },
      { threshold, rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <Tag
      ref={ref}
      className={`text-mask-reveal ${revealed ? "is-revealed" : ""} ${className}`}
      style={style}
    >
      <span
        className="text-mask-reveal__inner"
        style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      >
        {children}
      </span>
    </Tag>
  );
}
