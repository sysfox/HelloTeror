/**
 * Hero 背景「坐标标尺」装置（纯展示，无 hook）。
 *
 * 结构：网格底 → 舞台（perspective）→ 视差层 → 同心环 / 刻度环 / 双轴椭圆 /
 * 十字准星 / 扫描带。全部为装饰层，aria-hidden。
 *
 * 视差：HeroSection 在 section 根上写入 --hx / --hy（-1..1），本组件只消费，
 * 因此动画逻辑与 DOM 解耦；rAF 合并与清理都在 HeroSection 中。
 * reduced-motion / 触屏：本地 keyframes 在媒体查询里关闭（见下方 style）。
 */
const FIELD_CSS = `
.hud-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--grid-line, var(--border-subtle)) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-line, var(--border-subtle)) 1px, transparent 1px);
  background-size: 84px 84px;
  -webkit-mask-image: radial-gradient(ellipse at 38% 46%, #000 0%, transparent 68%);
  mask-image: radial-gradient(ellipse at 38% 46%, #000 0%, transparent 68%);
  opacity: 0.5;
}
.hud-stage {
  position: absolute;
  left: 50%;
  top: 44%;
  width: min(86vw, 620px);
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  perspective: 900px;
}
@media (min-width: 1024px) {
  .hud-stage { left: 33%; top: 50%; width: min(52vw, 700px); }
}
.hud-parallax {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transform: translate3d(calc(var(--hx, 0) * 16px), calc(var(--hy, 0) * 12px), 0);
}
.hud-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid var(--border-subtle);
}
.hud-ring-outer { inset: 0; }
.hud-ring-mid {
  inset: 13%;
  border-style: dashed;
  border-color: var(--border-strong);
  opacity: 0.65;
  animation: hud-spin 46s linear infinite;
}
.hud-ring-inner {
  inset: 31%;
  border-color: var(--accent-border, rgba(90, 242, 255, 0.42));
  opacity: 0.55;
}
.hud-ellipse {
  position: absolute;
  inset: 6%;
  border-radius: 50%;
  border: 1px solid var(--accent-border, rgba(90, 242, 255, 0.42));
  opacity: 0.4;
}
.hud-ellipse-a { animation: hud-orbit-a 28s linear infinite; }
.hud-ellipse-b {
  inset: 19%;
  border-color: var(--accent-2, #ff3ec9);
  opacity: 0.26;
  animation: hud-orbit-b 40s linear infinite;
}
.hud-ticks {
  position: absolute;
  inset: 4%;
  border-radius: 50%;
  background: repeating-conic-gradient(
    from 0deg,
    var(--border-strong) 0deg 0.45deg,
    transparent 0.45deg 12deg
  );
  -webkit-mask: radial-gradient(circle, transparent calc(50% - 7px), #000 calc(50% - 7px) calc(50% - 1px), transparent calc(50% - 1px));
  mask: radial-gradient(circle, transparent calc(50% - 7px), #000 calc(50% - 7px) calc(50% - 1px), transparent calc(50% - 1px));
  opacity: 0.45;
  animation: hud-spin 120s linear infinite;
}
.hud-cross {
  position: absolute;
  background: linear-gradient(90deg, transparent, var(--accent-border, rgba(90, 242, 255, 0.42)), transparent);
  opacity: 0.5;
}
.hud-cross-x { left: 0; right: 0; top: 50%; height: 1px; }
.hud-cross-y {
  top: 0; bottom: 0; left: 50%; width: 1px;
  background: linear-gradient(180deg, transparent, var(--accent-border, rgba(90, 242, 255, 0.42)), transparent);
}
.hud-core {
  position: absolute;
  left: 50%; top: 50%;
  width: 5px; height: 5px;
  margin: -2.5px 0 0 -2.5px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 18px var(--accent-glow, rgba(90, 242, 255, 0.35));
}
.hud-sweep {
  position: absolute;
  left: 8%; right: 8%; top: 50%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent-border, rgba(90, 242, 255, 0.42)), transparent);
  box-shadow: 0 0 18px var(--accent-glow, rgba(90, 242, 255, 0.35));
  animation: hud-scan 6.5s ease-in-out infinite;
}
.hud-coord {
  position: absolute;
  font-family: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace;
  font-size: 8px;
  letter-spacing: 0.18em;
  color: var(--text-tertiary);
  opacity: 0.8;
}
.hud-coord-a { left: 1%; bottom: 9%; }
.hud-coord-b { right: 1%; top: 9%; }
.hud-scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.022) 0 1px, transparent 1px 3px);
  opacity: 0.5;
}
.hud-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 40% 45%, transparent 32%, var(--background) 92%);
  opacity: 0.55;
}
@keyframes hud-spin { to { transform: rotate(360deg); } }
@keyframes hud-orbit-a {
  from { transform: rotateX(68deg) rotateZ(0deg); }
  to { transform: rotateX(68deg) rotateZ(360deg); }
}
@keyframes hud-orbit-b {
  from { transform: rotateY(64deg) rotateZ(0deg); }
  to { transform: rotateY(64deg) rotateZ(-360deg); }
}
@keyframes hud-scan {
  0%, 100% { transform: translateY(-120px); opacity: 0; }
  50% { transform: translateY(120px); opacity: 0.9; }
}
@media (prefers-reduced-motion: reduce) {
  .hud-ring-mid, .hud-ellipse-a, .hud-ellipse-b, .hud-ticks, .hud-sweep {
    animation: none !important;
  }
}
/* 触屏无指针视差，再让持续旋转降级为静态，避免小设备上的无谓合成开销 */
@media (hover: none) {
  .hud-ring-mid, .hud-ellipse-a, .hud-ellipse-b, .hud-ticks, .hud-sweep {
    animation: none !important;
  }
}
`;

export function HeroField() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none absolute inset-0 z-0 overflow-hidden"
    >
      <style>{FIELD_CSS}</style>
      <div className="hud-grid" />
      <div className="hud-stage">
        <div className="hud-parallax">
          <div className="hud-ring hud-ring-outer" />
          <div className="hud-ticks" />
          <div className="hud-ring hud-ring-mid" />
          <div className="hud-ellipse hud-ellipse-a" />
          <div className="hud-ellipse hud-ellipse-b" />
          <div className="hud-ring hud-ring-inner" />
          <div className="hud-cross hud-cross-x" />
          <div className="hud-cross hud-cross-y" />
          <div className="hud-core" />
          <div className="hud-sweep" />
          <span className="hud-coord hud-coord-a">X 00.000</span>
          <span className="hud-coord hud-coord-b">Y 00.000</span>
        </div>
      </div>
      <div className="hud-scanlines" />
      <div className="hud-vignette" />
    </div>
  );
}
