"use client";

import type { CSSProperties } from "react";

/**
 * 加载骨架：形态与最终布局一致，避免数据到达时布局跳变。
 * 与真实视图共用同一套「窄屏用列表 / 宽屏用机库」的可见性规则。
 */
function Bar({ width, height = 10 }: { width: string; height?: number }) {
  return (
    <span
      className="block animate-pulse"
      style={{
        width,
        height,
        background: "var(--surface-strong)",
      }}
    />
  );
}

function HangarSkeleton() {
  return (
    <div
      className="relative hidden overflow-hidden md:block"
      style={{
        height: "clamp(250px, 34vh, 350px)",
        perspective: "1400px",
      }}
      aria-hidden
    >
      {[-1, 0, 1].map((offset) => {
        const abs = Math.abs(offset);
        const style: CSSProperties = {
          width: "clamp(240px, 30vw, 330px)",
          borderColor: "var(--border-subtle)",
          background: "var(--surface)",
          opacity: abs === 0 ? 1 : 0.45,
          zIndex: 10 - abs,
          transform: `translate(-50%, -50%) translate3d(${offset * 175}px, ${abs * 6}px, ${-abs * 165}px) rotateY(${-offset * 16}deg) scale(${1 - abs * 0.04})`,
        };
        return (
          <div
            key={offset}
            className="absolute left-1/2 top-1/2 flex h-full flex-col border px-4 py-3.5 sm:px-5"
            style={style}
          >
            <div className="flex items-center justify-between">
              <Bar width="44px" height={8} />
              <Bar width="28px" height={8} />
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <Bar width="38%" height={8} />
              <Bar width="66%" height={18} />
            </div>
            <div className="mt-3 flex flex-col gap-1.5">
              <Bar width="100%" height={8} />
              <Bar width="78%" height={8} />
            </div>
            <div className="mt-3 flex gap-1.5">
              <Bar width="54px" height={14} />
              <Bar width="44px" height={14} />
            </div>
            <div
              className="mt-auto grid grid-cols-3 gap-2 border-t pt-2"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <Bar width="100%" height={18} />
              <Bar width="100%" height={18} />
              <Bar width="100%" height={18} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex min-h-14 items-center gap-3 border px-3.5 py-2.5"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--surface)",
          }}
        >
          <Bar width="24px" height={8} />
          <span
            aria-hidden
            className="h-6 w-px shrink-0"
            style={{ background: "var(--border-strong)" }}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Bar width={`${42 + ((i * 17) % 34)}%`} height={10} />
            <span className="hidden md:block">
              <Bar width="78%" height={8} />
            </span>
          </div>
          <Bar width="56px" height={10} />
        </div>
      ))}
    </div>
  );
}

export function ProjectsSkeleton({ compact }: { compact: boolean }) {
  return (
    <>
      {!compact && <HangarSkeleton />}
      <div className={compact ? "block" : "md:hidden"}>
        <ListSkeleton />
      </div>
    </>
  );
}
