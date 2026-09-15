# V4 P0–P2 本地验收

没有 OpenAI key 和 Cloudflare 账号，尚未部署或接通真实 GPT。NEXT_PUBLIC_AI_API_URL 留空时，独立问答页使用本地实体链接、意图识别、图谱检索、教材证据读取与规则组织回答。不能称为 GPT 或智能推理。

## 后端准备

worker/ai-api.ts 从服务器指定 Pages 地址读取 graph-index 和按册 evidence，不接受浏览器事实或任意 URL。POST /ask 接收 question、最近六轮 question/answer/resolvedEntities、normal/analysis。模型事实本轮重新检索，历史不是证据。

仅允许 https://zpw0211-netizen.github.io origin，但 CORS 不是身份认证：非浏览器客户端可伪造 Origin。默认公共接口全局 30 次/分钟限额保护成本。生产启用前确认限额命名空间未与其他 Worker 冲突，配置预算；有需要再配置账号/Turnstile。服务端密钥使用 Worker secret，请求和回答不持久化。

用户授权后：wrangler login；wrangler secret put OPENAI_API_KEY --config worker/wrangler.jsonc；wrangler deploy --config worker/wrangler.jsonc。不要把 key 放入 NEXT_PUBLIC_*、聊天或 Git。Pages 构建设置 NEXT_PUBLIC_AI_API_URL=https://真实Worker地址/ask。普通模型 OPENAI_MODEL 默认 gpt-5.6-terra；分析 OPENAI_ANALYSIS_MODEL 默认 gpt-5.6-sol。Responses 使用 store:false 与严格 JSON schema。模型账号可用性尚待真实测试。

## 证据边界

未来公开部署时，在 GitHub 仓库 Settings → Secrets and variables → Actions → Variables 设置 NEXT_PUBLIC_AI_API_URL（只填写公开 Worker /ask URL）。Pages workflow 已预留该变量；未设置时仍是本地图谱模式。OpenAI 密钥只存 Worker secret，不填该公开变量。

按问题检索一/二跳、路径、作品和出现记录（最多120条相关关系，不上传完整图谱）。relationshipEvidenceById/evidenceByTriple 补足证据，occurrence 保留教材、单元、课时、PDF页。教材明示/乐谱可见才是教材明确知识；教材归纳、分析性补充和拓扑统计不能冒充教材原文。“分析维度=速度”不表示作品很快。跨册出现顺序不表示递进。

RAG 依赖现有抽取质量，不保证零幻觉，也不修复原始事实。P3/P4 补全候选、审核和合并脚本暂未实施，candidateKnowledge 恒为空，不写 canonical。quality:ai 验证十个问题与 mock Responses 通信；quality:ai-candidate 只审计当前禁止补全/写入的边界，不冒充完整候选schema验收。

## 本轮验收结果（2026-09-16）

1. UI：白色工作台、独立智能问答页、大输入框、四个建议问题；保留 WebGL、Canvas 回退、单册 SVG 与语义配色。
2. 简化：隐藏旧内嵌问答、装饰性英文标题、重复介绍和 KPI；Schema 默认收起、Inspector 默认关闭；导入入口归入更多/管理。不删除图谱数据或原有图谱能力。
3. 后端：独立 Worker 已实现并通过 dry-run 打包；CORS、预检、未配置密钥响应、模型请求结构完成本地/mock 测试。没有实际部署，也没有测试真实模型账号权限。
4. Pages：预留 NEXT_PUBLIC_AI_API_URL；配置后只向 Worker 发送问题、有限会话上下文和模式。当前为空，浏览器只读取本地静态图谱与按册教材证据，未调用 /api/ask 或 OpenAI。
5. 模型：服务端配置普通 gpt-5.6-terra、分析 gpt-5.6-sol；这是待接通配置，不代表已经运行模型。
6. 检索：意图识别、名称/别名链接、来源限制的一/二跳、最短路径与跨册出现；回答附关联实体，支持定位图谱。多轮追问保留主实体，历史回答不是证据。
7. 证据：按册读取并缓存，显示教材名、PDF 页、已有教材页码及来源层级。Inspector 打开后按需加载，避免未加载时长期显示 0；未经确认的补充不变为教材事实。
8. 十题：见下表和工作区 output/v4-local-acceptance/retrieval-results.json、browser-questions.json。真实 Chromium 逐题运行，人工检查答案；原因解释、概念定义、递进证据不足均如实保留缺口。
9. 数据：public/data 与提交前版本无 Git 差异；仅还原构建自动更新的时间/耗时与换行。1337 规范实体、4661 规范关系、0 孤立、0 悬空；没有 AI 写入。
10. 检查：lint 无错误/警告，TypeScript 无错误；quality:check、p0、v21、v22、v23、v3、pages、performance、ai、ai-candidate 均通过；生产静态导出通过；Worker dry-run 通过。候选审计仅证明当前禁写边界，完整 P3/P4 schema 尚未实现。
11. 提交：本地提交 SHA 随本轮交付报告给出；未 push，未改线上站点，等待用户本地验收。

| 问题 | 本地图谱回答检查 |
| --- | --- |
| 游击队歌的特点 | 中速稍快、明朗轻快/坚定沉着；教材证据可展开 |
| 为什么轻快机智 | 给出已有特点；明确缺少充分因果解释证据 |
| 保卫黄河作曲家 | 冼星海；不把改编者混入作曲答案 |
| 保卫黄河相关知识 | 表演形式、曲式/音色/音乐形象分析关联；归纳记录有边界说明 |
| 节奏跨年级递进 | 六册出现；无确认递进关系，不能冒充进阶 |
| 两首作品比较 | 列出各自已有创作者、体裁/形式、音乐要素；不断言相同风格 |
| 蒙古族作品 | 鸿雁、金杯、辽阔的草原、牧歌；无教材归属二跳扩散混入无关作品 |
| 贝多芬出现在哪里 | 九下 PDF 第9页、第五（命运）交响曲；仅为现有图谱记录 |
| 进行曲定义及作品 | 8 个直接关联作品；当前明确完整定义缺失，不用作品列表替代定义 |
| 教师怎样讲节奏 | 已有作品关联及规则生成的活动建议；建议不冒充教材目标或 GPT |

Chromium（桌面 Edge，1920×1080 / 1366×768）检查无 pageerror、Console error 或核心资源 404；Sigma 动态资源走 /lezhi-music-graph/。已检查四视角、单册/六册、Schema 收起展开、节点右键/拖动、路径高亮、Canvas 回退、追问和答案定位 Inspector、教材证据。最短路径额外验证《保卫黄河》到冼星海为 1 跳。

短采样：一次刷新至 Sigma 出现约 2407ms；十题浏览器提交至显示为 72–198ms（本地规则，不是 GPT 延迟）；连续缩放平移 1.8s 浏览器 requestAnimationFrame 采样约 49.2 FPS，JS heap 约 23–34MiB。该 FPS 是浏览器响应采样，不是渲染器逐帧基准；未进行长期内存泄漏或多设备性能实验。默认研究模式仍按需重绘。

本地预览：http://127.0.0.1:4174/lezhi-music-graph/。这不是公网地址；仅用于用户要求的本地验收。P0/P2 本地流程可验收，P1 真 GPT 接通仍未完成，P3/P4 暂停。
