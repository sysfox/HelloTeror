"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
} from "react";
import { animate, EASE, prefersReducedMotion } from "@/lib/anime";

/**
 * 字符 scramble 洗牌入场：每个字符先在随机字符集中快速洗牌，
 * 随进度收敛到目标字符定格（decode / 矩阵风格）。
 *
 * 与 AnimeText（逐字位移+模糊）的区别：ScrambleText 的视觉重点是
 * 「字符内容本身的随机变化」，更适合做主标题的"解码"仪式感。
 * KineticLoader 用 AnimeText 式逐字，Hero 主标题用 ScrambleText，
 * 两者视觉形态明确区分，避免重复。
 *
 * 进度追踪：用代理对象 { p: 0→1 } 驱动 scramble（值域确定 0~1），
 * 不依赖 animation.progress（避免不同运行时下 progress 值域/回调时机差异
 * 导致定格失败）。onComplete 强制定格兜底，确保动画结束时字符一定是目标。
 *
 * FOUC：父级 anime-init-children 置 opacity:0，SSR 渲染目标字符但不可见。
 * reduced-motion：跳过动画，CSS 兜底直接显示目标字符。
 * 可中断：保留每字符 animation 引用，cleanup 时 pause。
 */
const SCRAMBLE_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/<>{}[]#$%&*+";

type ScrambleTextProps = {
  text: string;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  /** 字符间错峰（ms） */
  staggerMs?: number;
  /** 整体起始延迟（ms） */
  delay?: number;
  /** 错峰起点 */
  from?: "first" | "center" | "last" | "random";
  /** 单字符时长（ms） */
  duration?: number;
  /** 洗牌相位占比（0~1），剩余时间定格到目标 */
  scrambleRatio?: number;
};

/** 按 from 策略计算字符 i 在错峰序列中的位置（0=最先） */
function orderPos(i: number, total: number, from: string): number {
  if (from === "last") return total - 1 - i;
  if (from === "center") {
    const center = (total - 1) / 2;
    return Math.abs(i - center);
  }
  return i; // first / random（random 视觉差异小，按 first 处理）
}

export function ScrambleText({
  text,
  as,
  className = "",
  style,
  staggerMs = 40,
  delay = 0,
  from = "first",
  duration = 900,
  scrambleRatio = 0.7,
}: ScrambleTextProps) {
  const Tag = (as ?? "span") as ElementType;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;

    const chars = Array.from(el.querySelectorAll<HTMLElement>("[data-char]"));
    if (!chars.length) return;

    const anims: ReturnType<typeof animate>[] = [];
    const total = chars.length;

    chars.forEach((ch, i) => {
      const target = ch.dataset.target ?? "";
      const d = delay + orderPos(i, total, from) * staggerMs;

      // 代理对象驱动 scramble 进度（p: 0→1，值域确定）
      const proxy = { p: 0 };
      const a = animate(proxy, {
        p: 1,
        duration,
        delay: d,
        ease: EASE.expo,
        onUpdate: () => {
          if (proxy.p < scrambleRatio) {
            ch.textContent =
              SCRAMBLE_CHARS[
                Math.floor(Math.random() * SCRAMBLE_CHARS.length)
              ];
          } else {
            ch.textContent = target;
          }
        },
        onComplete: () => {
          ch.textContent = target;
        },
      });
      anims.push(a);

      // 字符自身 opacity + 位移（独立 animate，与 scramble 同 delay/duration 同步）
      const b = animate(ch, {
        opacity: [0, 1],
        translateY: [18, 0],
        duration,
        delay: d,
        ease: EASE.expo,
      });
      anims.push(b);
    });

    return () => anims.forEach((a) => a.pause());
  }, [text, staggerMs, delay, from, duration, scrambleRatio]);

  return (
    <Tag
      ref={ref}
      className={`anime-init-children ${className}`}
      style={style}
      aria-label={text}
    >
      {Array.from(text).map((ch, i) => {
        const display = ch === " " ? "\u00A0" : ch;
        return (
          <span
            key={i}
            data-char
            data-target={display}
            aria-hidden="true"
            className="inline-block whitespace-pre"
            style={{ willChange: "opacity, transform" }}
          >
            {display}
          </span>
        );
      })}
    </Tag>
  );
}
