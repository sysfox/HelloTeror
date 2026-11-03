"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Check } from "lucide-react";
import { animate, prefersReducedMotion } from "@/lib/anime";
import { useT } from "@/contexts/LocaleContext";

/**
 * 终端命令块（VOID PROTOCOL / CRT 磷光终端）：
 *  - 多行终端会话（whoami / cat about.md / ls skills/ / status --now）
 *  - 语法高亮：prompt(accent) / 命令(primary) / 输出(secondary) / 状态(amber)
 *  - 逐行逐字打字机：行间 250ms 停顿，字符间 38~60ms 随机
 *  - 闪烁块光标（.terminal-cursor）跟随当前打字位置，完成后停在末尾
 *  - CRT 扫描线覆盖层 + 暗角 + 极慢下移的扫描纹理（持续呼吸感）
 *  - HUD 标题栏：三枚信号色方点 + 会话标识 + 复制按钮
 *  - reduced-motion：直接显示完整会话、无打字机、无扫描线漂移
 *
 * 由父级传入 startDelay 控制打字开始时机（与 Hero 入场时序串联）。
 * props 与旧版完全一致（startDelay / className）。
 */

type Line =
  | { type: "prompt"; command: string }
  | { type: "output"; text: string; accent?: boolean }
  | { type: "blank" };

const PROMPT_PREFIX = "~/teror-fox $ ";

type RenderedLine = {
  type: "prompt" | "output" | "blank";
  typed: string;
  accent?: boolean;
};

/** 扫描线纹理：1px 亮线 + 3px 间隔，1 个周期 4px（背景位移循环用） */
const SCANLINE_BG =
  "repeating-linear-gradient(180deg, rgba(90,242,255,0.055) 0px, rgba(90,242,255,0.055) 1px, transparent 1px, transparent 4px)";

