import { SITE } from "../shared/site.ts"
import type {
  GithubDesk,
  HeatDay,
  HeatWeek,
  HomePayload,
  NoteCard,
  RepoCard,
  ShelfPayload,
  WeatherNow,
  WritingCard,
} from "../shared/types.ts"
import { cached } from "./cache.ts"
import { plain, shanghaiDay } from "./text.ts"

const TEN_MINUTES = 10 * 60 * 1000

function mxBase(): string {
  const raw = process.env.MXSPACE_API_BASE?.trim() || SITE.mx
  let base = raw.replace(/\/+$/, "")
  if (base.endsWith("/posts")) base = base.slice(0, -"/posts".length)
  return base
}

function blogBase(): string {
  return (process.env.BLOG_BASE_URL?.trim() || SITE.blog).replace(/\/+$/, "")
}

function githubUser(): string {
  return process.env.GITHUB_USERNAME?.trim() || SITE.githubUser
}

async function getJson<T>(url: string, init?: RequestInit, ms = 8000): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    const response = await fetch(url, { ...init, signal: controller.signal })
    if (!response.ok) throw new Error(`${response.status} ${url}`)
    return (await response.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "teror-fox-site",
    "X-GitHub-Api-Version": "2022-11-28",
  }
  const token = process.env.GITHUB_TOKEN?.trim()
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

type MxPost = {
  id: string
  title: string
  slug: string
  summary?: string | null
  text?: string | null
  created_at?: string | null
  category?: { name?: string; slug?: string } | null
  images?: { src?: string }[] | null
}

type MxNote = {
  id: string
  nid?: number
  title?: string | null
  slug: string
  text?: string | null
  created_at?: string | null
  mood?: string | null
  weather?: string | null
}

function noteUrl(note: MxNote): string {
  const day = shanghaiDay(note.created_at)
  const [year, month, date] = day.split("-")
  const monthNum = String(Number(month))
  const dateNum = String(Number(date))
  return `${blogBase()}/notes/${year}/${monthNum}/${dateNum}/${note.slug}`
}

function toWriting(post: MxPost): WritingCard {
  const category = post.category?.name?.trim() || "文章"
  const slug = post.category?.slug
  const cover = post.images?.find((image) => image.src)?.src ?? null
  return {
    id: post.id,
    title: post.title,
    url: slug
      ? `${blogBase()}/posts/${slug}/${post.slug}`
      : `${blogBase()}/posts/${post.slug}`,
    date: shanghaiDay(post.created_at),
    category,
    excerpt: plain(post.summary || post.text, 88),
    cover: cover && /^https?:\/\//.test(cover) ? cover : null,
  }
}

function toNote(note: MxNote): NoteCard {
  return {
    id: note.id,
    title: note.title?.trim() || "无题",
    url: noteUrl(note),
    date: shanghaiDay(note.created_at),
    excerpt: plain(note.text, 110),
    mood: note.mood?.trim() || null,
    weather: note.weather?.trim() || null,
  }
}

async function loadPosts(): Promise<WritingCard[]> {
  return cached("posts", TEN_MINUTES, async () => {
    const payload = await getJson<{ data?: MxPost[] }>(
      `${mxBase()}/posts?page=1&size=12`,
    )
    return (payload.data ?? []).map(toWriting)
  })
}

async function loadNotes(): Promise<NoteCard[]> {
  return cached("notes", TEN_MINUTES, async () => {
    const payload = await getJson<{ data?: MxNote[] }>(
      `${mxBase()}/notes?page=1&size=8`,
    )
    return (payload.data ?? []).filter((note) => note.slug).map(toNote)
  })
}

type GhRepo = {
  name: string
  description: string | null
  language: string | null
  stargazers_count: number
  html_url: string
  pushed_at: string
  fork: boolean
  archived: boolean
}

type GhUser = {
  login: string
  name: string | null
  avatar_url: string
  followers: number
  public_repos: number
}

