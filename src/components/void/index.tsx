import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * VOID 共享原语：所有 section / 导航 / Footer 都可用的最小视觉单元。
 *
 * 约束（与 docs/REDESIGN.md §4 一致）：
 *  - 依赖为零：只用 React + globals.css 里的 VOID utilities，不引入动画库。
 *  - 全部 reduced-motion 安全：动画由 globals.css 的 media query 关闭，
 *    组件本身不注册任何 JS 动画。
 *  - 不写死颜色：颜色全部来自 CSS token，主题切换自动生效。
 *  - 不用 "use client"：原语可被 Server / Client 组件同时引用；
 *    只有传入事件回调时才需要调用方是 client component。
 */

export type VoidGlow = "cyan" | "magenta" | "amber";

export interface GlassPanelProps extends ComponentPropsWithoutRef<"div"> {
  /** 边框/能量光颜色，对应 磷光青 / 等离子洋红 / 信号琥珀 */
  glow?: VoidGlow;
  /** 是否切左上/右下角（HUD 切角）；移动端小面板可关掉 */
  cut?: boolean;
}

/**
 * 玻璃面板：半透明表面 + 渐变 1px 边框 + backdrop-blur。
 * 切角通过 clip-path 实现；`data-glow` 由 globals.css 映射到对应 accent token。
 */
export function GlassPanel({
  children,
  className,
  glow = "cyan",
  cut = true,
  ...props
}: GlassPanelProps) {
  return (
    <div
      data-glow={glow}
      className={cn("void-panel", cut && "void-panel--cut", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export interface HudLabelProps extends ComponentPropsWithoutRef<"span"> {
  /** 可选 HUD 序号（如 "03"），以强调色渲染在文字前 */
  index?: ReactNode;
}

/** HUD 元数据标签：mono / 大写 / 0.18em 字距 / 11px。 */
export function HudLabel({
  children,
  className,
  index,
  ...props
}: HudLabelProps) {
  return (
    <span className={cn("hud-label", className)} {...props}>
      {index != null && (
        <span className="hud-label__index" aria-hidden>
          {index}
        </span>
      )}
      {children}
    </span>
  );
}

/**
 * 扫描层：静态扫描线 + 一条缓慢下移的光带。
 * 需要父元素定位（通常直接铺满 GlassPanel / section）；默认 absolute inset-0。
 */
export function ScanOverlay({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      aria-hidden
      className={cn("void-scan-overlay scanlines", className)}
      {...props}
    >
      <span className="scan-beam" />
    </div>
  );
}

export interface CornerFrameProps extends ComponentPropsWithoutRef<"div"> {
  /** 右上角 HUD 角标文字（如 "SECTOR 03"），可省略 */
  label?: ReactNode;
}

/** 四角括号框：伪元素一次性绘制 4 个 L 形角，用于包裹任意内容。 */
export function CornerFrame({
  children,
  className,
  label,
  ...props
}: CornerFrameProps) {
  return (
    <div className={cn("corner-brackets", className)} {...props}>
      {label != null && (
        <span className="corner-frame__label hud-label">{label}</span>
      )}
      {children}
    </div>
  );
}

export interface TickerProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** 逐项渲染；字符串或任意 ReactNode（可放链接） */
  items: readonly ReactNode[];
}

/**
 * 无缝跑马灯：内容渲染两份，track 位移 -50% 后首尾完全对齐。
 * 第二份是纯视觉复制，aria-hidden + inert，避免读屏/键盘重复访问。
 */
export function Ticker({ items, className, ...props }: TickerProps) {
  const renderGroup = (copy: number) => (
    <div
      key={copy}
      className="void-ticker__group"
      aria-hidden={copy === 1 ? true : undefined}
      inert={copy === 1}
    >
      {items.map((item, i) => (
        <span className="void-ticker__item" key={i}>
          {item}
          <span className="void-ticker__sep" aria-hidden>
            {"//"}
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div className={cn("void-ticker", className)} {...props}>
      <div className="void-ticker__track">
        {renderGroup(0)}
        {renderGroup(1)}
      </div>
    </div>
  );
}
