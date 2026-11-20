# CLAUDE.md

个人主页，Astro，接口用 Hono。不要再装 Next.js，也不要把整页重新做成客户端应用。

## 命令

```bash
pnpm install
pnpm dev        # Astro 5173，页面和 /api 同一个进程
pnpm typecheck
pnpm test       # node:test，直接打 Hono app
pnpm build      # 本地适配器写出 dist/server/entry.mjs；VERCEL=1 时改用 Vercel 适配器
pnpm start      # 127.0.0.1:8787，同一端口提供页面和 /api
```

Node >= 22.23.4。包管理器是 pnpm。没有测试框架，提交前跑 `pnpm typecheck` 和 `pnpm build`。

## 结构

- `shared/site.ts` 名字、链接、南京坐标。`shared/types.ts` 是接口形状。
- `server/app.ts` 是 Hono 应用，只有 `/api/home`、`/api/shelf`、`/api/health`。`src/middleware.ts` 把 `/api` 交给它，其余走 Astro 页面。
- 页面在 `src/pages`，首屏就是 HTML。主题和语言靠 `data-theme` / `data-locale` 切换，不重新取数。统计脚本等第一次点击或按键再加载。
- `server/data.ts` 拉 MX-Space、GitHub、Open-Meteo，十分钟内存缓存。失败不编造格子。接口不读本地数据文件。
- `src/copy.ts` 中英文各自写，不是逐句对译。
- 贡献图：有 `GITHUB_TOKEN` 走 GraphQL；否则用公开汇总；再失败只用近三个月公开事件，并标明不是完整的一年。
- 随笔链接按上海日历拼成 `/notes/年/月/日/slug`。文章是 `/posts/{分类 slug}/{slug}`。
- 手写字体只留页眉用到的字，文件在 `public/fonts`。

视觉是自己的：夜空或纸色上的圆角框，琥珀和墨色。不要把别的个人主页的壁纸、角色、动态岛或资料库照搬过来。