async function loadRepos(): Promise<{ user: GhUser; repos: RepoCard[]; stars: number }> {
  return cached("repos", TEN_MINUTES, async () => {
    const headers = githubHeaders()
    const login = githubUser()
    const user = await getJson<GhUser>(`https://api.github.com/users/${login}`, { headers })
    const pages = await Promise.all(
      [1, 2].map((page) =>
        getJson<GhRepo[]>(
          `https://api.github.com/users/${login}/repos?per_page=100&sort=pushed&page=${page}`,
          { headers },
        ).catch(() => [] as GhRepo[]),
      ),
    )
    const all = pages.flat()
    const stars = all.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0)
    const repos = all
      .filter((repo) => !repo.fork && !repo.archived)
      .sort((a, b) => Date.parse(b.pushed_at) - Date.parse(a.pushed_at))
      .slice(0, 12)
      .map((repo) => ({
        name: repo.name,
        description: repo.description ? plain(repo.description, 90) : null,
        language: repo.language,
        stars: repo.stargazers_count,
        url: repo.html_url,
        pushedAt: shanghaiDay(repo.pushed_at),
      }))
    return { user, repos, stars }
  })
}

const LEVEL: Record<string, number> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
}

function shiftDay(iso: string, delta: number): string {
  const date = new Date(`${iso}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + delta)
  return date.toISOString().slice(0, 10)
}

function toWeeks(days: HeatDay[]): HeatWeek[] {
  if (days.length === 0) return []
  const lead = new Date(`${days[0].date}T00:00:00Z`).getUTCDay()
  const cells: (HeatDay | null)[] = Array.from({ length: lead }, () => null)
  cells.push(...days)
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: HeatWeek[] = []
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push({ days: cells.slice(index, index + 7) })
  }
  return weeks
}

async function loadCalendar(login: string): Promise<{
  graphKind: "year" | "recent"
  yearTotal: number | null
  weeks: HeatWeek[]
}> {
  return cached("calendar", TEN_MINUTES, async () => {
    const token = process.env.GITHUB_TOKEN?.trim()
    if (token) {
      const official = await calendarOfficial(login, token).catch(() => null)
      if (official) return official
    }
    const scraped = await calendarPublic(login).catch(() => null)
    if (scraped) return scraped
    return calendarFromEvents(login)
  })
}

async function calendarOfficial(login: string, token: string) {
  const response = await getJson<{
    data?: {
      user?: {
        contributionsCollection?: {
          contributionCalendar?: {
            totalContributions: number
            weeks: {
              contributionDays: {
                date: string
                contributionCount: number
                contributionLevel: string
              }[]
            }[]
          }
        }
      }
    }
  }>(
    "https://api.github.com/graphql",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "teror-fox-site",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `query($login:String!){
          user(login:$login){
            contributionsCollection{
              contributionCalendar{
                totalContributions
                weeks{ contributionDays{ date contributionCount contributionLevel } }
              }
            }
          }
        }`,
        variables: { login },
      }),
    },
    9000,
  )
  const calendar = response.data?.user?.contributionsCollection?.contributionCalendar
  if (!calendar?.weeks?.length) return null
  const weeks = calendar.weeks.map((week) => ({
    days: week.contributionDays.map((day) => ({
      date: day.date,
      count: day.contributionCount,
      level: LEVEL[day.contributionLevel] ?? 0,
    })),
  }))
  return {
    graphKind: "year" as const,
    yearTotal: calendar.totalContributions,
    weeks,
  }
}

/**
 * 没有 token 时，用公开的贡献汇总。
 * 这不是 GitHub 官方接口；失败就退回公开事件，不编造一整年的格子。
 */
async function calendarPublic(login: string) {
  const payload = await getJson<{
    total?: { lastYear?: number }
    contributions?: { date: string; count: number; level: number }[]
  }>(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(login)}?y=last`, undefined, 8000)
  const days = payload.contributions
  if (!days?.length) return null
  const heat: HeatDay[] = days.map((day) => ({
    date: day.date,
    count: day.count,
    level: Math.max(0, Math.min(4, Math.round(day.level))),
  }))
  const summed = heat.reduce((sum, day) => sum + day.count, 0)
  return {
    graphKind: "year" as const,
    yearTotal: payload.total?.lastYear ?? summed,
    weeks: toWeeks(heat),
  }
}

