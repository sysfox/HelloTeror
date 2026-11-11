import { readFileSync, existsSync, statSync } from "node:fs"
import { extname, join, normalize, sep } from "node:path"
import { serve } from "@hono/node-server"
import { app } from "./app.ts"

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
}

function fileFor(urlPath: string): string | null {
  const dist = join(process.cwd(), "dist")
  let decoded = urlPath
  try {
    decoded = decodeURIComponent(urlPath.split("?")[0] ?? "/")
  } catch {
    return null
  }
  const rel = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "")
  const full = normalize(join(dist, rel))
  if (full !== dist && !full.startsWith(dist + sep)) return null
  if (existsSync(full) && statSync(full).isFile()) return full
  if (extname(rel)) return null
  const index = join(dist, "index.html")
  return existsSync(index) ? index : null
}

app.get("*", (c) => {
  if (process.env.NODE_ENV !== "production") return c.notFound()
  if (c.req.path === "/api" || c.req.path.startsWith("/api/")) return c.notFound()
  const file = fileFor(c.req.path)
  if (!file) return c.notFound()
  const type = TYPES[extname(file)] ?? "application/octet-stream"
  const cache = file.endsWith(`${sep}index.html`)
    ? "no-cache"
    : "public, max-age=31536000, immutable"
  return c.body(readFileSync(file), 200, {
    "content-type": type,
    "cache-control": cache,
  })
})

const port = Number(process.env.PORT ?? 8787)

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, (info) => {
  console.log(`teror-fox listening on ${info.port}`)
})
