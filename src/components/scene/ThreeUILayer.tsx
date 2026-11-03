"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { usePage, type PageId } from "@/contexts/PageContext";
import { useTheme, type Theme } from "@/contexts/ThemeContext";
import { SCENE_MOODS } from "./contracts";
import { usePrefersReducedMotion } from "./useSceneTelemetry";

/**
 * ThreeUI 强调层：每个页面叠一层现成的 shader 背景，作为 3D 场景的底色。
 *
 * 组件筛选（关键）：只选**资源自包含**的实现。
 *  - OrbitalSphere / DotMatrix / RibbonField / StreamConvergence / BellField /
 *    EmeraldHorizon 都是内联 shader + 自己创建的 canvas，不请求任何外部文件。
 *  - @designcodeio/threeui 的 ConstellationField / DataField / NebulaBackground
 *    等 Neuform 系列是 iframe + srcDoc，内部会拉 cdn.tailwindcss.com、GSAP、
 *    Google Fonts 和 Supabase 图片。虽然也能跑，但会给站点引入不可控的第三方
 *    请求，离线/隐私/CSP 都会出问题，因此**刻意不用**。
 *
 * 层级：本层在 VgpuField / ThreeField 之下（DOM 先渲染），
 * 上层画布带透明通道，强调层从体积星云/线框场景里透出来。
 *
 * 一次只挂一个页面；切页时保留旧层 620ms 做交叉淡出，之后卸载。
 * 所有组件都走 next/dynamic + ssr:false，避免 ThreeUI 在服务端被求值。
 */

const OrbitalAccent = dynamic(
  () =>
    import("@designcodeio/threeui/components/OrbitalSphereBackground").then(
      (mod) => mod.OrbitalSphereBackground
    ),
  { ssr: false }
);

const StreamAccent = dynamic(
  () =>
    import("@designcodeio/threeui/components/StreamConvergenceBackground").then(
      (mod) => mod.StreamConvergenceBackground
    ),
  { ssr: false }
);

const DotMatrixAccent = dynamic(
  () =>
    import("@designcodeio/threeui/components/DotMatrixBackground").then(
      (mod) => mod.DotMatrixBackground
    ),
  { ssr: false }
);

const RibbonAccent = dynamic(
  () =>
    import("@designcodeio/threeui/components/RibbonFieldBackground").then(
      (mod) => mod.RibbonFieldBackground
    ),
  { ssr: false }
);

const BellAccent = dynamic(
  () =>
    import("@designcodeio/threeui/components/BellFieldBackground").then(
      (mod) => mod.BellFieldBackground
    ),
  { ssr: false }
);

const EmeraldAccent = dynamic(
  () =>
    import("@designcodeio/threeui/components/EmeraldHorizonBackground").then(
      (mod) => mod.EmeraldHorizonBackground
    ),
  { ssr: false }
);

/** 页面 → ThreeUI 组件 + 参数。hue 用来把组件自带的冷色系扳到当前 mood 的色相。 */
function AccentContent({ page, theme }: { page: PageId; theme: Theme }) {
  const light = theme === "light";

  switch (page) {
    case "home":
      // 轨道球：青/紫粒子，与 home 的 accent/accent2 同族
      return (
        <OrbitalAccent
          speed={0.55}
          particleSize={0.014}
          particleOpacity={0.5}
          orbitOpacity={0.16}
          scale={1.08}
          haloOpacity={0.12}
          hue={light ? 190 : 0}
        />
      );
    case "about":
      // 汇聚流：紫罗兰/靛蓝，贴合 about 的 #7c5cff
      return (
        <StreamAccent
          speed={0.5}
          fidelity={0.45}
          scale={1.1}
          brightness={0.9}
          opacity={0.8}
          hue={light ? 190 : 0}
          saturation={0.9}
        />
      );
    case "tech":
      // 点阵网格：技术页的"HUD 标尺"底纹
      return (
        <DotMatrixAccent
          speed={0.55}
          gridScale={72}
          mouseAmount={0}
          pulseSpeed={0.22}
          radius={0.2}
          opacity={0.24}
          hue={light ? 190 : 0}
        />
      );
    case "stats":
      // 丝带场：色相扳向琥珀/洋红，对应 stats 的 #ffc46b / #ff3ec9
      return (
        <RibbonAccent
          speed={0.45}
          pointerAmount={0}
          smoothing={0.04}
          brightness={0.85}
          opacity={0.8}
          hue={light ? 0 : 140}
          saturation={1.12}
        />
      );
    case "projects":
      // 余烬场：色相扳向洋红，对应 projects 的 #ff3ec9
      return (
        <BellAccent
          speed={0.6}
          pointerAmount={0}
          emberAmount={0.8}
          brightness={0.9}
          opacity={0.75}
          hue={light ? 0 : 300}
          saturation={1.15}
        />
      );
    case "blog":
      // 绿松石地平线：blog 的 accent 本来就是绿色
      return (
        <EmeraldAccent
          speed={0.42}
          waveScale={0.8}
          variation={0.9}
          glow={1.05}
          vignette={1}
          hue={0}
        />
      );
  }
}

function AccentLayer({
  page,
  phase,
  theme,
}: {
  page: PageId;
  phase: "in" | "out";
  theme: Theme;
}) {
  const mood = SCENE_MOODS[page];
  // 首页最强，内容页收敛；整体压得比较低，避免 shader 抢正文对比度。
  // （初版 0.2+0.32 在真实浏览器里过亮，这里下调约 35%。）
  // 真实浏览器截图里初版仍然过亮（尤其 light 下是灰色圆斑）。
  // 再降一档：暗色保持 home 的戏剧性，内容页明显收敛；亮色只留极淡的底纹。
  const opacity =
    theme === "dark" ? 0.07 + mood.intensity * 0.15 : 0.03 + mood.intensity * 0.025;

  const style = {
    "--scene-ui-opacity": String(opacity),
    mixBlendMode: theme === "dark" ? "screen" : "multiply",
    // 边缘必须淡出：不透明 shader 的方框感会破坏“无限深空”的错觉
    maskImage:
      "radial-gradient(88% 82% at 50% 46%, #000 0%, rgba(0,0,0,0.72) 52%, transparent 100%)",
    WebkitMaskImage:
      "radial-gradient(88% 82% at 50% 46%, #000 0%, rgba(0,0,0,0.72) 52%, transparent 100%)",
  } as CSSProperties;

  return (
    <div className="scene-ui-layer" data-phase={phase} style={style}>
      <AccentContent page={page} theme={theme} />
    </div>
  );
}

export function ThreeUILayer() {
  const { current } = usePage();
  const { theme } = useTheme();
  const reduced = usePrefersReducedMotion();

  // 退出层：切页后保留旧页面 620ms 交叉淡出
  const [previous, setPrevious] = useState<PageId | null>(null);
  const activeRef = useRef(current);

  useEffect(() => {
    const outgoing = activeRef.current;
    if (outgoing === current) return;
    activeRef.current = current;
    setPrevious(outgoing);
    const timer = window.setTimeout(() => setPrevious(null), 640);
    return () => window.clearTimeout(timer);
  }, [current]);

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {/* .scene-ui-layer 的 keyframes / ThreeUI 底色覆盖由 SceneRoot 统一注入 */}
      {previous && !reduced ? (
        <AccentLayer key={`out-${previous}`} page={previous} phase="out" theme={theme} />
      ) : null}
      <AccentLayer key={`in-${current}`} page={current} phase="in" theme={theme} />
    </div>
  );
}
