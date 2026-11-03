import type { ReactNode } from "react";

/**
 * 内容面板（简化版）：一层细边框 + 半透明表面，不再叠加 HUD 头、
 * 四角括号、扫描线或悬停辉光。depth 仅用于保留原有的轻微 Z 分层。
 */
type DossierPanelProps = {
  children: ReactNode;
  /** Z 轴抬升（px），默认 0 */
  depth?: number;
  className?: string;
  bodyClassName?: string;
};

export function DossierPanel({
  children,
  depth = 0,
  className = "",
  bodyClassName = "relative p-4 sm:p-5",
}: DossierPanelProps) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        transform: depth ? `translateZ(${depth}px)` : undefined,
      }}
    >
      <div
        className="relative flex h-full flex-col overflow-hidden border"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--surface)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className={bodyClassName}>{children}</div>
      </div>
    </div>
  );
}
