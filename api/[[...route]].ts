// cache / text / site 也从这里引进去。Vercel 的文件追踪用 acorn，
// 读不了 data.ts 里的类型语法，看不到那三个运行时依赖。
import { handle } from "@hono/node-server/vercel"
import { app } from "../server/app.ts"
import "../server/cache.ts"
import "../server/text.ts"
import "../shared/site.ts"

export default handle(app)
