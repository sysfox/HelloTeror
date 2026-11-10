# CLAUDE.md

个人主页，Vite + React，接口用 Hono。不要再装 Next.js。

## 命令

```bash
pnpm install
pnpm dev        # Vite 5173，代理 /api 到 Hono 8787
pnpm typecheck
pnpm build      # 前端 dist/，接口 dist-server/index.js
pnpm start      # NODE_ENV=production，同一端口提供页面和 /api
```

Node >= 22。包管理器是 pnpm。没有测试框架，提交前跑 `pnpm typecheck` 和 `pnpm build`。

## 结构

- `shared/site.ts` 名字、链接、南京坐标。`shared/types.ts` 是接口形状。
- `server/data.ts` 拉 MX-Space、GitHub、Open-Meteo，十分钟内存缓存。失败不编造格子。
- `src/copy.ts` 中英文各自写，不是逐句对译。
- `src/App.tsx` 管夜色/纸上、语言、主页和架上两条路径。
- 贡献图：有 `GITHUB_TOKEN` 走 GraphQL；否则用公开汇总；再失败只用近三个月公开事件，并标明不是完整的一年。
- 随笔链接按上海日历拼成 `/notes/年/月/日/slug`。文章是 `/posts/{分类 slug}/{slug}`。

视觉是自己的：夜空或纸色上的圆角框，琥珀和墨色。不要把别的个人主页的壁纸、角色、动态岛或资料库照搬过来。
