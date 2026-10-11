# 芽谱项目 Claude 接续说明

项目目录：`E:\Projects\music-graph-site`
当前分支：`redesign/v6`
本地预览：`http://localhost:4312/#/timeline`（预览服务仍在运行）

## 当前已获用户认可的页面

用户刚确认学生向的作品年表页面“挺不错，就这样先”。该页面名为“音乐时光机”，面向中小学生，以课本歌曲聆听挑战、年代线索、作品对比和跳转到完整年表为主。当前设计先保持，不要擅自重做已确认的页面。

最近相关实现集中在：
- `app/components/timeline/TimelinePage.tsx`
- `app/timeline.css`
- `app/components/exploration/ExplorationPage.tsx`
- `app/page.tsx`

已验证：`tsc --noEmit`、改动 TSX 文件的 ESLint、`git diff --check` 均通过；本地预览 HTTP 200。Windows 下普通 `vinext dev` 遇到 Miniflare 运行时崩溃，因此预览以 `GITHUB_PAGES=true` 模式运行。

## 本轮协作与检查结果

- `scripts/test-lib.mjs`：82/82 通过。
- `scripts/smoke-pages.mjs` 的首页入口断言已更新为 2 项（“声音与音乐探索”“知识图谱”），符合合并地图、年表和律盘后的入口结构。页面导航、播放、图谱/问答和 375/768px 响应式检查均通过；严格控制台检查仍报告 Vinext 开发服务缺少两份生成的 Geist 字体（`/_next/static/_vinext_fonts/...woff2`）。仓库内没有 `check.ps1`。
- `audit-layout.mjs` 的 65 页审计在“音乐时光机”上未见 CLS ≥ 0.1；“五声律坊”首次进入在 1440×900 观察到 CLS 约 0.251，其中探索区首次出现贡献 0.223，律盘内容展开约贡献 0.028。用户认可了当前视觉布局，先不要为消除位移重排版；合并后可继续排查初始化跳动。
- 开发服务器只在根路径响应，而静态资源配置使用 `/lezhi-music-graph/`。做本地完整资源检查时可通过 E 盘临时代理 `http://localhost:4313/lezhi-music-graph/` 映射到 `http://localhost:4312/`；临时脚本位于 `E:\Projects\.tmp\music-graph-site\basepath-proxy.mjs`。

## 协作时请先检查

当前工作区不是干净状态：分支 `redesign/v6` 有 21 个已修改文件和 3 个新增路径（总计 24 项，含本交接文件及 smoke 断言更新），包含前序芽谱导航、律盘、五声律坊、浅色主题、探索页及年表页面改动。不要执行会清理或重置工作区的操作；改动其他页面前先查看对应 diff，保留用户和 Codex 的现有修改。

Claude 桌面端当前的 `music-graph-site` 项目会话有两个“Haiku verify”后台任务正在运行，且会话里提到按课学习重设计等待 Codex 当前工作结束后再合并。请先查看任务是否完成，并与其现有结果协调，再继续后续工作，避免并行改写相同文件。

Claude 在当前会话中请 Codex 先提交 `redesign/v6` 分支改动，再由 Claude 合并“按课学习”。Claude 指定暂时不要改：`app/components/records/WorkLibrary.tsx`、`app/records.css` 的阅读区、`app/lib/records/*`、`app/lib/lesson/melodies-g*.ts`。提交后由 Claude 跑合并后的完整检查并核对绿色白色配色。

## 用户最近指示

用户要求把当前成果接入 Claude，并由 Codex 配合 Claude 做后续工作。当前页面先维持已认可版本；后续修改以用户新的具体意见和 Claude 当前任务结果为准。
