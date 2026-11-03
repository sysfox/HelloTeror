/**
 * 场景层的着色器源码与配色工具。
 *
 * 为什么 WGSL 是内联模板字符串而不是 .wgsl 文件：
 * 本项目没有配置 vgpu 的 webpack/turbopack loader，`import x from "./x.wgsl"`
 * 会在构建期被当成普通模块解析而失败。VgpuField 在客户端用
 * `prepareShader()` 在运行时反射一次，代价可以忽略。
 *
 * 这里只放纯函数与字符串，不触碰 window/navigator —— SceneRoot 虽然是
 * "use client"，但 Client Component 依然会在服务端预渲染，模块顶层访问浏览器
 * API 会直接让 SSR 崩掉。
 */

import type { Theme } from "@/contexts/ThemeContext";

/**
 * VOID PROTOCOL 全屏体积星云。
 * uniform 布局顺序有硬性要求：vec4 字段在前、f32 字段在后（std140 对齐），
 * 并保证结构体总大小（80 字节）是 16 的倍数。
 *
 * 已用 `npx vgpu check` 做过真实设备校验（validation.ok = true）。
 */
export const WGSL_NEBULA = `
struct Params {
  accent: vec4f,
  accent2: vec4f,
  resolution: vec4f,
  pointer: vec4f,
  time: f32,
  intensity: f32,
  pulse: f32,
  theme: f32,
};

@group(0) @binding(0) var<uniform> params: Params;

fn hash31(p0: vec3f) -> f32 {
  var p = fract(p0 * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

// 三线性插值的 3D value noise：比 simplex 便宜，星云纹理够用。
fn noise3(p: vec3f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);

  let n000 = hash31(i + vec3f(0.0, 0.0, 0.0));
  let n100 = hash31(i + vec3f(1.0, 0.0, 0.0));
  let n010 = hash31(i + vec3f(0.0, 1.0, 0.0));
  let n110 = hash31(i + vec3f(1.0, 1.0, 0.0));
  let n001 = hash31(i + vec3f(0.0, 0.0, 1.0));
  let n101 = hash31(i + vec3f(1.0, 0.0, 1.0));
  let n011 = hash31(i + vec3f(0.0, 1.0, 1.0));
  let n111 = hash31(i + vec3f(1.0, 1.0, 1.0));

  let nx00 = mix(n000, n100, u.x);
  let nx10 = mix(n010, n110, u.x);
  let nx01 = mix(n001, n101, u.x);
  let nx11 = mix(n011, n111, u.x);
  let nxy0 = mix(nx00, nx10, u.y);
  let nxy1 = mix(nx01, nx11, u.y);
  return mix(nxy0, nxy1, u.z);
}

fn fbm(p0: vec3f) -> f32 {
  var p = p0;
  var amp = 0.55;
  var sum = 0.0;
  for (var i = 0; i < 3; i = i + 1) {
    sum += amp * noise3(p);
    p = p * 2.02 + vec3f(9.7, 5.1, 13.3);
    amp *= 0.5;
  }
  return sum;
}

// 域扭曲只需要低频轮廓，2 个 octave 足够；每帧整屏要跑上千次，省一半成本。
fn fbm2(p0: vec3f) -> f32 {
  var p = p0;
  var amp = 0.6;
  var sum = 0.0;
  for (var i = 0; i < 2; i = i + 1) {
    sum += amp * noise3(p);
    p = p * 2.07 + vec3f(4.1, 8.3, 2.7);
    amp *= 0.5;
  }
  return sum;
}

// 域扭曲后的密度场：中心更浓，形成“能量核 + 外围丝状云”。
fn density(p: vec3f, t: f32) -> f32 {
  let warpx = fbm2(p * 0.85 + vec3f(t * 0.06, 0.0, 0.0));
  let warpz = fbm2(p * 0.85 + vec3f(5.3, -t * 0.045, 1.9));
  let warp = vec3f(warpx, warpz, warpx - warpz);
  let n = fbm(p * 1.25 + warp * 1.35);
  let core = exp(-dot(p, p) * 0.42);
  return clamp(n * 1.7, 0.0, 1.0) * (0.42 + core * 0.85);
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let res = max(params.resolution.xy, vec2f(1.0));
  let aspect = res.x / res.y;

  // effect() 的 uv 原点在左上；转成 -1..1 并修正宽高比
  let p = uv * 2.0 - vec2f(1.0);
  let q = vec2f(p.x * aspect, p.y);

  let t = params.time;
  let pulse = clamp(params.pulse, 0.0, 1.0);
  let intensity = clamp(params.intensity, 0.0, 1.0);
  let theme = clamp(params.theme, 0.0, 1.0);

  let accent = params.accent.rgb;
  let accent2 = params.accent2.rgb;

  // 相机沿 +Z 看入场景；指针轻微改变视线方向
  let ro = vec3f(0.0, 0.0, -3.6);
  let rd = normalize(vec3f(q + params.pointer.xy * 0.32, 1.75));

  var rgb = vec3f(0.0);
  var alpha = 0.0;
  var trans = 1.0;
  var travel = 0.0;

  // 20 步固定预算：每步约 56 次 hash（2×fbm2 + 1×fbm），整屏约 1120 次，
  // 集成显卡也能维持几十帧；步长随距离增大，20 步刚好走完体积中心。
  for (var i = 0; i < 20; i = i + 1) {
    let pos = ro + rd * travel;
    let d = density(pos, t);
    if (d > 0.004) {
      let core = exp(-dot(pos, pos) * 0.9);
      let band = 0.5 + 0.5 * sin(pos.x * 1.6 + pos.z * 1.1 + t * 0.22);
      let hue = mix(accent, accent2, clamp(band, 0.0, 1.0));
      let energy = d * (0.32 + core * 1.75 + pulse * 0.85) * (0.55 + intensity * 0.75);
      rgb += hue * energy * 0.26 * trans;
      alpha += energy * 0.13 * trans;
      trans *= exp(-d * 0.16);
    }
    // 步长随距离增大：远处用更少采样覆盖更多体积
    travel += 0.14 + travel * 0.028;
    // 已经足够不透明就不必继续采样（省掉穿过核心时的剩余步数）
    if (trans < 0.03) {
      break;
    }
  }

  // 解析核心辉光：比继续 ray-march 便宜得多
  let r = length(q);
  let coreGlow = exp(-r * 3.1) * (0.45 + intensity * 0.55 + pulse * 0.8);
  rgb += mix(accent, accent2, 0.35) * coreGlow * 0.62;
  alpha += coreGlow * 0.34;

  // 色差光环：R/B 采样点沿 x 轴错位，制造 chroma split
  let radius = 0.46 + sin(t * 0.55) * 0.015 + pulse * 0.05;
  let rimR = 1.0 - smoothstep(0.0, 0.02, abs(length(q + vec2f(0.007, 0.0)) - radius));
  let rimG = 1.0 - smoothstep(0.0, 0.02, abs(r - radius));
  let rimB = 1.0 - smoothstep(0.0, 0.02, abs(length(q - vec2f(0.007, 0.0)) - radius));
  let rim = vec3f(rimR, rimG, rimB);
  rgb += rim * mix(accent2, accent, 0.5) * 0.26 * (0.6 + pulse);
  alpha += (rimR + rimG + rimB) * 0.12;

  // 扫描线：用归一化 uv 而非像素行，避免不同分辨率下出现摩尔纹
  rgb *= 0.9 + 0.1 * sin(uv.y * 160.0 + t * 2.0);

  // 暗角
  let vig = 1.0 - smoothstep(0.45, 1.35, length(q));
  rgb *= mix(0.55, 1.0, vig);
  alpha *= mix(0.5, 1.0, vig);

  // 颗粒（亮色主题下会显脏，故只加在暗色）
  let grain = hash31(vec3f(floor(uv * res), floor(t * 24.0))) - 0.5;
  rgb += grain * 0.022 * (1.0 - theme);

  // 亮色主题：发光换成“墨雾”，alpha 合成时压暗背景
  if (theme > 0.5) {
    rgb = mix(rgb, vec3f(0.02, 0.05, 0.10) * (0.35 + alpha * 1.4), 0.72);
  }

  // 透明画布 + premultiplied alpha：让下层的 ThreeUI 强调层透出来
  let a = clamp(alpha, 0.0, 1.0);
  let color = clamp(rgb, vec3f(0.0), vec3f(1.0));
  return vec4f(color * a, a);
}
`;

