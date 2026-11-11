import { useEffect, useState } from "react"
import type { MouseEvent, ReactNode } from "react"
import { flushSync } from "react-dom"
import { SITE } from "../shared/site"
import type { HomePayload } from "../shared/types"
import { deskCopy, shanghaiHour, type Locale } from "./copy"
import { Home } from "./home"
import { CloudMark, HomeMark, MoonMark, RainMark, ShelfMark, SunMark } from "./icons"
import { Shelf } from "./shelf"
import { useQuery } from "./useQuery"

type Theme = "dusk" | "paper"
type Page = "home" | "shelf"

function readBoot(): { theme: Theme; locale: Locale } {
  const theme = document.documentElement.dataset.theme === "dusk" ? "dusk" : "paper"
  const locale = document.documentElement.dataset.locale === "en" ? "en" : "zh"
  return { theme, locale }
}

function play(apply: () => void) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  document.documentElement.classList.add("settled")
  if (!reduce && typeof document.startViewTransition === "function") {
    document.startViewTransition(() => {
      flushSync(apply)
    })
    return
  }
  apply()
}

function usePath(): { path: string; go: (to: string) => void } {
  const [path, setPath] = useState(() => window.location.pathname)

  useEffect(() => {
    const onPop = () => play(() => setPath(window.location.pathname))
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  const go = (to: string) => {
    if (to === window.location.pathname) {
      window.scrollTo(0, 0)
      return
    }
    play(() => {
      window.history.pushState(null, "", to)
      setPath(to)
      window.scrollTo(0, 0)
    })
  }

  return { path, go }
}

export function App() {
  const boot = readBoot()
  const [theme, setTheme] = useState<Theme>(boot.theme)
  const [locale, setLocale] = useState<Locale>(boot.locale)
  const { path, go } = usePath()
  const home = useQuery<HomePayload>("/api/home")
  const copy = deskCopy(locale)
  const page: Page = path === "/shelf" ? "shelf" : "home"
  const [hour, setHour] = useState(() => shanghaiHour())

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.dataset.locale = locale
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en"
    document.title = copy.title
    const themeColor = document.querySelector('meta[name="theme-color"]')
    themeColor?.setAttribute("content", theme === "paper" ? "#f5f5f5" : "#0a0a0a")
    try {
      localStorage.setItem("teror-fox-theme", theme)
      localStorage.setItem("teror-fox-locale", locale)
    } catch {
      /* 隐私模式写不进 localStorage 时，这一次的选择仍然生效。 */
    }
  }, [theme, locale, copy.title])

  useEffect(() => {
    const timer = window.setInterval(() => setHour(shanghaiHour()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const onClick = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return
    }
    const anchor = (event.target as Element | null)?.closest("a")
    if (!anchor) return
    const href = anchor.getAttribute("href")
    if (!href || href.startsWith("http") || href.startsWith("mailto:")) return
    const url = new URL(anchor.href, window.location.origin)
    if (url.origin !== window.location.origin) return
    if (url.pathname !== "/" && url.pathname !== "/shelf") return
    event.preventDefault()
    go(url.pathname)
  }

  const weather = home.data?.weather ?? null

  return (
    <div className="page" onClick={onClick}>
      <div className="wallpaper" aria-hidden="true" />
      <div className="wash" aria-hidden="true" />
      <a className="skip" href="#desk">
        {locale === "zh" ? "跳到内容" : "Skip to content"}
      </a>
      <nav className="island" aria-label={locale === "zh" ? "页面" : "Pages"}>
        <a className={page === "home" ? "nav-item is-on" : "nav-item"} href="/" aria-current={page === "home" ? "page" : undefined}>
          <HomeMark />
          <span className="sr">{copy.navHome}</span>
        </a>
        <a className={page === "shelf" ? "nav-item is-on" : "nav-item"} href="/shelf" aria-current={page === "shelf" ? "page" : undefined}>
          <ShelfMark />
          <span className="sr">{copy.navShelf}</span>
        </a>
        <button
          className="nav-item"
          type="button"
          onClick={() => play(() => setTheme(theme === "dusk" ? "paper" : "dusk"))}
          aria-label={theme === "dusk" ? copy.toPaper : copy.toNight}
        >
          {theme === "dusk" ? <SunMark /> : <MoonMark />}
        </button>
        <button
          className="nav-item nav-locale"
          type="button"
          onClick={() => play(() => setLocale(locale === "zh" ? "en" : "zh"))}
          aria-label={locale === "zh" ? copy.toEnglish : copy.toChinese}
        >
          {locale === "zh" ? "EN" : "中"}
        </button>
      </nav>

      <div className="wx-pill">
        {weather ? <WeatherGlyph code={weather.code} /> : <CloudMark />}
        <span>
          <strong>
            {weather ? `${weather.tempC}°C ${copy.weatherWord(weather.code)}` : copy.weatherMiss}
          </strong>
          <small>{locale === "zh" ? "南京" : "Nanjing"}</small>
        </span>
      </div>

      <div className={page === "home" ? "cluster cluster-home" : "cluster cluster-shelf"}>
        <main id="desk">
          {page === "home" ? (
            <Home copy={copy} locale={locale} hour={hour} query={home} />
          ) : (
            <Shelf copy={copy} locale={locale} />
          )}
        </main>
        <footer className="foot">
          <span>
            © {SITE.startYear}–{new Date().getFullYear()} {SITE.author}
          </span>
          <a href={SITE.icp.url} target="_blank" rel="noreferrer">
            {SITE.icp.number}
          </a>
          <span>{SITE.studio}</span>
        </footer>
      </div>
    </div>
  )
}

function WeatherGlyph({ code }: { code: number }) {
  if (code >= 95 || (code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return <RainMark />
  if (code === 0 || code === 1) return <SunMark />
  return <CloudMark />
}

export function Miss({ children }: { children: ReactNode }) {
  return <p className="miss">{children}</p>
}

export function Bones() {
  return (
    <div className="bones" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  )
}
