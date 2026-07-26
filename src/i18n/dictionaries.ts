/**
 * 文案字典（en 为类型基准，zh 必须结构完全一致）。
 *
 * 类型策略：`en` 不加 as const（避免字面量类型让 zh 无法赋值），
 * 由 `typeof en` 推出 Dictionary，zh 显式标注该类型 —— 缺 key / 多 key / 类型不符
 * 都会在 tsc 阶段报错，从而保证两种语言不会漂移。
 *
 * 不进字典的内容：
 *  - 品牌名与专有名词（Teror Fox / GitHub / BiliBili / TF Studio / GitHub 成就徽章名）
 *  - 终端里的命令本身（whoami / cat / ls 属于"代码"，不翻译，仅翻译输出）
 *  - 上游数据（博客标题与分类、仓库描述）—— 由 MX-Space / GitHub 决定语言，见 CLAUDE.md
 */
import type { Locale } from "@/i18n/config";

const en = {
  meta: {
    title: "Teror Fox — Fighting for the AI age",
    description:
      "Teror Fox — a creative developer passionate about open source and building beautiful things. Student && Developer. Based in China.",
    ogTitle: "Teror Fox — Fighting for the AI age",
    ogDescription:
      "Creative developer, open source enthusiast. Student && Developer.",
    keywords: [
      "Teror Fox",
      "sysfox",
      "developer",
      "open source",
      "TypeScript",
      "Python",
      "Next.js",
      "AI",
    ],
  },

  nav: {
    home: "Home",
    about: "About",
    tech: "Tech",
    stats: "Stats",
    projects: "Projects",
    blog: "Blog",
  },

  /** type-wipe 转场幕布上的超大词标（比 nav 更短、更有冲击力） */
  wordmark: {
    home: "HOME",
    about: "ABOUT",
    tech: "STACK",
    stats: "ACTIVITY",
    projects: "WORK",
    blog: "WRITING",
  },

  a11y: {
    homeLink: "Teror Fox home",
    toLight: "Switch to light theme",
    toDark: "Switch to dark theme",
    themeLight: "Light",
    themeDark: "Dark",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    emailMe: "Email Teror Fox",
    copyTerminal: "Copy terminal output",
  },

  /** 语言切换按钮：label 用目标语言自身书写，一眼可辨 */
  language: {
    label: "中文",
    aria: "Switch to Chinese",
  },

  common: {
    scroll: "scroll",
    online: "online",
  },

  hero: {
    tagline: "Fighting for the AI age",
    roleStudent: "Student",
    roleDeveloper: "<Developer />",
    bio:
      "Crafting expressive, performant interfaces for the AI age. Student by day, developer by night — exploring systems, design, and everything between.",
    ctaProjects: "View Projects",
    ctaBlog: "Read Blog",
  },

  /** Hero 右栏终端会话的输出行（命令行本身不翻译） */
  terminal: {
    whoami: "teror-fox",
    aboutHeading: "# Student && Developer",
    aboutTagline: "Fighting for the AI age",
    skills: "typescript/  nextjs/  animejs/  python/  rust/",
    statusOnline: "online",
  },

  about: {
    label: "About",
    title: "An independent developer.",
    subtitle: "coding with love.",
    bioBefore: "I'm ",
    bioAfter:
      " — a creative developer passionate about open source and building beautiful things. I build for the web, tinker with AI, and occasionally hunt for security holes. By day a student, by night a maker.",
    factLocation: "Location",
    factLocationValue: "China",
    factAffiliation: "Affiliation",
    factRole: "Role",
    factRoleValue: "Student & Developer",
    factFocus: "Focus",
    factFocusValue: "Open Source & AI",
    achievements: "Achievements",
    achievementMember: "Member",
    /** profile.sh 卡片里的终端输出 */
    shellWhoami: "sysfox — Creative Dev, Open Source Enthusiast",
    shellBioLine1: "Fighting for the AI age. Building beautiful",
    shellBioLine2: "things with TypeScript & Python since 2022.",
    shellStatus1: "open to collaborations",
    shellStatus2: "shipping side-projects",
    quote:
      "“When the first satellite flew beyond the atmosphere, we believed we would one day conquer the universe.”",
  },

  tech: {
    label: "Tech Stack",
    title: "Tools of the trade.",
    subtitle:
      "A pragmatic stack honed across open-source work, side-projects, and the occasional all-nighter.",
    catLangs: "Languages",
    catFrontend: "Frontend",
    catBackend: "Backend",
    catInfra: "Infrastructure",
    catTools: "Tools & OS",
    notePrimary: "Primary",
    moreLine1: "Always learning",
    moreLine2: "the next thing.",
  },

  stats: {
    label: "Activity",
    title: "By the numbers.",
    subtitle:
      "A year of shipping — measured in commits, pull requests, and the conversations they sparked.",
    commits: "Commits this year",
    prs: "Pull requests",
    issues: "Issues opened",
    contributedTo: "Contributed to",
    repos: "Public repositories",
    followers: "GitHub followers",
    stars: "Stars earned",
    profileLink: "View GitHub profile →",
    graphLabel: "Contribution graph",
    /** total 已按 locale 格式化为字符串后传入 */
    graphTotal: (total: string) => `${total} contributions this year`,
    graphTooltip: (count: number, date: string) =>
      `${count} contribution${count === 1 ? "" : "s"} on ${date}`,
    graphTooltipEmpty: (date: string) => `No contributions on ${date}`,
    graphLess: "Less",
    graphMore: "More",
  },

  projects: {
    label: "Projects",
    title: "Things I've built.",
    subtitle:
      "A selection of pinned repositories — from a 1.9k-star blog manager to an AI-powered CMS core.",
    contributor: "contributor",
    seeAll: "See all on GitHub",
  },

  blog: {
    label: "Writing",
    title: "Recent writing.",
    subtitle:
      "Notes from the field — development logs, security write-ups, and occasional reflections.",
    visit: "Visit blog.trfox.top",
  },

  /** config/site.ts 里的链接标签（id → 显示名） */
  links: {
    blog: "Blog",
    legacy: "Legacy",
    pan: "Pan",
    plog: "Plog",
    status: "Status",
    github: "GitHub",
    bilibili: "BiliBili",
    email: "Email",
  },
};