/** 页面底色（与 REDESIGN.md 的 --background 保持一致，作为兜底渐变的基色） */
export const SCENE_BACKGROUND: Record<Theme, string> = {
  dark: "#03040a",
  light: "#e9eef6",
};

/** 星点基色：暗色主题用冷白，亮色主题用墨蓝（白点在浅底上不可见） */
export const SCENE_STAR_COLOR: Record<Theme, string> = {
  dark: "#e6f7ff",
  light: "#1b3550",
};

/** 解析 #rgb / #rrggbb → 0..1 的 rgb 分量 */
export function hexToRgb01(hex: string): [number, number, number] {
  let h = hex.trim().replace("#", "");
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  const value = Number.parseInt(h, 16);
  if (!Number.isFinite(value) || h.length !== 6) return [1, 1, 1];
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

/** vgpu 的 vec4f uniform 接受普通数组，这里补齐 alpha */
export function hexToVec4(
  hex: string,
  alpha = 1
): [number, number, number, number] {
  const [r, g, b] = hexToRgb01(hex);
  return [r, g, b, alpha];
}

/** 转成可直接写进 inline style 的 rgba() */
export function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb01(hex);
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(
    b * 255
  )}, ${alpha})`;
}

/**
 * 把强调色压深，供亮色主题的 WebGL 线框使用。
 * 浅底上直接用荧光青会糊成一片，必须换成“墨水色”才有对比度。
 */
export function themeAccent(hex: string, theme: Theme): string {
  if (theme === "dark") return hex;
  const [r, g, b] = hexToRgb01(hex);
  const mix = 0.42; // 与墨蓝 #08111f 混合
  const mr = 8 / 255;
  const mg = 17 / 255;
  const mb = 31 / 255;
  const toHex = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r * mix + mr * (1 - mix))}${toHex(
    g * mix + mg * (1 - mix)
  )}${toHex(b * mix + mb * (1 - mix))}`;
}

