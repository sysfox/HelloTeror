import { defineMiddleware } from "astro:middleware"
import { app } from "../server/app.ts"

const YEAR = 60 * 60 * 24 * 365

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname, searchParams } = context.url
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return app.fetch(context.request)
  }

  const locale = searchParams.get("locale")
  const theme = searchParams.get("theme")
  const localeOk = locale === "zh" || locale === "en"
  const themeOk = theme === "paper" || theme === "dusk"
  if (localeOk || themeOk) {
    if (localeOk) {
      context.cookies.set("teror-fox-locale", locale, { path: "/", maxAge: YEAR, sameSite: "lax" })
    }
    if (themeOk) {
      context.cookies.set("teror-fox-theme", theme, { path: "/", maxAge: YEAR, sameSite: "lax" })
    }
    const clean = new URL(context.url)
    clean.searchParams.delete("locale")
    clean.searchParams.delete("theme")
    return context.redirect(`${clean.pathname}${clean.search}`, 303)
  }

  const response = await next()
  response.headers.set("cache-control", "private, no-cache")
  return response
})