export type Dictionary = typeof en;

const zh: Dictionary = {
  meta: {
    title: "Teror Fox — 为 AI 时代而战",
    description:
      "Teror Fox —— 热爱开源、执着于把东西做漂亮的创意开发者。学生 && 开发者，身在中国。",
    ogTitle: "Teror Fox — 为 AI 时代而战",
    ogDescription: "创意开发者，开源爱好者。学生 && 开发者。",
    keywords: [
      "Teror Fox",
      "sysfox",
      "开发者",
      "开源",
      "前端",
      "TypeScript",
      "Python",
      "Next.js",
      "AI",
    ],
  },

  nav: {
    home: "首页",
    about: "关于",
    tech: "技术",
    stats: "动态",
    projects: "项目",
    blog: "博客",
  },

  wordmark: {
    home: "首页",
    about: "关于",
    tech: "技术栈",
    stats: "动态",
    projects: "项目",
    blog: "写作",
  },

  a11y: {
    homeLink: "Teror Fox 首页",
    toLight: "切换到浅色主题",
    toDark: "切换到深色主题",
    themeLight: "浅色",
    themeDark: "深色",
    openMenu: "打开菜单",
    closeMenu: "关闭菜单",
    emailMe: "给 Teror Fox 发邮件",
    copyTerminal: "复制终端输出",
  },

  language: {
    label: "EN",
    aria: "切换到英文",
  },

  common: {
    scroll: "滚动",
    online: "在线",
  },

  hero: {
    tagline: "为 AI 时代而战",
    roleStudent: "学生",
    roleDeveloper: "<开发者 />",
    bio:
      "为 AI 时代打造富有表现力且高性能的界面。白天是学生，夜里是开发者 —— 在系统、设计以及两者之间的一切里折腾。",
    ctaProjects: "查看项目",
    ctaBlog: "阅读博客",
  },

  terminal: {
    whoami: "teror-fox",
    aboutHeading: "# 学生 && 开发者",
    aboutTagline: "为 AI 时代而战",
    skills: "typescript/  nextjs/  animejs/  python/  rust/",
    statusOnline: "在线",
  },

  about: {
    label: "关于",
    title: "一名独立开发者。",
    subtitle: "带着热爱写代码。",
    bioBefore: "我是 ",
    bioAfter:
      " —— 一名热爱开源、执着于把东西做漂亮的创意开发者。我为 Web 而写，折腾 AI，偶尔也挖挖安全漏洞。白天是学生，夜里是造物者。",
    factLocation: "所在地",
    factLocationValue: "中国",
    factAffiliation: "所属",
    factRole: "身份",
    factRoleValue: "学生 & 开发者",
    factFocus: "关注",
    factFocusValue: "开源 & AI",
    achievements: "成就",
    achievementMember: "会员",
    shellWhoami: "sysfox —— 创意开发者，开源爱好者",
    shellBioLine1: "为 AI 时代而战。自 2022 年起用",
    shellBioLine2: "TypeScript 与 Python 打造漂亮的东西。",
    shellStatus1: "接受合作",
    shellStatus2: "持续发布副项目",
    quote:
      "“当第一颗卫星飞向大气层外，我们便以为自己终有一日会征服宇宙。”",
  },

  tech: {
    label: "技术栈",
    title: "手上的工具。",
    subtitle:
      "一套在开源协作、副项目和偶尔的通宵里磨出来的实用技术栈。",
    catLangs: "编程语言",
    catFrontend: "前端",
    catBackend: "后端",
    catInfra: "基础设施",
    catTools: "工具 & 系统",
    notePrimary: "主力",
    moreLine1: "永远在学",
    moreLine2: "下一样东西。",
  },

  stats: {
    label: "动态",
    title: "用数字说话。",
    subtitle:
      "一年的产出 —— 用提交、拉取请求，以及它们引出的讨论来衡量。",
    commits: "本年提交",
    prs: "拉取请求",
    issues: "提出的 Issue",
    contributedTo: "参与过的仓库",
    repos: "公开仓库",
    followers: "GitHub 关注者",
    stars: "收获的 Star",
    profileLink: "查看 GitHub 主页 →",
    graphLabel: "贡献热图",
    graphTotal: (total: string) => `本年共 ${total} 次贡献`,
    graphTooltip: (count: number, date: string) => `${date} · ${count} 次贡献`,
    graphTooltipEmpty: (date: string) => `${date} · 无贡献`,
    graphLess: "少",
    graphMore: "多",
  },

  projects: {
    label: "项目",
    title: "我做过的东西。",
    subtitle:
      "GitHub 置顶仓库的一部分 —— 从 1.9k star 的博客管理器，到 AI 驱动的 CMS 内核。",
    contributor: "贡献者",
    seeAll: "在 GitHub 上查看全部",
  },

  blog: {
    label: "写作",
    title: "最近在写。",
    subtitle:
      "来自一线的笔记 —— 开发日志、安全复盘，以及偶尔的胡思乱想。",
    visit: "访问 blog.trfox.top",
  },

  links: {
    blog: "博客",
    legacy: "旧版",
    pan: "网盘",
    plog: "相册",
    status: "状态",
    github: "GitHub",
    bilibili: "BiliBili",
    email: "邮箱",
  },
};

const DICTIONARIES: Record<Locale, Dictionary> = { en, zh };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
