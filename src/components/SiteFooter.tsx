"use client";

import { SITE_LINKS, SITE_ICP, SITE_START_YEAR, SITE_AUTHOR } from "@/config/site";

/**
 * 全局底部 Footer：版权 · 站点链接 · ICP 备案。
 *
 * 作为 page.tsx flex 列布局的最后一项（shrink-0），自然占据底部高度，
 * 不遮挡 main 内的 section 内容，也无需 fixed/pointer-events 处理。
 * 极小字号 + 低对比度，不抢视觉；ICP 常驻符合备案规范。
 * 移动端隐藏站点链接组，仅保留版权 + ICP。
 */
export function SiteFooter() {
  const year = new Date().getFullYear();
  const copyright =
    year > SITE_START_YEAR ? `${SITE_START_YEAR}–${year}` : `${year}`;

  return (
    <footer
      className="site-footer shrink-0 fade-up-soft"
      style={{ animationDelay: "0.6s" }}
    >
      <div
        className="content-max-width flex items-center justify-center h-7 gap-3 text-[10px] font-mono tabular-nums"
        style={{ color: "var(--text-tertiary)" }}
      >
        {/* 版权 */}
        <span>
          © {copyright} {SITE_AUTHOR}
        </span>

        {/* 分隔符 + 站点链接（移动端隐藏） */}
        <span aria-hidden className="hidden sm:inline opacity-40">
          ·
        </span>
        <nav
          className="hidden sm:flex items-center gap-2.5"
          aria-label="Site links"
        >
          {SITE_LINKS.map((link) => (
            <a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link active:scale-[0.96]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* 分隔符 + ICP 备案 */}
        <span aria-hidden className="opacity-40">
          ·
        </span>
        <a
          href={SITE_ICP.url}
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link active:scale-[0.96]"
        >
          {SITE_ICP.number}
        </a>
      </div>
    </footer>
  );
}