async function calendarFromEvents(login: string) {
  const events = await getJson<{ type?: string; created_at?: string }[]>(
    `https://api.github.com/users/${login}/events/public?per_page=100`,
    { headers: githubHeaders() },
  )
  const counts = new Map<string, number>()
  for (const event of events) {
    if (!event.created_at) continue
    const day = shanghaiDay(event.created_at)
    counts.set(day, (counts.get(day) ?? 0) + 1)
  }
  const end = shanghaiDay(new Date().toISOString())
  const days: HeatDay[] = []
  for (let ago = 111; ago >= 0; ago -= 1) {
    const key = shiftDay(end, -ago)
    days.push({ date: key, count: counts.get(key) ?? 0, level: 0 })
  }
  const positive = days.map((day) => day.count).filter((count) => count > 0).sort((a, b) => a - b)
  const pick = (ratio: number) =>
    positive.length === 0
      ? 0
      : positive[Math.min(positive.length - 1, Math.floor((positive.length - 1) * ratio))]
  const t1 = pick(0.25)
  const t2 = pick(0.5)
  const t3 = pick(0.75)
  for (const day of days) {
    if (day.count <= 0) day.level = 0
    else if (day.count <= t1) day.level = 1
    else if (day.count <= t2) day.level = 2
    else if (day.count <= t3) day.level = 3
    else day.level = 4
  }
  const yearTotal = days.reduce((sum, day) => sum + day.count, 0)
  return {
    graphKind: "recent" as const,
    yearTotal,
    weeks: toWeeks(days),
  }
}

async function loadWeather(): Promise<WeatherNow> {
  return cached("weather", TEN_MINUTES, async () => {
    const { latitude, longitude } = SITE.nanjing
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${latitude}&longitude=${longitude}` +
      "&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m" +
      "&timezone=Asia%2FShanghai&wind_speed_unit=kmh"
    const payload = await getJson<{
      current?: {
        temperature_2m?: number
        relative_humidity_2m?: number
        weather_code?: number
        wind_speed_10m?: number
      }
    }>(url)
    const current = payload.current
    if (!current || typeof current.temperature_2m !== "number") {
      throw new Error("weather")
    }
    return {
      tempC: Math.round(current.temperature_2m),
      humidity: Math.round(current.relative_humidity_2m ?? 0),
      windKmh: Math.round(current.wind_speed_10m ?? 0),
      code: current.weather_code ?? 0,
    }
  })
}

async function loadGithub(): Promise<GithubDesk> {
  const [{ user, repos, stars }, calendar] = await Promise.all([
    loadRepos(),
    loadCalendar(githubUser()).catch(() => ({
      graphKind: "recent" as const,
      yearTotal: null,
      weeks: [],
    })),
  ])
  return {
    login: user.login,
    name: user.name?.trim() || SITE.author,
    avatar: user.avatar_url,
    followers: user.followers,
    publicRepos: user.public_repos,
    stars,
    graphKind: calendar.graphKind,
    yearTotal: calendar.yearTotal,
    weeks: calendar.weeks,
    repos,
  }
}

export async function loadHome(): Promise<HomePayload> {
  const [github, writing, notes, weather] = await Promise.all([
    loadGithub().catch(() => null),
    loadPosts().catch(() => [] as WritingCard[]),
    loadNotes().catch(() => [] as NoteCard[]),
    loadWeather().catch(() => null),
  ])
  return {
    generatedAt: new Date().toISOString(),
    github,
    writing: writing.slice(0, 4),
    note: notes[0] ?? null,
    weather,
  }
}

export async function loadShelf(): Promise<ShelfPayload> {
  const [writing, notes, github] = await Promise.all([
    loadPosts().catch(() => [] as WritingCard[]),
    loadNotes().catch(() => [] as NoteCard[]),
    loadGithub().catch(() => null),
  ])
  return {
    generatedAt: new Date().toISOString(),
    writing,
    notes,
    repos: github?.repos ?? [],
  }
}
