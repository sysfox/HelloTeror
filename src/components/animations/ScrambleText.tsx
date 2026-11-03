"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
} from "react";
import {
  animate,
  EASE,
  prefersReducedMotion,
  type JSAnimation,
} from "@/lib/anime";

/**
 * 字符 scramble 洗牌入场（已停用）。Hero 姓名改用干净的 AnimeText 纵深入场，
 * 因为随机字形切换会被读成「字体损坏」。本文件暂无消费者，保留仅作参考。
 *
 * 字符 scramble 洗牌入场：每个字符先在十六进制/二进制字形集中快速洗牌，
 * 随进度收敛到目标字符定格（VOID PROTOCOL 的「信号解码」仪式）。
 *
 * 与 AnimeText（逐字位移+模糊+纵深）的区别：ScrambleText 的视觉重点
 * 是「字符内容本身的随机变化」；该效果已被判定为字体损坏感，Hero 已改用 AnimeText。
 *
 * accent flicker：洗牌期间字符临时切到磷光青并加辉光，定格瞬间清空 inline
 * color/textShadow 交还给继承色 —— 颜色只写两次（开始/结束），不是逐帧写，
 * 避免大量 style 写入触发重排。
 *
 * 进度追踪：用代理对象 { p: 0→1 } 驱动 scramble（值域确定），不依赖
 * animation.progress（不同运行时下值域/回调时机有差异）。onComplete 强制
 * 定格兜底，确保动画结束时字符一定是目标。
 *
 * FOUC：父级 anime-init-children 置 opacity:0，SSR 渲染目标字符但不可见。
 * reduced-motion：跳过动画，CSS 兜底直接显示目标字符。
 */
const SCRAMBLE_CHARS = "0123456789ABCDEF01<>[]{}#$%&*+=-";

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

    const anims: JSAnimation[] = [];
    const total = chars.length;

    chars.forEach((ch, i) => {
      const target = ch.dataset.target ?? "";
      const d = delay + orderPos(i, total, from) * staggerMs;

      // 洗牌相位：accent 色 + 辉光，定格后交还继承色（只写两次）
      ch.style.color = "var(--accent, #5af2ff)";
      ch.style.textShadow = "0 0 14px var(--accent-glow, rgba(90,242,255,0.35))";

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
            ch.style.color = "";
            ch.style.textShadow = "";
          }
        },
        onComplete: () => {
          ch.textContent = target;
          ch.style.color = "";
          ch.style.textShadow = "";
        },
      });
      anims.push(a);

      // 字符自身 opacity + 纵深 + 位移（独立 animate，与 scramble 同 delay/duration 同步）
      const b = animate(ch, {
        opacity: [0, 1],
        translateY: [18, 0],
        translateZ: [40, 0],
        duration,
        delay: d,
        ease: EASE.expo,
      });
      anims.push(b);
    });

    return () => {
      // pause 而非 revert：scramble 已把 textContent 收敛到目标，
      // revert 会撤掉 opacity 终态让字符退回 CSS 隐态；这里只需停掉计时器。
      anims.forEach((a) => a.pause());
      chars.forEach((ch) => {
        ch.style.color = "";
        ch.style.textShadow = "";
      });
    };
  }, [text, staggerMs, delay, from, duration, scrambleRatio]);

  return (
    <Tag
      ref={ref}
      className={`anime-init-children ${className}`}
      style={{ perspective: "1000px", ...style }}
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
