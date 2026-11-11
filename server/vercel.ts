import { handle } from "@hono/node-server/vercel"
import { app } from "./app.ts"

/** Vercel 入口。构建时打成 api/[[...route]].js，函数里不再引用 .ts。 */
export default handle(app)
