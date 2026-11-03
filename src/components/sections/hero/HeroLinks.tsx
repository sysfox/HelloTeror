"use client";

import {
  Archive,
  ArrowUpRight,
  Activity,
  Camera,
  HardDrive,
  PenLine,
} from "lucide-react";
import { SITE_LINKS } from "@/config/site";
import { useT } from "@/contexts/LocaleContext";

/** SITE_LINKS id → lucide 图标（沿用旧 Hero 的图标映射，保持站点识别度） */
function SiteLinkIcon({ id }: { id: string }) {
  if (id === "blog") return <PenLine size={12} />;
  if (id === "legacy") return <Archive size={12} />;
  if (id === "pan") return <HardDrive size={12} />;
  if (id === "plog") return <Camera size={12} />;
  if (id === "status") return <Activity size={12} />;
  return null;
}

/**
 * Hero 底部站点网络条：SITE_LINKS 全量保留，改为带序号的 HUD 通道条。
 * hover / focus 的能量响应用内联样式切换（与全站 token 消费方式一致）。
 */
export function HeroLinks() {
  const t = useT();

  const setActive = (el: HTMLElement, active: boolean) => {
    el.style.borderColor = active
      ? "var(--accent-border, rgba(90,242,255,0.42))"
      : "var(--border-subtle)";
    el.style.color = active
      ? "var(--text-primary)"
      : "var(--text-tertiary)";
    el.style.background = active
      ? "var(--surface-hover)"
      : "var(--surface)";
  };

  return (
    <div className="relative w-full border-t pt-3" style={{ borderColor: "var(--border-subtle)" }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div aria-hidden className="flex shrink-0 items-center gap-2">
          <span className="text-[9px] font-mono" style={{ color: "var(--accent)" }}>
            {"// NET"}
          </span>
          <span className="h-px w-6" style={{ background: "var(--accent-border, rgba(90,242,255,0.42))" }} />
          <span
            className="text-[9px] font-mono uppercase tracking-[0.28em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            SITE.NETWORK
          </span>
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
          {SITE_LINKS.map((link, i) => (
            <a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex h-8 items-center gap-1.5 border px-2.5 text-[10px] font-mono uppercase tracking-[0.14em] transition-colors duration-200 active:scale-[0.97]"
              style={{
                borderColor: "var(--border-subtle)",
                color: "var(--text-tertiary)",
                background: "var(--surface)",
              }}
              onMouseEnter={(e) => setActive(e.currentTarget, true)}
              onMouseLeave={(e) => setActive(e.currentTarget, false)}
              onFocus={(e) => setActive(e.currentTarget, true)}
              onBlur={(e) => setActive(e.currentTarget, false)}
            >
              <span className="tabular-nums opacity-60">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span style={{ color: "var(--accent)" }}>
                <SiteLinkIcon id={link.id} />
              </span>
              <span>{t.links[link.id]}</span>
              <ArrowUpRight
                size={10}
                className="opacity-50 transition-opacity group-hover:opacity-100"
              />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
