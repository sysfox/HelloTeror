# Teror Fox

个人主页。夜色或纸上，一排自己的框：南京的天气、这一年的格子、手头的仓库、最近写下的东西。架上把文章、随笔、仓库和常去的地方摊开。

不是 Next.js。页面是 Astro，接口仍是 Hono，同一进程提供页面和 `/api`。

```bash
pnpm install
pnpm dev
```

打开 <http://127.0.0.1:5173>。

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm start
```

`pnpm start` 在 <http://127.0.0.1:8787>。部署到 Vercel 时构建会改用 Vercel 适配器。

环境变量见 `.env.example`。不填也能跑：博客、GitHub 和天气都有公开来源，取不到就在对应的框里说一声，页面照常在。
