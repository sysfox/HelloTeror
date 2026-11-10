/** 不随请求变化的站点事实。文案在 src/copy.ts，这里只放名字和地址。 */

export const SITE = {
  author: "Teror Fox",
  studio: "TF Studio",
  startYear: 2020,
  email: "i@trfox.top",
  githubUser: "sysfox",
  blog: "https://blog.trfox.top",
  mx: "https://mx.trfox.top/api/v3",
  icp: {
    number: "苏ICP备2026041454号",
    url: "https://beian.miit.gov.cn/",
  },
  /** 河海大学在南京。坐标只用于公开天气预报。 */
  nanjing: { latitude: 32.06, longitude: 118.8 },
} as const

export const PLACES = [
  {
    id: "blog",
    href: "https://blog.trfox.top",
    zh: "博客",
    en: "Blog",
    host: "blog.trfox.top",
  },
  {
    id: "legacy",
    href: "https://legacy.trfox.top",
    zh: "旧站",
    en: "Old site",
    host: "legacy.trfox.top",
  },
  {
    id: "pan",
    href: "https://pan.trfox.top",
    zh: "网盘",
    en: "Files",
    host: "pan.trfox.top",
  },
  {
    id: "lens",
    href: "https://lens.trfox.top",
    zh: "镜头",
    en: "Lens",
    host: "lens.trfox.top",
  },
  {
    id: "status",
    href: "https://status.trfox.top",
    zh: "状态",
    en: "Status",
    host: "status.trfox.top",
  },
  {
    id: "github",
    href: "https://github.com/sysfox",
    zh: "GitHub",
    en: "GitHub",
    host: "github.com/sysfox",
  },
  {
    id: "bilibili",
    href: "https://space.bilibili.com/3494363657144970",
    zh: "哔哩哔哩",
    en: "Bilibili",
    host: "bilibili.com",
  },
  {
    id: "email",
    href: "mailto:i@trfox.top",
    zh: "写信",
    en: "Mail",
    host: "i@trfox.top",
  },
] as const

export const TOOLS = [
  "TypeScript",
  "Python",
  "React",
  "NestJS",
  "FastAPI",
  "PostgreSQL",
  "Redis",
  "Docker",
] as const
