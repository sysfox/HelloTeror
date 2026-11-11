import { Hono } from "hono"
import { loadHome, loadShelf } from "./data.ts"

export const app = new Hono()

app.get("/api/home", async (c) => {
  const payload = await loadHome()
  c.header("cache-control", "public, max-age=120")
  return c.json(payload)
})

app.get("/api/shelf", async (c) => {
  const payload = await loadShelf()
  c.header("cache-control", "public, max-age=120")
  return c.json(payload)
})

app.get("/api/health", (c) => c.json({ ok: true }))
