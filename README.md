# 芽谱

**芽谱——中小学音乐教育知识图谱与智能分析平台**

按教材册次浏览作品、人物、音乐要素与教材证据，并探索六册教材之间的共享知识和跨册关联。

## 本地运行

```bash
npm ci
npm run dev
```

## 构建

```bash
npm run build
```

GitHub Pages 与 Sites 共用同一套前端。`GITHUB_PAGES=true` 只切换
`basePath`、静态数据来源和后端接口可用性，由
`.github/workflows/pages.yml` 自动完成质量审计、静态导出与发布。

## 部署

推送到 `main` 后，GitHub Actions 会执行质量检查、静态构建和 GitHub Pages 发布。

发布地址：<https://zpw0211-netizen.github.io/lezhi-music-graph/>

## 功能边界

图谱浏览、搜索、六册叠加、单册切换、节点点击、缩放、作品档案和本地 JSON 校验均为静态功能。在线持久化导入接口需要独立后端；原 Cloudflare D1 处理器保留在 `server/cloudflare-import-route.ts` 作为后端迁移参考，GitHub Pages 不执行该接口。
