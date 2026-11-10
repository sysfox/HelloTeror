export type Locale = "zh" | "en"

export type Copy = {
  title: string
  navHome: string
  navShelf: string
  toEnglish: string
  toChinese: string
  toPaper: string
  toNight: string
  paper: string
  night: string
  motto: string
  mottoAside: string
  school: string
  where: string
  thisYear: string
  lately: string
  times: (count: string) => string
  recentNote: string
  yearQuiet: string
  recentCaption: string
  writing: string
  onTheBench: string
  moreShelf: string
  tools: string
  weatherMiss: string
  numbersMiss: string
  writingMiss: string
  reposMiss: string
  graphMiss: string
  openGithub: string
  repos: string
  repoWord: string
  followers: string
  stars: string
  starCount: (count: number) => string
  shelfTitle: string
  shelfLead: string
  all: string
  posts: string
  notes: string
  places: string
  around: string
  empty: string
  offline: string
  retry: string
  quietDay: (date: string) => string
  busyDay: (date: string, count: number) => string
  weatherWord: (code: number) => string
  weatherMeta: (humidity: number, wind: number) => string
  greet: (hour: number) => string
}

const zh: Copy = {
  title: "Teror Fox — 抬头看星星",
  navHome: "主页",
  navShelf: "架上",
  toEnglish: "换成英文",
  toChinese: "换成中文",
  toPaper: "换成纸上",
  toNight: "换成夜色",
  paper: "纸上",
  night: "夜色",
  motto: "沟里的虫子，也有人要抬头看星星。",
  mottoAside: "We are all worms in the gutter, yet some must dare to gaze at the stars.",
  school: "河海大学 · 自动化",
  where: "人在南京",
  thisYear: "这一年",
  lately: "近三个月",
  times: (count) => `一共 ${count} 次`,
  recentNote: "最近一篇随笔",
  yearQuiet: "格子这会儿没画出来",
  recentCaption: "公开动态，不是完整的一年",
  writing: "最近写下的",
  around: "常去",
  onTheBench: "手头的",
  moreShelf: "其余的在架上",
  tools: "手里常碰的",
  weatherMiss: "天气没取到",
  numbersMiss: "数字这会儿没取到",
  writingMiss: "博客这会儿没接上",
  reposMiss: "仓库这会儿没接上",
  graphMiss: "格子这会儿没画出来",
  openGithub: "去 GitHub 看看",
  repos: "仓库",
  repoWord: "仓库",
  followers: "关注者",
  stars: "收到的星",
  starCount: (count) => `${count} 颗星`,
  shelfTitle: "架上",
  shelfLead: "文章、仓库、随笔，还有常去的地方。不是展览，摊开就好。",
  all: "全部",
  posts: "文章",
  notes: "随笔",
  places: "去处",
  empty: "这格是空的。",
  offline: "这会儿没连上。",
  retry: "再试一次",
  quietDay: (date) => `${date} · 没动`,
  busyDay: (date, count) => `${date} · ${count} 次`,
  weatherWord: weatherZh,
  weatherMeta: (humidity, wind) => `南京 · 湿度 ${humidity}% · 风 ${wind} km/h`,
  greet: greetZh,
}

const en: Copy = {
  title: "Teror Fox — some of us look up",
  navHome: "Home",
  navShelf: "Shelf",
  toEnglish: "Switch to English",
  toChinese: "Switch to Chinese",
  toPaper: "Switch to paper",
  toNight: "Switch to night",
  paper: "Paper",
  night: "Night",
  motto: "We are all worms in the gutter, yet some must dare to gaze at the stars.",
  mottoAside: "沟里的虫子，也有人要抬头看星星。",
  school: "Automation, Hohai University",
  where: "Nanjing",
  thisYear: "This year",
  lately: "Three months",
  times: (count) => `${count} this year`,
  recentNote: "Latest note",
  yearQuiet: "The squares didn’t come through",
  recentCaption: "Public activity, not a full year",
  writing: "Recent writing",
  onTheBench: "Recent work",
  around: "Around",
  moreShelf: "The rest is on the shelf",
  tools: "What I reach for",
  weatherMiss: "Weather didn’t come through",
  numbersMiss: "The numbers didn’t come through",
  writingMiss: "The blog didn’t answer",
  reposMiss: "The repositories didn’t answer",
  graphMiss: "The squares didn’t come through",
  openGithub: "On GitHub",
  repos: "repos",
  repoWord: "Repos",
  followers: "followers",
  stars: "stars",
  starCount: (count) => `${count} ${count === 1 ? "star" : "stars"}`,
  shelfTitle: "Shelf",
  shelfLead: "Writing, repositories, notes, and the places I keep around. Laid out, not arranged for show.",
  all: "All",
  posts: "Writing",
  notes: "Notes",
  places: "Places",
  empty: "Nothing in this one.",
  offline: "Couldn’t reach it just now.",
  retry: "Try again",
  quietDay: (date) => `${date} · quiet`,
  busyDay: (date, count) => `${date} · ${count}`,
  weatherWord: weatherEn,
  weatherMeta: (humidity, wind) => `Nanjing · humidity ${humidity}% · wind ${wind} km/h`,
  greet: greetEn,
}

export function deskCopy(locale: Locale): Copy {
  return locale === "zh" ? zh : en
}

function greetZh(hour: number): string {
  if (hour < 5) return "夜还很长"
  if (hour < 11) return "早上好"
  if (hour < 14) return "中午好"
  if (hour < 18) return "下午好"
  return "晚上好"
}

function greetEn(hour: number): string {
  if (hour < 5) return "Still up"
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

function weatherZh(code: number): string {
  if (code === 0) return "晴"
  if (code === 1) return "少云"
  if (code === 2) return "多云"
  if (code === 3) return "阴"
  if (code === 45 || code === 48) return "有雾"
  if (code >= 51 && code <= 57) return "毛毛雨"
  if (code >= 61 && code <= 67) return code >= 65 ? "雨很大" : "下雨"
  if (code >= 71 && code <= 77) return "下雪"
  if (code >= 80 && code <= 82) return "阵雨"
  if (code >= 85 && code <= 86) return "阵雪"
  if (code >= 95) return "雷雨"
  return "天色不明"
}

function weatherEn(code: number): string {
  if (code === 0) return "Clear"
  if (code === 1) return "Mostly clear"
  if (code === 2) return "Cloudy"
  if (code === 3) return "Overcast"
  if (code === 45 || code === 48) return "Fog"
  if (code >= 51 && code <= 57) return "Drizzle"
  if (code >= 61 && code <= 67) return code >= 65 ? "Heavy rain" : "Rain"
  if (code >= 71 && code <= 77) return "Snow"
  if (code >= 80 && code <= 82) return "Showers"
  if (code >= 85 && code <= 86) return "Snow showers"
  if (code >= 95) return "Thunder"
  return "Unclear"
}

export function shanghaiHour(now = new Date()): number {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    hour: "numeric",
    hourCycle: "h23",
  }).format(now)
  return Number(hour)
}

export function formatWhen(iso: string, locale: Locale): string {
  if (!iso) return ""
  const date = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    timeZone: "UTC",
    month: locale === "zh" ? "long" : "short",
    day: "numeric",
  }).format(date)
}

export function formatToday(locale: Locale, now = new Date()): string {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    timeZone: "Asia/Shanghai",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(now)
}
