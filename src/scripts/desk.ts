import { formatToday, shanghaiHour } from "../copy.ts"

type Locale = "zh" | "en"
type Theme = "paper" | "dusk"

function play(apply: () => void) {
  document.documentElement.classList.add("settled")
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  if (!reduce && typeof document.startViewTransition === "function") {
    document.startViewTransition(apply)
    return
  }
  apply()
}

function persist(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* 隐私模式写不进 localStorage 时，cookie 仍然带着下一次整页请求。 */
  }
  document.cookie = `${key}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; SameSite=Lax`
}

function paintClock() {
  const hour = shanghaiHour()
  const table = readGreets()
  for (const node of document.querySelectorAll<HTMLElement>("[data-greet]")) {
    const locale = node.dataset.greet
    const line = locale === "zh" || locale === "en" ? table[locale]?.[hour] : undefined
    if (line) node.textContent = line
  }
  for (const node of document.querySelectorAll<HTMLElement>("[data-today]")) {
    const locale = node.dataset.today
    if (locale === "zh" || locale === "en") node.textContent = formatToday(locale)
  }
}

function readGreets(): Partial<Record<Locale, string[]>> {
  const raw = document.getElementById("greet-hours")?.textContent
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Partial<Record<Locale, string[]>>
  } catch {
    return {}
  }
}

function syncTitle(locale: Locale) {
  const root = document.documentElement
  document.title = locale === "zh" ? root.dataset.titleZh ?? document.title : root.dataset.titleEn ?? document.title
  const description = document.querySelector('meta[name="description"]')
  const next = locale === "zh" ? root.dataset.descriptionZh : root.dataset.descriptionEn
  if (description && next) description.setAttribute("content", next)
  for (const node of document.querySelectorAll<HTMLElement>("[data-title-zh]")) {
    const text = locale === "zh" ? node.dataset.titleZh : node.dataset.titleEn
    if (text) node.title = text
  }
}

document.addEventListener("click", (event) => {
  const target = event.target
  if (!(target instanceof Element)) return
  const button = target.closest<HTMLButtonElement>("[data-action]")
  if (!button) return
  const action = button.dataset.action
  if (action === "theme") {
    const next: Theme = document.documentElement.dataset.theme === "dusk" ? "paper" : "dusk"
    play(() => {
      document.documentElement.dataset.theme = next
      persist("teror-fox-theme", next)
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next === "paper" ? "#f5f5f5" : "#0a0a0a")
    })
  }
  if (action === "locale") {
    const next: Locale = document.documentElement.dataset.locale === "en" ? "zh" : "en"
    play(() => {
      document.documentElement.dataset.locale = next
      document.documentElement.lang = next === "zh" ? "zh-CN" : "en"
      persist("teror-fox-locale", next)
      syncTitle(next)
    })
  }
})

paintClock()
syncTitle(document.documentElement.dataset.locale === "en" ? "en" : "zh")
window.setInterval(paintClock, 60_000)

function loadAnalytics() {
  if (document.querySelector('script[data-website-id="c522847f-2a7f-58fe-87d7-22bf0d4bf765"]')) return
  const script = document.createElement("script")
  script.defer = true
  script.src = "https://umami.trfox.top/script.js"
  script.dataset.websiteId = "c522847f-2a7f-58fe-87d7-22bf0d4bf765"
  script.addEventListener("load", () => {
    const recorder = document.createElement("script")
    recorder.defer = true
    recorder.src = "https://umami.trfox.top/recorder.js"
    recorder.dataset.websiteId = "c522847f-2a7f-58fe-87d7-22bf0d4bf765"
    document.head.append(recorder)
  })
  document.head.append(script)
}

for (const type of ["pointerdown", "keydown"] as const) {
  window.addEventListener(type, loadAnalytics, { once: true, passive: true })
}
