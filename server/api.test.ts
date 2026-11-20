import assert from "node:assert/strict"
import { test } from "node:test"
import type { HomePayload, ShelfPayload } from "../shared/types.ts"
import { app } from "./app.ts"

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

test("exported app does not serve pages", async () => {
  const response = await app.request("/shelf")
  assert.equal(response.status, 404)
})
