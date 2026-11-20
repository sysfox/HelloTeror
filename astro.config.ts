import { defineConfig } from "astro/config"
import node from "@astrojs/node"
import vercel from "@astrojs/vercel"

/** Vercel 构建会带上 VERCEL=1。本地和 CI 用 Node standalone，同一条 `pnpm start`。 */
const adapter = process.env.VERCEL ? vercel() : node({ mode: "standalone" })

export default defineConfig({
  output: "server",
  session: false,
  adapter,
  trailingSlash: "never",
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  vite: {
    build: {
      sourcemap: false,
      target: "es2023",
    },
  },
})