export function TerminalBlock({
  startDelay = 0,
  className = "",
}: {
  startDelay?: number;
  className?: string;
}) {
  const t = useT();
  const [lines, setLines] = useState<RenderedLine[]>([]);
  const [copied, setCopied] = useState(false);
  const timersRef = useRef<number[]>([]);
  const crtRef = useRef<HTMLDivElement>(null);

  // 会话内容随语言变化：命令本身属于"代码"不翻译，只翻译输出行。
  // session 作为下方 effect 的依赖 → 切换语言时重播打字机，
  // 而不是把新语言的行追加到旧语言的输出后面。
  const session = useMemo<Line[]>(() => {
    const now = new Date();
    const stamp = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}`;
    return [
      { type: "prompt", command: "whoami" },
      { type: "output", text: t.terminal.whoami },
      { type: "blank" },
      { type: "prompt", command: "cat about.md" },
      { type: "output", text: t.terminal.aboutHeading },
      { type: "output", text: t.terminal.aboutTagline },
      { type: "blank" },
      { type: "prompt", command: "ls skills/" },
      { type: "output", text: t.terminal.skills },
      { type: "blank" },
      { type: "prompt", command: "status --now" },
      {
        type: "output",
        text: `● ${t.terminal.statusOnline} · UTC+8 · ${stamp}`,
        accent: true,
      },
    ];
  }, [t]);

  /** 复制用完整文本（含 prompt 前缀） */
  const fullText = useMemo(
    () =>
      session
        .map((l) => {
          if (l.type === "prompt") return `${PROMPT_PREFIX}${l.command}`;
          if (l.type === "output") return l.text;
          return "";
        })
        .join("\n"),
    [session]
  );

  // CRT 扫描纹理极慢下移：只改 background-position，不动布局；
  // 4px 周期循环，首尾无缝，避免可见跳变。
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = crtRef.current;
    if (!el) return;

    const proxy = { p: 0 };
    const a = animate(proxy, {
      p: 1,
      duration: 6000,
      loop: true,
      ease: "linear",
      onUpdate: () => {
        el.style.backgroundPositionY = `${proxy.p * 4}px`;
      },
    });
    return () => {
      a.revert();
    };
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    timers.length = 0;

    // 语言切换导致 effect 重跑时清空已打字内容，否则新旧语言的行会叠加。
    // 打字机本质是"effect 驱动的时间序列"，同步置初态是刻意为之。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLines([]);

    if (prefersReducedMotion()) {
      // reduced-motion 兜底：直接渲染完整会话
      const full: RenderedLine[] = session.map((l) => {
        if (l.type === "prompt") return { type: "prompt", typed: l.command };
        if (l.type === "output")
          return { type: "output", typed: l.text, accent: l.accent };
        return { type: "blank", typed: "" };
      });
      setLines(full);
      return;
    }

    // 逐行逐字打字机
    let lineIdx = 0;

    const startT = window.setTimeout(() => {
      const processLine = () => {
        if (lineIdx >= session.length) {
          return;
        }
        const line = session[lineIdx];

        if (line.type === "blank") {
          setLines((prev) => [...prev, { type: "blank", typed: "" }]);
          lineIdx++;
          timers.push(window.setTimeout(processLine, 120));
          return;
        }

        // 初始化当前行（typed=""）
        const initial: RenderedLine =
          line.type === "prompt"
            ? { type: "prompt", typed: "" }
            : { type: "output", typed: "", accent: line.accent };
        setLines((prev) => [...prev, initial]);

        const fullText = line.type === "prompt" ? line.command : line.text;
        let charIdx = 0;

        const typeChar = () => {
          if (charIdx >= fullText.length) {
            // 当前行打完，停顿后处理下一行
            lineIdx++;
            timers.push(window.setTimeout(processLine, 250));
            return;
          }
          charIdx++;
          const typedSlice = fullText.slice(0, charIdx);
          setLines((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            next[next.length - 1] = { ...last, typed: typedSlice };
            return next;
          });
          const dt = 38 + Math.random() * 22;
          timers.push(window.setTimeout(typeChar, dt));
        };
        typeChar();
      };
      processLine();
    }, startDelay);
    timers.push(startT);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.length = 0;
    };
  }, [startDelay, session]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard 不可用时静默 */
    }
  };

  return (
    <div
      className={`relative rounded-lg overflow-hidden theme-transition ${className}`}
      style={{
        background: "var(--terminal-bg, #050810)",
        border: "1px solid var(--border-subtle)",
        boxShadow:
          "var(--shadow-card), inset 0 0 70px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(90,242,255,0.04)",
      }}
    >
      {/* 标题栏：信号色方点 + 会话标识 + 复制按钮 */}
      <div
        className="relative z-[2] flex items-center gap-2 px-3 h-9 border-b"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--surface)",
        }}
      >
        <span
          className="w-1.5 h-1.5"
          style={{ background: "var(--accent, #5af2ff)" }}
        />
        <span
          className="w-1.5 h-1.5"
          style={{ background: "var(--accent-3, #ffc46b)" }}
        />
        <span
          className="w-1.5 h-1.5"
          style={{ background: "var(--accent-2, #ff3ec9)" }}
        />
        <span
          className="ml-2 text-[10px] font-mono uppercase tabular-nums"
          style={{ color: "var(--text-tertiary)", letterSpacing: "0.16em" }}
        >
          TF://TERMINAL — SESSION 0x7F
        </span>
        <button
          type="button"
          onClick={copy}
          className="ml-auto inline-flex items-center justify-center w-7 h-7 rounded-sm transition-colors hover:bg-[var(--surface-hover)]"
          style={{ color: "var(--text-tertiary)" }}
          aria-label={t.a11y.copyTerminal}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
      </div>

      {/* 内容：逐行渲染 + 语法高亮 */}
      <div
        className="relative z-[1] px-3 py-3 text-[13px] sm:text-[14px] font-mono leading-relaxed whitespace-pre-wrap break-words"
        style={{
          color: "var(--text-secondary)",
          minHeight: "13rem",
          textShadow: "0 0 12px rgba(90,242,255,0.08)",
        }}
      >
        {lines.map((line, i) => {
          const isLast = i === lines.length - 1;
          if (line.type === "blank") {
            return <div key={i} className="h-[1.4em]" />;
          }
          if (line.type === "prompt") {
            return (
              <div key={i}>
                <span style={{ color: "var(--accent, #5af2ff)" }}>
                  {PROMPT_PREFIX}
                </span>
                <span style={{ color: "var(--text-primary)" }}>{line.typed}</span>
                {isLast && (
                  <span
                    className="terminal-cursor"
                    style={{
                      color: "var(--accent, #5af2ff)",
                      textShadow: "0 0 10px var(--accent-glow)",
                    }}
                    aria-hidden
                  >
                    ▋
                  </span>
                )}
              </div>
            );
          }
          // output 行
          return (
            <div key={i}>
              <span
                style={{
                  color: line.accent
                    ? "var(--accent-3, #ffc46b)"
                    : "var(--text-secondary)",
                  textShadow: line.accent
                    ? "0 0 14px rgba(255,196,107,0.35)"
                    : undefined,
                }}
              >
                {line.typed}
              </span>
              {isLast && (
                <span
                  className="terminal-cursor"
                  style={{
                    color: "var(--accent, #5af2ff)",
                    textShadow: "0 0 10px var(--accent-glow)",
                  }}
                  aria-hidden
                >
                  ▋
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* CRT 扫描线 + 暗角：覆盖整块，不拦截交互 */}
      <div
        ref={crtRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[3]"
        style={{ backgroundImage: SCANLINE_BG, opacity: 0.9 }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[3]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 68%, rgba(0,0,0,0.26) 100%)",
        }}
      />
    </div>
  );
}
