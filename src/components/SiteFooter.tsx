"use client";

import { SITE_ICP, SITE_START_YEAR, SITE_AUTHOR } from "@/config/site";

/**
 * 全局底部 Footer：版权 · ICP 备案。
 *
 * 站点链接（Blog/Legacy/Pan/Plog/Status）已移至 Hero 首屏 CTA 下方的
 * 带图标 pill chips，此处仅保留版权与 ICP 备案（常驻符合备案规范）。
 * 作为 page.tsx flex 列布局的最后一项（shrink-0），自然占据底部高度。
 * 极小字号 + 低对比度，不抢视觉。
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