/**
 * 确定性伪随机（mulberry32）。
 * 场景里的星点/碎晶位置必须每次 SSR/CSR 都一致，否则 hydration mismatch，
 * 也会让客户端缓存刷新时画面跳动 —— 所以绝不能用 Math.random。
 */
export function createSeededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * CSS 兜底层用的星点：用数十层 radial-gradient 拼出单元素星空，
 * 比几十个 DOM 节点更省；服务端与客户端生成结果一致。
 */
export function buildStarLayers(theme: Theme, count = 64): string {
  const rand = createSeededRandom(20261103);
  const color = SCENE_STAR_COLOR[theme];
  const layers: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = (rand() * 100).toFixed(2);
    const y = (rand() * 100).toFixed(2);
    const radius = (0.6 + rand() * rand() * 1.8).toFixed(2);
    const alpha = (0.15 + rand() * 0.55).toFixed(2);
    layers.push(
      `radial-gradient(${radius}px ${radius}px at ${x}% ${y}%, ${hexToRgba(
        color,
        Number(alpha)
      )} 0%, transparent 100%)`
    );
  }
  return layers.join(", ");
}

/**
 * 场景层内部使用的 keyframes。
 * 不写进 globals.css 是因为该文件由设计系统 Agent 独占；
 * 用组件内 <style> 注入同样能做到作用域隔离（类名都带 scene-ui- / scene- 前缀）。
 */
export const SCENE_CSS = `
@keyframes scene-drift {
  from { transform: translate3d(-1.2%, -0.8%, 0) scale(1.02); }
  to   { transform: translate3d(1.2%, 0.8%, 0) scale(1.06); }
}
@keyframes scene-ui-in {
  from { opacity: 0; }
  to   { opacity: var(--scene-ui-opacity, 0.4); }
}
@keyframes scene-ui-out {
  from { opacity: var(--scene-ui-opacity, 0.4); }
  to   { opacity: 0; }
}
.scene-ui-layer {
  position: absolute;
  inset: 0;
  will-change: opacity;
}
.scene-ui-layer[data-phase="in"] {
  animation: scene-ui-in 620ms ease-out both;
}
.scene-ui-layer[data-phase="out"] {
  animation: scene-ui-out 620ms ease-in both;
  pointer-events: none;
}
/* ThreeUI 的默认底色会盖住下层场景，统一强制透明（!important 才能压过内联样式） */
.scene-ui-layer .threeui-background,
.scene-ui-layer .threeui-background canvas {
  background: transparent !important;
}
.scene-ui-layer iframe {
  background: transparent !important;
}
@media (prefers-reduced-motion: reduce) {
  .scene-ui-layer[data-phase="in"],
  .scene-ui-layer[data-phase="out"] {
    animation: none;
    opacity: var(--scene-ui-opacity, 0.4);
  }
}
/* 移动端压暗：窄屏下 shader 光核几乎铺满整屏，正文对比度会被吃掉。
   桌面端保持场景的存在感，小屏只保留一层"雾"作为内容衬底。 */
.scene-scrim {
  display: none;
}
@media (max-width: 767px) {
  .scene-scrim {
    display: block;
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-color: color-mix(in srgb, var(--background) 46%, transparent);
    background-image:
      radial-gradient(
        120% 85% at 50% 48%,
        color-mix(in srgb, var(--background) 58%, transparent) 0%,
        transparent 72%
      ),
      linear-gradient(
        180deg,
        var(--background) 0%,
        transparent 30%,
        transparent 68%,
        var(--background) 100%
      );
  }
}
`;
