/** 主页与架上共用的数据形状。日期一律是上海时区的 YYYY-MM-DD。 */

export type HeatDay = {
  date: string
  count: number
  level: number
}

export type HeatWeek = {
  days: (HeatDay | null)[]
}

export type RepoCard = {
  name: string
  description: string | null
  language: string | null
  stars: number
  url: string
  pushedAt: string
}

export type GithubDesk = {
  login: string
  name: string
  avatar: string
  followers: number
  publicRepos: number
  stars: number
  /** year：大约过去 365 天。recent：只有公开事件，不能当成完整的一年。 */
  graphKind: "year" | "recent"
  yearTotal: number | null
  weeks: HeatWeek[]
  repos: RepoCard[]
}

export type WritingCard = {
  id: string
  title: string
  url: string
  date: string
  category: string
  excerpt: string
  cover: string | null
}

export type NoteCard = {
  id: string
  title: string
  url: string
  date: string
  excerpt: string
  mood: string | null
  weather: string | null
}

export type WeatherNow = {
  tempC: number
  humidity: number
  windKmh: number
  code: number
}

export type HomePayload = {
  generatedAt: string
  github: GithubDesk | null
  writing: WritingCard[]
  note: NoteCard | null
  weather: WeatherNow | null
}

export type ShelfPayload = {
  generatedAt: string
  writing: WritingCard[]
  notes: NoteCard[]
  repos: RepoCard[]
}
