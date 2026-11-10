import { useEffect, useState } from "react"
import type { MouseEvent, ReactNode } from "react"
import { SITE } from "../shared/site"
import type { HomePayload } from "../shared/types"
import { deskCopy, shanghaiHour, type Locale } from "./copy"
import { Home } from "./home"
import { Shelf } from "./shelf"
import { useQuery } from "./useQuery"

type Theme = "dusk" | "paper"
type Page = "home" | "shelf"

function readBoot(): { theme: Theme; locale: Locale } {
  const theme = document.documentElement.dataset.theme === "paper" ? "paper" : "dusk"
  const locale = document.documentElement.dataset.locale === "en" ? "en" : "zh"
  return { theme, locale }
}

function usePath(): { path: string; go: (to: string) => void } {
  const [path, setPath] = useState(() => window.location.pathname)

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  const go = (to: string) => {
    if (to === window.location.pathname) {
      window.scrollTo(0, 0)
      return
    }
    const apply = () => {
      window.history.pushState(null, "", to)
      setPath(to)
      window.scrollTo(0, 0)
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!reduce && typeof document.startViewTransition === "function") {
      document.startViewTransition(apply)
      return
    }
    apply()
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
    themeColor?.setAttribute("content", theme === "paper" ? "#f3ecdf" : "#141820")
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

  return (
    <div className="page" onClick={onClick}>
      <a className="skip" href="#desk">
        {locale === "zh" ? "跳到内容" : "Skip to content"}
      </a>
      <header className="top">
        <a className="brand" href="/">
          <Fox />
          <span>Teror Fox</span>
        </a>
        <nav aria-label={locale === "zh" ? "页面" : "Pages"}>
          <a href="/" aria-current={page === "home" ? "page" : undefined}>
            {copy.navHome}
          </a>
          <a href="/shelf" aria-current={page === "shelf" ? "page" : undefined}>
            {copy.navShelf}
          </a>
        </nav>
        <div className="toggles">
          <button
            type="button"
            onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
            aria-label={locale === "zh" ? copy.toEnglish : copy.toChinese}
          >
            {locale === "zh" ? "EN" : "中文"}
          </button>
          <button
            type="button"
            onClick={() => setTheme(theme === "dusk" ? "paper" : "dusk")}
            aria-label={theme === "dusk" ? copy.toPaper : copy.toNight}
          >
            {theme === "dusk" ? copy.paper : copy.night}
          </button>
        </div>
      </header>

      <section className="sky" aria-hidden={false}>
        <div className="sky-stars" aria-hidden="true" />
        <div className="sky-inner">
          <p className={locale === "en" ? "motto motto-serif" : "motto"}>{copy.motto}</p>
          <p className={locale === "zh" ? "aside aside-serif" : "aside"}>{copy.mottoAside}</p>
          <div className="who">
            {home.data?.github?.avatar ? (
              <img src={home.data.github.avatar} alt="" width={36} height={36} />
            ) : (
              <Fox />
            )}
            <span>
              <strong>{SITE.author}</strong>
              <small>{SITE.studio}</small>
            </span>
          </div>
        </div>
      </section>

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
  )
}

function Fox() {
  return (
    <svg className="fox" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M5 24 L16 4 L27 24 L16 18 Z" />
    </svg>
  )
}

export function Frame({
  area,
  tone = "paper",
  label,
  children,
}: {
  area?: string
  tone?: "paper" | "ink"
  label?: string
  children: ReactNode
}) {
  return (
    <section className={`frame g-${area ?? "auto"}`} data-tone={tone}>
      {label ? <h2 className="frame-label">{label}</h2> : null}
      {children}
    </section>
  )
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
