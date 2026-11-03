"use client";

// ThreeUI 组件的公共样式（.threeui-background 等）。只在这里引入一次，
// 避免每个动态组件各自带一份全局 CSS。
import "@designcodeio/threeui/style.css";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { usePage } from "@/contexts/PageContext";
import { useTheme, type Theme } from "@/contexts/ThemeContext";
import { SCENE_MOODS, type SceneMood } from "./contracts";
import {
  buildStarLayers,
  hexToRgba,
  SCENE_CSS,
} from "./scene-shaders";
import { usePrefersReducedMotion } from "./useSceneTelemetry";

/**
 * VOID PROTOCOL 持久 3D 场景层。
 *
 * 位置：page.tsx 的 isolate 容器内、内容之下（-z-10），不随 PageShell 重挂载，
 * 因此页面切换时场景连续存在，只做 mood 切换 —— 与旧 AuroraBackground 的
 * 持久层思路一致，但换成真正的纵深场景。
 *
 * 三层降级策略（任何一层失败都不会让页面空白）：
 *   1. CSS 渐变 + 确定性星点 + 网格：无条件渲染，永远在最底下；
 *   2. WebGPU（VgpuField）：存在 navigator.gpu 时优先尝试；
 *   3. WebGL（ThreeField）：WebGPU 不存在 / init / compile / device lost 失败时启用。
 * reduced-motion 直接停在 1，静态高对比布局，不创建任何 GPU 上下文。
 *
 * 场景层永远 pointer-events-none：输入由 useSceneTelemetry 在 window 上监听，
 * 避免 3D 层抢走正文的 hover / 点击。
 */

type SceneMode = "css" | "vgpu" | "three";

const VgpuField = dynamic(
  () => import("./VgpuField").then((mod) => mod.VgpuField),
  { ssr: false }
);
const ThreeField = dynamic(
  () => import("./ThreeField").then((mod) => mod.ThreeField),
  { ssr: false }
);

/** 纯 CSS 兜底：即使 JS / GPU 全部失败，也有一张符合 VOID 语言的静态背景 */
function SceneFallback({
  mood,
  theme,
  reduced,
}: {
  mood: SceneMood;
  theme: Theme;
  reduced: boolean;
}) {
  const starLayers = useMemo(() => buildStarLayers(theme), [theme]);
  const dark = theme === "dark";

  // 暗色：冷光晕 + 深空竖渐变；亮色：冷蓝墨水低透明度
  const backdrop = dark
    ? `radial-gradient(120% 92% at 50% 38%, ${hexToRgba(
        mood.accent,
        0.1
      )} 0%, transparent 56%), radial-gradient(90% 70% at 50% 64%, ${hexToRgba(
        mood.accent2,
        0.07
      )} 0%, transparent 62%), linear-gradient(180deg, #03040a 0%, #05070f 52%, #03040a 100%)`
    : `radial-gradient(120% 92% at 50% 38%, ${hexToRgba(
        mood.accent,
        0.09
      )} 0%, transparent 56%), radial-gradient(90% 70% at 50% 64%, ${hexToRgba(
        mood.accent2,
        0.05
      )} 0%, transparent 62%), linear-gradient(180deg, #eef2f8 0%, #e3e9f3 58%, #e9eef6 100%)`;

  const gridColor = hexToRgba(mood.accent, dark ? 0.05 : 0.09);
  const grid = `repeating-linear-gradient(0deg, transparent 0 39px, ${gridColor} 39px 40px), repeating-linear-gradient(90deg, transparent 0 39px, ${gridColor} 39px 40px)`;

  const glowStyle: CSSProperties = {
    position: "absolute",
    inset: "-6%",
    background: backdrop,
    opacity: dark ? 1 : 0.9,
    // 极慢漂移，让静态兜底也有“机械呼吸”；reduced-motion 下完全静止
    animation: reduced ? undefined : "scene-drift 30s ease-in-out infinite alternate",
  };

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <div style={glowStyle} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: starLayers,
          opacity: dark ? 0.9 : 0.55,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "-2px",
          backgroundImage: grid,
          opacity: dark ? 0.55 : 0.4,
          maskImage:
            "radial-gradient(78% 72% at 50% 46%, #000 0%, rgba(0,0,0,0.35) 62%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(78% 72% at 50% 46%, #000 0%, rgba(0,0,0,0.35) 62%, transparent 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: dark
            ? `radial-gradient(58% 46% at 50% 50%, ${hexToRgba(
                mood.accent,
                0.08
              )} 0%, transparent 70%)`
            : `radial-gradient(58% 46% at 50% 50%, ${hexToRgba(
                mood.accent,
                0.06
              )} 0%, transparent 70%)`,
        }}
      />
    </div>
  );
}

/** 最上层暗角：压住边缘，保证正文对比度 */
function SceneOverlay({ theme }: { theme: Theme }) {
  const dark = theme === "dark";
  return (
    <div
      className="absolute inset-0"
      aria-hidden="true"
      style={{
        background: dark
          ? "radial-gradient(120% 105% at 50% 50%, transparent 42%, rgba(0,0,0,0.5) 100%)"
          : "radial-gradient(120% 105% at 50% 50%, transparent 46%, rgba(16, 36, 66, 0.12) 100%)",
        mixBlendMode: "normal",
      }}
    />
  );
}

export function SceneRoot({ className = "" }: { className?: string }) {
  const { current } = usePage();
  const { theme } = useTheme();
  const reduced = usePrefersReducedMotion();

  const [mode, setMode] = useState<SceneMode>("css");
  // WebGPU 失败一次后不再重试；切主题/切页也不会回到 vgpu
  const [vgpuFailed, setVgpuFailed] = useState(false);

  const mood = SCENE_MOODS[current];

  // 能力探测必须放在 effect 里：服务端没有 navigator，且首帧先展示 CSS 兜底
  useEffect(() => {
    if (reduced) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode("css");
      return;
    }
    if (vgpuFailed) {
      setMode("three");
      return;
    }
    const hasWebGpu =
      typeof navigator !== "undefined" && Boolean(navigator.gpu);
    setMode(hasWebGpu ? "vgpu" : "three");
  }, [reduced, vgpuFailed]);

  const handleVgpuFail = useCallback(() => {
    setVgpuFailed(true);
    setMode("three");
  }, []);

  return (
    <div
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${className}`}
      style={{ opacity: theme === "dark" ? 0.18 : 0.14 }}
      aria-hidden="true"
    >
      <style>{SCENE_CSS}</style>

      {/* 1. 永远存在的 CSS 兜底 */}
      <SceneFallback mood={mood} theme={theme} reduced={reduced} />

      {/* 3. WebGPU 优先；失败自动切 WebGL */}
      {!reduced && mode === "vgpu" ? (
        <VgpuField onFail={handleVgpuFail} />
      ) : null}
      {!reduced && mode === "three" ? <ThreeField /> : null}

      {/* 3.5 移动端雾化衬底：只在窄屏生效，压暗 shader 光核以保证正文对比度 */}
      <div className="scene-scrim" aria-hidden="true" />

      {/* 4. 与后端无关的暗角叠层 */}
      <SceneOverlay theme={theme} />
    </div>
  );
}
