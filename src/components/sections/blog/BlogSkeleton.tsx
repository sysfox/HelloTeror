"use client";

import type { CSSProperties } from "react";

/**
 * 归档加载骨架：脊线 + 幽灵行，几何与真实记录一致，避免布局跳变。
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

export function BlogSkeleton() {
  const rowStyle: CSSProperties = {
    borderColor: "var(--border-subtle)",
    background: "var(--surface)",
  };

  return (
    <div className="relative" aria-hidden>
      <span
        className="pointer-events-none absolute bottom-2 left-[12px] top-2 w-px sm:left-[16px]"
        style={{ background: "var(--border-subtle)" }}
      />
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="relative pl-8 sm:pl-10">
            <span
              className="absolute left-[8px] top-[18px] h-[9px] w-[9px] rotate-45 border sm:left-[12px]"
              style={{ borderColor: "var(--border-strong)" }}
            />
            <div className="border px-4 py-3 sm:px-5 sm:py-3.5" style={rowStyle}>
              <div className="flex items-center gap-2.5">
                <Bar width="30px" height={8} />
                <Bar width="58px" height={8} />
                <Bar width="40px" height={12} />
              </div>
              <div className="mt-2.5">
                <Bar width={`${48 + ((i * 13) % 38)}%`} height={12} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
