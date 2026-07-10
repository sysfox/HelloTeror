"use client";

import { useEffect, useState } from "react";

/**
 * 页面加载动画：苹果风格的极简加载条。
 * - 初次挂载时显示一条从屏幕中央向两侧展开的细线
 * - 进度走完后整体淡出消失
 * - 仅在首次加载时显示一次（ sessionStorage 防止刷新重复）
 */
export function PageLoader() {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<"expand" | "fill" | "fade">("expand");

  useEffect(() => {
    // 如果用户偏好减少动效，异步跳过
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const raf = requestAnimationFrame(() => setVisible(false));
      return () => cancelAnimationFrame(raf);
    }

    const t1 = setTimeout(() => setPhase("fill"), 350);
    const t2 = setTimeout(() => setPhase("fade"), 900);
    const t3 = setTimeout(() => setVisible(false), 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: phase === "fade" ? 0 : 1,
        transition: "opacity 600ms cubic-bezier(0.16,1,0.3,1)",
        pointerEvents: phase === "fade" ? "none" : "auto",
      }}
    >
      {/* 中央细线：从中间向两侧展开，然后填满 */}
      <div
        style={{
          position: "relative",
          width: phase === "expand" ? "0px" : "120px",
          height: "1px",
          background: "rgba(245,245,247,0.2)",
          transition: "width 700ms cubic-bezier(0.16,1,0.3,1)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: phase === "expand" ? "0%" : "100%",
            background:
              "linear-gradient(90deg, rgba(41,151,255,0) 0%, #2997ff 50%, rgba(255,255,255,0.9) 100%)",
            boxShadow: "0 0 8px rgba(41,151,255,0.6)",
            transition:
              "width 600ms cubic-bezier(0.65,0,0.35,1) 200ms",
          }}
        />
      </div>
    </div>
  );
}
