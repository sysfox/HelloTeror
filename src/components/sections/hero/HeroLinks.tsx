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

/** SITE_LINKS id → lucide 图标 */
function SiteLinkIcon({ id }: { id: string }) {
  if (id === "blog") return <PenLine size={13} />;
  if (id === "legacy") return <Archive size={13} />;
  if (id === "pan") return <HardDrive size={13} />;
  if (id === "plog") return <Camera size={13} />;
  if (id === "status") return <Activity size={13} />;
  return null;
}

/**
 * Hero 站点链接（简化版）：去掉 HUD 通道编号与标题装饰，
 * 只保留图标 + 名称的紧凑列表。
 */
export function HeroLinks() {
  const t = useT();

  return (
    <div className="flex flex-col">
      {SITE_LINKS.map((link) => (
        <a
          key={link.id}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2.5 border-b py-2.5 transition-colors duration-200"
          style={{
            borderColor: "var(--border-subtle)",
            color: "var(--text-secondary)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          <span
            className="shrink-0"
            style={{ color: "var(--text-tertiary)" }}
          >
            <SiteLinkIcon id={link.id} />
          </span>
          <span className="flex-1 text-[12px]">{t.links[link.id]}</span>
          <ArrowUpRight
            size={12}
            className="opacity-40 transition-opacity group-hover:opacity-80"
          />
        </a>
      ))}
    </div>
  );
}
