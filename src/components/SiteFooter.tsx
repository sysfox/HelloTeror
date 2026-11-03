"use client";

import {
  SITE_ICP,
  SITE_LINKS,
  SITE_START_YEAR,
  SITE_AUTHOR,
} from "@/config/site";
import { useT } from "@/contexts/LocaleContext";

/**
 * 站点页脚（简化版）：版权 + ICP + 其他站点链接。
 * 去掉跑马灯、坐标读数与 HUD 状态灯，保持单行、可扫读。
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
      <div
        className="content-max-width flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 text-[11px]"
        style={{ color: "var(--text-tertiary)" }}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2">
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

        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {SITE_LINKS.map((link) => (
            <a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link transition-colors duration-200"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "";
              }}
            >
              {t.links[link.id]}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
