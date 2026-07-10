"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Check } from "lucide-react";
import { prefersReducedMotion } from "@/lib/anime";

/**
 * 终端命令块（animejs.com `npm i animejs` 的对应物）：
 *  - 打字机逐字输出 `~ whoami` / `~ cat role.txt` 及其结果
 *  - 闪烁光标（CSS .terminal-cursor）在打字期间显示，完成即停
 *  - 标题栏三色圆点 + 复制按钮（复制完整输出）
 *  - 同心圆角：外层 rounded-xl，标题栏/内容内嵌
 *  - reduced-motion：直接显示完整输出，无打字机
 *
 * 由父级传入 startDelay 控制打字开始时机（与 Hero 入场时序串联）。
 */
type Line = { prompt: string; output: string };

const LINES: Line[] = [
  { prompt: "whoami", output: "teror-fox" },
  { prompt: "cat role.txt", output: "Student && Developer" },
];

const FULL_TEXT = LINES.map((l) => `~ ${l.prompt}\n${l.output}`).join("\n");

export function TerminalBlock({
  startDelay = 0,
  className = "",
}: {
  startDelay?: number;
  className?: string;
}) {
  const [typed, setTyped] = useState<string>("");
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    timers.length = 0;

    if (prefersReducedMotion()) {
      setTyped(FULL_TEXT);
      setDone(true);
      return;
    }

    // 展开为字符序列（含换行）
    const seq: string[] = [];
    LINES.forEach((l) => {
      `~ ${l.prompt}`.split("").forEach((c) => seq.push(c));
      seq.push("\n");
      l.output.split("").forEach((c) => seq.push(c));
      seq.push("\n");
    });

    let i = 0;
    const startT = window.setTimeout(() => {
      const tick = () => {
        if (i >= seq.length) {
          setDone(true);
          return;
        }
        i++;
        setTyped(seq.slice(0, i).join(""));
        const ch = seq[i - 1];
        const dt = ch === "\n" ? 170 : 40 + Math.random() * 28;
        timers.push(window.setTimeout(tick, dt));
      };
      tick();
    }, startDelay);
    timers.push(startT);

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers.length = 0;
    };
  }, [startDelay]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(FULL_TEXT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard 不可用时静默 */
    }
  };

  return (
    <div
      className={`relative rounded-xl overflow-hidden theme-transition ${className}`}
      style={{
        background: "var(--terminal-bg)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* 标题栏：三色圆点 + 标题 + 复制按钮 */}
      <div
        className="flex items-center gap-2 px-3 h-9 border-b"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f56" }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ffbd2e" }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#27c93f" }} />
        <span
          className="ml-2 text-[11px] font-mono tabular-nums"
          style={{ color: "var(--text-tertiary)" }}
        >
          ~/teror-fox — zsh
        </span>
        <button
          type="button"
          onClick={copy}
          className="ml-auto inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors hover:bg-[var(--surface-hover)]"
          style={{ color: "var(--text-tertiary)" }}
          aria-label="Copy terminal output"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
      </div>
      {/* 内容：打字机输出 + 光标 */}
      <pre
        className="px-3 py-3 text-[12px] sm:text-[13px] font-mono leading-relaxed whitespace-pre-wrap break-words"
        style={{ color: "var(--text-secondary)", minHeight: "5.5rem" }}
      >
        {typed}
        {!done && (
          <span
            className="terminal-cursor"
            style={{ color: "var(--accent)" }}
            aria-hidden
          >
            ▋
          </span>
        )}
      </pre>
    </div>
  );
}
