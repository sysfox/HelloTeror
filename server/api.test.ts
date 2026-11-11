import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync } from "node:fs"
import { createServer } from "node:http"
import type { AddressInfo } from "node:net"
import { once } from "node:events"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"
import type { HomePayload, ShelfPayload } from "../shared/types.ts"
import { app } from "./app.ts"

const bundleUrl = new URL("../api/[[...route]].js", import.meta.url)
const { default: handler } = await import(bundleUrl.href)

function assertHome(body: HomePayload) {
  assert.equal(typeof body.generatedAt, "string")
  assert.ok(Number.isFinite(Date.parse(body.generatedAt)))
  assert.ok(Array.isArray(body.writing))
  assert.ok(body.note === null || typeof body.note.url === "string")
  assert.ok(body.github === null || typeof body.github.login === "string")
  assert.ok(body.weather === null || typeof body.weather.tempC === "number")
}

function assertShelf(body: ShelfPayload) {
  assert.equal(typeof body.generatedAt, "string")
  assert.ok(Number.isFinite(Date.parse(body.generatedAt)))
  assert.ok(Array.isArray(body.writing))
  assert.ok(Array.isArray(body.notes))
  assert.ok(Array.isArray(body.repos))
}

test("GET /api/health returns ok", async () => {
  const response = await app.request("/api/health")
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { ok: true })
})

test("GET /api/home returns the home payload", async () => {
  const response = await app.request("/api/home")
  assert.equal(response.status, 200)
  assert.match(response.headers.get("content-type") ?? "", /application\/json/)
  assert.match(response.headers.get("cache-control") ?? "", /max-age=120/)
  assertHome((await response.json()) as HomePayload)
})

test("GET /api/shelf returns the shelf payload", async () => {
  const response = await app.request("/api/shelf")
  assert.equal(response.status, 200)
  assert.match(response.headers.get("content-type") ?? "", /application\/json/)
  assert.match(response.headers.get("cache-control") ?? "", /max-age=120/)
  assertShelf((await response.json()) as ShelfPayload)
})

test("exported app does not serve the SPA shell", async () => {
  const response = await app.request("/shelf")
  assert.equal(response.status, 404)
})

test("deployed vercel bundle does not import TypeScript files", () => {
  const committed = readFileSync(bundleUrl, "utf8")
  const dir = mkdtempSync(join(tmpdir(), "vercel-fn-"))
  const outfile = join(dir, "route.js")
  execFileSync(
    "pnpm",
    [
      "exec",
      "esbuild",
      "server/vercel.ts",
      "--bundle",
      "--platform=node",
      "--format=esm",
      "--packages=external",
      `--outfile=${outfile}`,
    ],
    { cwd: fileURLToPath(new URL("..", import.meta.url)) },
  )
  assert.equal(committed, readFileSync(outfile, "utf8"))
  assert.doesNotMatch(committed, /from\s+["'][^"']*\.ts["']/)
  assert.doesNotMatch(committed, /from\s+["']\.\.?\//)
})

test("vercel handler serves /api/home and /api/shelf", async () => {
  const server = createServer((req, res) => {
    void handler(req, res)
  })
  server.listen(0, "127.0.0.1")
  await once(server, "listening")
  const { port } = server.address() as AddressInfo
  try {
    const home = await fetch(`http://127.0.0.1:${port}/api/home`)
    assert.equal(home.status, 200)
    assert.match(home.headers.get("content-type") ?? "", /application\/json/)
    assertHome((await home.json()) as HomePayload)

    const shelf = await fetch(`http://127.0.0.1:${port}/api/shelf`)
    assert.equal(shelf.status, 200)
    assert.match(shelf.headers.get("content-type") ?? "", /application\/json/)
    assertShelf((await shelf.json()) as ShelfPayload)
  } finally {
    server.closeAllConnections()
    server.close()
    await once(server, "close")
  }
})
