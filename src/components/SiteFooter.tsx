"use client";

import { useEffect, useState } from "react";
import {
  SITE_ICP,
  SITE_LINKS,
  SITE_START_YEAR,
  SITE_AUTHOR,
} from "@/config/site";
import { useT } from "@/contexts/LocaleContext";
import { Ticker } from "@/components/void";

/** 站点坐标（HUD 装饰信息，纯视觉，不参与任何逻辑） */
const SITE_COORDS = "31.2304°N 121.4737°E";
/** UTC 时钟未挂载前的占位：必须与 SSR 输出一致，否则 hydration mismatch */
const UTC_PLACEHOLDER = "--:--:--";

/**
 * UTC 时钟独立成子组件：每秒 setState 只重渲染这一小块，
 * 不会连带重渲染跑马灯里的链接节点。
 */
function UtcClock() {
  const [utc, setUtc] = useState(UTC_PLACEHOLDER);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      setUtc(
        `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(
          d.getUTCSeconds()
        )}`
      );
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return <span className="tabular-nums">{utc}</span>;
}

/**
 * 全局 HUD 状态条：左侧系统状态 / 中间版权 + ICP / 右坐标 + UTC 时钟，
 * 上方一条外部站点跑马灯（显示名走 t.links，不硬编码中文）。
 *
 * 作为 page.tsx flex 列布局的最后一项（shrink-0），自然占据底部高度。
 * 时钟在挂载后才开始走动：初值保持确定性字符串，避免 SSR/客户端时间差
 * 造成的 hydration mismatch。
 */
export function SiteFooter() {
  const t = useT();
  const year = new Date().getFullYear();
  const copyright =
    year > SITE_START_YEAR ? `${SITE_START_YEAR}–${year}` : `${year}`;

  return (
    <footer
      className="site-footer shrink-0 fade-up-soft"
      style={{ animationDelay: "0.6s" }}
    >
      {/* 外部站点跑马灯：t.links 提供显示名，上游文案不翻译 */}
      <div
        className="hidden sm:block"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <Ticker
          className="py-1.5"
          items={SITE_LINKS.map((link) => (
            <a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              {t.links[link.id]}
            </a>
          ))}
        />
      </div>

      <div className="content-max-width grid h-8 grid-cols-2 items-center gap-3 text-[10px] font-mono tabular-nums md:grid-cols-3">
        {/* 左：版本 + 系统状态点 */}
        <div
          className="hidden md:flex items-center gap-3"
          style={{ color: "var(--text-tertiary)" }}
        >
          <span style={{ color: "var(--text-secondary)" }}>VOID//2.0</span>
          <span
            aria-hidden
            className="h-3 w-px"
            style={{ background: "var(--border-subtle)" }}
          />
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="status-pulse h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--status-online)" }}
            />
            CORE ONLINE
          </span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: "var(--accent-3)",
                boxShadow: "0 0 6px var(--accent-3-glow)",
              }}
            />
            LINK // STABLE
          </span>
        </div>

        {/* 中：版权 + ICP（备案号必须常驻可见） */}
        <div
          className="flex min-w-0 items-center gap-2 md:justify-center"
          style={{ color: "var(--text-tertiary)" }}
        >
          <span className="truncate">
            © {copyright} {SITE_AUTHOR}
          </span>
          <span aria-hidden style={{ opacity: 0.4 }}>
            ·
          </span>
          <a
            href={SITE_ICP.url}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link shrink-0 active:scale-[0.96]"
          >
            {SITE_ICP.number}
          </a>
        </div>

        {/* 右：坐标 + UTC 时钟 */}
        <div
          className="hidden sm:flex items-center justify-end gap-2"
          style={{ color: "var(--text-tertiary)" }}
        >
          <span className="hidden lg:inline">{SITE_COORDS}</span>
          <span
            aria-hidden
            className="hidden lg:block h-3 w-px"
            style={{ background: "var(--border-subtle)" }}
          />
          <span>
            <span style={{ color: "var(--accent)" }}>UTC</span>{" "}
            <UtcClock />
          </span>
        </div>
      </div>
    </footer>
  );
}
