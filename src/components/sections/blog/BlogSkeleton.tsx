"use client";

import type { CSSProperties } from "react";

/**
 * 归档加载骨架：几何与真实列表一致，避免布局跳变。
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
    <div className="flex flex-col gap-2.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="border px-4 py-3 sm:px-5 sm:py-3.5" style={rowStyle}>
          <div className="flex items-center gap-2.5">
            <Bar width="58px" height={8} />
            <Bar width="40px" height={8} />
          </div>
          <div className="mt-2.5">
            <Bar width={`${48 + ((i * 13) % 38)}%`} height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}
