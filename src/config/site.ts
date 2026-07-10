/**
 * 站点元数据集中配置。
 *
 * 社交链接 / 站点链接 / ICP 备案移植自 sysfox/homepage
 * （.env 的 VITE_SITE_ICP + src/assets/socialLinks.json + siteLinks.json）。
 * 值为站点固定信息，变更频率极低，硬编码于此而非 env。
 */

/** 顶部 SiteNav 社交图标（按显示顺序） */
export const SOCIAL_LINKS = [
  { id: "github", label: "GitHub", href: "https://github.com/sysfox" },
  {
    id: "bilibili",
    label: "BiliBili",
    href: "https://space.bilibili.com/3494363657144970",
  },
  { id: "email", label: "Email", href: "mailto:i@trfox.top" },
] as const;

/** 底部 Footer 站点链接（我的其他站点） */
export const SITE_LINKS = [
  { id: "blog", label: "Blog", href: "https://blog.trfox.top" },
  { id: "legacy", label: "Legacy", href: "https://legacy.trfox.top" },
  { id: "pan", label: "Pan", href: "https://pan.trfox.top" },
  { id: "plog", label: "Plog", href: "https://lens.trfox.top" },
  { id: "status", label: "Status", href: "https://status.trfox.top" },
] as const;

/** ICP 备案号（链接到工信部备案查询系统） */
export const SITE_ICP = {
  number: "苏ICP备2026041454号",
  url: "https://beian.miit.gov.cn",
} as const;

/** 站点起始年份（版权区间起始） */
export const SITE_START_YEAR = 2020;

/** 站点作者名（版权归属） */
export const SITE_AUTHOR = "Teror Fox";
