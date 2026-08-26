# 乐知图谱

中小学音乐知识图谱工作台，按教材册次浏览作品、人物、音乐要素与教材证据。

## 本地运行

```bash
npm ci
npm run dev
```

## 构建

```bash
npm run build
```

GitHub Pages 使用 `GITHUB_PAGES=true` 生成静态导出，由 `.github/workflows/pages.yml` 自动构建和发布。

## 部署

推送到 `main` 后，GitHub Actions 会执行质量检查、静态构建和 GitHub Pages 发布。

发布地址：<https://zpw0211-netizen.github.io/lezhi-music-graph/>

## 功能边界

图谱浏览、搜索、六册叠加、单册切换、节点点击、缩放、作品档案和本地 JSON 校验均为静态功能。在线持久化导入接口需要独立后端；原 Cloudflare D1 处理器保留在 `server/cloudflare-import-route.ts` 作为后端迁移参考，GitHub Pages 不执行该接口。
