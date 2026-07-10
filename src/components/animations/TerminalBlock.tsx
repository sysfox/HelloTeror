"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Check } from "lucide-react";
import { prefersReducedMotion } from "@/lib/anime";

/**
 * 终端命令块（animejs.com 风格 + 语法高亮 + 逐行打字机）：
 *  - 多行终端会话（whoami / cat about.md / ls skills/ / status --now）
 *  - 语法高亮：prompt(accent) / 命令(primary) / 输出(secondary) / 状态(green)
 *  - 逐行逐字打字机：行间 250ms 停顿，字符间 38~60ms 随机
 *  - 闪烁光标（.terminal-cursor）跟随当前打字位置，完成后停在末尾
 *  - 标题栏三色圆点 + 复制按钮（复制完整会话）
 *  - 同心圆角：外层 rounded-xl，标题栏/内容内嵌
 *  - reduced-motion：直接显示完整会话，无打字机
 *
 * 由父级传入 startDelay 控制打字开始时机（与 Hero 入场时序串联）。
 */

type Line =
  | { type: "prompt"; command: string }
  | { type: "output"; text: string; accent?: boolean }
  | { type: "blank" };

const PROMPT_PREFIX = "~/teror-fox $ ";

const SESSION: Line[] = [
  { type: "prompt", command: "whoami" },
  { type: "output", text: "teror-fox" },
  { type: "blank" },
  { type: "prompt", command: "cat about.md" },
  { type: "output", text: "# Student && Developer" },
  { type: "output", text: "Fighting for the AI age" },
  { type: "blank" },
  { type: "prompt", command: "ls skills/" },
  { type: "output", text: "typescript/  nextjs/  animejs/  python/  rust/" },
  { type: "blank" },
  { type: "prompt", command: "status --now" },
  { type: "output", text: `● online · UTC+8 · ${new Date().getFullYear()}.${String(new Date().getMonth() + 1).padStart(2, '0')}`, accent: true },
];



/** 复制用完整文本（含 prompt 前缀） */
const FULL_TEXT = SESSION.map((l) => {
  if (l.type === "prompt") return `${PROMPT_PREFIX}${l.command}`;
  if (l.type === "output") return l.text;
  return "";
}).join("\n");

type RenderedLine = {
  type: "prompt" | "output" | "blank";
  typed: string;
  accent?: boolean;
};

export function TerminalBlock({
  startDelay = 0,
  className = "",
}: {
  startDelay?: number;
  className?: string;
}) {
  const [lines, setLines] = useState<RenderedLine[]>([]);
  const [copied, setCopied] = useState(false);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    timers.length = 0;

    if (prefersReducedMotion()) {
      // reduced-motion 兜底：直接渲染完整会话
      const full: RenderedLine[] = SESSION.map((l) => {
        if (l.type === "prompt") return { type: "prompt", typed: l.command };
        if (l.type === "output")
          return { type: "output", typed: l.text, accent: l.accent };
        return { type: "blank", typed: "" };
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLines(full);
      return;
    }

    // 逐行逐字打字机
    let lineIdx = 0;

    const startT = window.setTimeout(() => {
      const processLine = () => {
        if (lineIdx >= SESSION.length) {
          return;
        }
        const line = SESSION[lineIdx];

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
      {/* 内容：逐行渲染 + 语法高亮 */}
      <div
        className="px-3 py-3 text-[13px] sm:text-[14px] font-mono leading-relaxed whitespace-pre-wrap break-words"
        style={{ color: "var(--text-secondary)", minHeight: "13rem" }}
      >
        {lines.map((line, i) => {
          const isLast = i === lines.length - 1;
          if (line.type === "blank") {
            return <div key={i} className="h-[1.4em]" />;
          }
          if (line.type === "prompt") {
            return (
              <div key={i}>
                <span style={{ color: "var(--accent)" }}>{PROMPT_PREFIX}</span>
                <span style={{ color: "var(--text-primary)" }}>{line.typed}</span>
                {isLast && (
                  <span
                    className="terminal-cursor"
                    style={{ color: "var(--accent)" }}
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
                  color: line.accent ? "#28c840" : "var(--text-secondary)",
                }}
              >
                {line.typed}
              </span>
              {isLast && (
                <span
                  className="terminal-cursor"
                  style={{ color: "var(--accent)" }}
                  aria-hidden
                >
                  ▋
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
