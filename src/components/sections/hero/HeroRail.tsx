/**
 * 左侧竖向 HUD 轨道：竖排系统标签 + 循环滚动遥测条 + 页面序号。
 *
 * 纯装饰（aria-hidden），仅 xl 以上显示，避免窄屏挤压主内容。
 * 滚动用本地 keyframes + 内容复制两份（-50% 无缝循环）；
 * reduced-motion 下关闭动画，静态列表仍可读。
 */
const RAIL_CSS = `
.hero-rail-track { animation: hero-rail-tick 24s linear infinite; }
@keyframes hero-rail-tick {
  from { transform: translateY(0); }
  to { transform: translateY(-50%); }
}
@media (prefers-reduced-motion: reduce) {
  .hero-rail-track { animation: none !important; }
}
`;

const TOKENS = ["SYS", "CN", "+8", "TF", "05", "AI"];

export function HeroRail() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-3 xl:flex"
    >
      <style>{RAIL_CSS}</style>
      <span
        className="text-[9px] font-mono"
        style={{
          writingMode: "vertical-rl",
          letterSpacing: "0.34em",
          color: "var(--accent)",
        }}
      >
        SYS.LIVE
      </span>
      <span
        className="h-10 w-px"
        style={{
          background:
            "linear-gradient(180deg, var(--accent-border, rgba(90,242,255,0.42)), transparent)",
        }}
      />

      <div
        className="relative h-40 w-8 overflow-hidden"
        style={{
          WebkitMaskImage:
            "linear-gradient(180deg, transparent, #000 18%, #000 82%, transparent)",
          maskImage:
            "linear-gradient(180deg, transparent, #000 18%, #000 82%, transparent)",
        }}
      >
        <div className="hero-rail-track">
          {[...TOKENS, ...TOKENS].map((token, i) => (
            <div
              key={`${token}-${i}`}
              className="flex h-8 items-center justify-center text-[8px] font-mono tracking-[0.18em]"
              style={{
                color:
                  i % TOKENS.length === 0
                    ? "var(--accent)"
                    : "var(--text-tertiary)",
              }}
            >
              {token}
            </div>
          ))}
        </div>
      </div>

      <span
        className="h-10 w-px"
        style={{
          background:
            "linear-gradient(180deg, transparent, var(--border-strong))",
        }}
      />
      <span
        className="font-mono text-[9px] tabular-nums tracking-[0.2em]"
        style={{ color: "var(--text-tertiary)" }}
      >
        00/05
      </span>
    </div>
  );
}
