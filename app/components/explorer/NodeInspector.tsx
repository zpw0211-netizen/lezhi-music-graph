"use client";
import { schemaCategoryFor, schemaCategoryMeta } from "../../graph-schema";
import { publicAssetUrl } from "../../lib/app/assets";
import { isWorkType, type Entity, type Evidence, type KnowledgeOccurrence, type Triple } from "../../lib/app/types";
import { NodeAIInterpretation } from "../assistant/NodeAIInterpretation";
import { WorkbenchIcon } from "../WorkbenchIcon";
import type { GraphExplorerState, InspectorTab } from "./useGraphExplorer";

export type InspectorFact = { triple: Triple; label: string; value: string; target?: Entity };
export type InspectorEvidence = Evidence & { triple: Triple };

/** 知识档案: the right-hand panel describing the selected node. */
export function NodeInspector({
  explorer,
  directTriples,
  facts,
  evidence,
  occurrences,
}: {
  explorer: GraphExplorerState;
  directTriples: Triple[];
  facts: InspectorFact[];
  evidence: InspectorEvidence[];
  occurrences: KnowledgeOccurrence[];
}) {
  const { selected, panel, setPanel, inspectionBook, inspectionRuntime, graphMode, currentBook, books } = explorer;
  const entityMap = inspectionRuntime.entityMap;
  const relationLabel = (triple: Triple) => explorer.relationText(triple.predicate);
  const objectLabel = (triple: Triple) =>
    triple.objectId ? (entityMap.get(triple.objectId)?.name ?? triple.objectId) : (triple.literal ?? "未命名客体");
  const select = (entity: Entity) => explorer.selectEntity(entity, inspectionBook);
  const selectedType = selected?.type ?? "音乐概念";
  const tabs: Array<[InspectorTab, string]> = [
    ["overview", "概览"],
    ["relations", `关系 ${directTriples.length}`],
    ["occurrences", `跨册 ${selected?.textbookCount ?? 1}/6`],
    ["evidence", `教材证据 ${evidence.length}`],
    ["teaching", "教学应用"],
  ];

  return (
    <aside className="inspector" aria-label="节点检查器">
      <div className="inspector-titlebar">
        <span>知识档案</span>
        <button className="inspector-close" aria-label="关闭节点检查器" onClick={() => explorer.setInspectorOpen(false)}>
          <WorkbenchIcon name="close" />
        </button>
      </div>
      <section className="inspector-card">
        <header className="inspector-header">
          <div className={`inspector-icon schema-${schemaCategoryFor(selectedType)}`}>
            <WorkbenchIcon name={schemaCategoryFor(selectedType) === "person" ? "person" : "music"} />
          </div>
          <div>
            <span>{schemaCategoryMeta(selectedType).neoLabel}</span>
            <h2>{selected?.name ?? "未选择实体"}</h2>
            <small>{selected?.type ?? "实体"}</small>
          </div>
        </header>
        <button
          className="knowledge-open-button"
          aria-label="查看知识 ↗"
          onClick={() => selected && explorer.openKnowledge(selected, inspectionBook)}
        >
          查看知识 <WorkbenchIcon name="arrow" />
        </button>
        <div className="inspector-tabs">
          {tabs.map(([key, label]) => (
            <button key={key} className={panel === key ? "active" : ""} onClick={() => setPanel(key)}>
              {label}
            </button>
          ))}
        </div>
        {panel === "overview" && (
          <div className="inspector-body">
            <p>{selected?.description || "该节点来自教材知识图谱，可继续查看关系、来源证据与教学应用。"}</p>
            {!!selected?.media?.some((asset) => asset.kind === "score") && (
              <section className="inspector-scores" aria-label="教材谱例">
                <h3>教材谱例</h3>
                {selected.media
                  .filter((asset) => asset.kind === "score")
                  .map((asset) => (
                    <a key={asset.url} href={publicAssetUrl(asset.url)} target="_blank" rel="noreferrer" title="打开原尺寸谱例">
                      {/* Score crops are static WebP files; no image optimizer on GitHub Pages. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img loading="lazy" src={publicAssetUrl(asset.url)} alt={asset.title ?? "教材谱例"} />
                      <small>{asset.source}</small>
                    </a>
                  ))}
              </section>
            )}
            <dl>
              <div>
                <dt>语义标签</dt>
                <dd>{schemaCategoryMeta(selectedType).label}</dd>
              </div>
              <div>
                <dt>首次出现</dt>
                <dd>PDF 第 {selected?.firstPage ?? "—"} 页</dd>
              </div>
              <div>
                <dt>关系数量</dt>
                <dd>{directTriples.length} 条</dd>
              </div>
              <div>
                <dt>当前教材</dt>
                <dd>
                  {graphMode === "all"
                    ? `六册共享 · 覆盖${selected?.textbookCount ?? 1}册`
                    : `${currentBook.grade}年级${currentBook.semester}`}
                </dd>
              </div>
              <div>
                <dt>可信度</dt>
                <dd>{selected?.confidence ? `${Math.round(selected.confidence * 100)}%` : "教材已收录"}</dd>
              </div>
            </dl>
            {isWorkType(selected?.type) && facts.length > 0 && (
              <section className="inspector-fact-grid">
                <h3>作品知识属性</h3>
                <div>
                  {facts.map(({ triple, label, value, target }) => (
                    <button type="button" key={triple.id} disabled={!target} onClick={() => target && select(target)}>
                      <span>
                        {label}
                        {triple.extended && (
                          <em className="fact-extended" title="教材之外的拓展知识（已审阅）">
                            拓展
                          </em>
                        )}
                      </span>
                      <strong>{value}</strong>
                    </button>
                  ))}
                </div>
              </section>
            )}
            {graphMode === "all" && selected?.canonicalKey && (
              <section className="cross-book-inspector-summary">
                <h3>跨册出现分析</h3>
                <div className="cross-book-metrics">
                  <span>
                    <b>{selected.textbookCount ?? 1}</b>出现教材数
                  </span>
                  <span>
                    <b>{selected.occurrenceCount ?? 1}</b>出现次数
                  </span>
                  <span>
                    <b>{Math.round(((selected.textbookCount ?? 1) / Math.max(1, books.length)) * 100)}%</b>
                    教材覆盖率
                  </span>
                </div>
                <ol>
                  {occurrences.slice(0, 6).map((occurrence) => (
                    <li key={occurrence.id}>
                      <strong>{occurrence.textbookTitle}</strong>
                      <span>
                        {occurrence.unit ?? "所属单元待细化"} · PDF第{occurrence.page ?? "—"}页
                      </span>
                    </li>
                  ))}
                </ol>
                <p>前置、复现、深化和扩展关系仅在具备教材证据或人工确认后显示；当前不会自动推断创建。</p>
              </section>
            )}
            <NodeAIInterpretation name={selected?.name ?? "当前节点"} onAsk={explorer.ask} />
            <div className="inspector-actions-grid">
              <button onClick={() => selected && explorer.expandNode(selected, inspectionBook, 1)}>展开 1 跳</button>
              <button onClick={() => selected && explorer.expandNode(selected, inspectionBook, 2)}>展开 2 跳</button>
              <button onClick={() => selected && explorer.openPathFinder(selected)}>查找路径</button>
              <button onClick={() => selected && explorer.selectEntity(selected, inspectionBook, true)}>定位节点</button>
              <button onClick={() => setPanel("evidence")}>查看证据</button>
              {selected && isWorkType(selected.type) ? (
                <button onClick={() => explorer.openLesson(selected)}>学习这一课</button>
              ) : (
                <button onClick={explorer.openRecords}>按课学习</button>
              )}
            </div>
          </div>
        )}
        {panel === "relations" && (
          <div className="inspector-relations">
            {directTriples.length ? (
              directTriples.slice(0, 30).map((triple) => {
                const outgoing = triple.subject === selected?.id;
                const targetId = outgoing ? triple.objectId : triple.subject;
                const target = targetId ? entityMap.get(targetId) : undefined;
                return (
                  <button key={triple.id} onClick={() => target && select(target)}>
                    <span className="relation-direction">{outgoing ? "→" : "←"}</span>
                    <span>
                      <b>{relationLabel(triple)}</b>
                      <small>{target?.name ?? triple.literal ?? "属性值"}</small>
                    </span>
                    <em>P{triple.sourcePage ?? "—"}</em>
                  </button>
                );
              })
            ) : (
              <p className="empty-state">当前节点暂无正式关系。</p>
            )}
          </div>
        )}
        {panel === "occurrences" && (
          <div className="inspector-occurrences">
            <section className="occurrence-summary">
              <span className="eyebrow muted">CANONICAL OCCURRENCE</span>
              <h3>跨册出现</h3>
              <div className="cross-book-metrics">
                <span>
                  <b>{selected?.textbookCount ?? 1} / 6</b>覆盖教材
                </span>
                <span>
                  <b>{selected?.occurrenceCount ?? 1}</b>出现次数
                </span>
                <span>
                  <b>{directTriples.length}</b>相关关系
                </span>
              </div>
            </section>
            <ol className="occurrence-list">
              {occurrences.map((occurrence, index) => (
                <li key={occurrence.id}>
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  <span>
                    <strong>{occurrence.textbookTitle}</strong>
                    <small>
                      {occurrence.unit ?? "所属单元待细化"} · PDF 第{occurrence.page ?? "—"}页
                    </small>
                  </span>
                </li>
              ))}
            </ol>
            <section className="related-knowledge-summary">
              <h3>相关作品与知识</h3>
              <div>
                {[
                  ...new Map(
                    directTriples
                      .map((triple) => entityMap.get(triple.subject === selected?.id ? (triple.objectId ?? "") : triple.subject))
                      .filter((entity): entity is Entity => Boolean(entity))
                      .map((entity) => [entity.id, entity]),
                  ).values(),
                ]
                  .slice(0, 12)
                  .map((entity) => (
                    <button key={entity.id} onClick={() => select(entity)}>
                      <i style={{ background: schemaCategoryMeta(entity.type).color }} />
                      {entity.name}
                    </button>
                  ))}
              </div>
            </section>
          </div>
        )}
        {panel === "evidence" && (
          <div className="evidence-list inspector-evidence">
            {evidence.length ? (
              evidence.slice(0, 30).map((item, index) => (
                <div className="evidence-item" key={`${item.triple.id}-${item.pdfPage}-${index}`}>
                  <div className="evidence-page">
                    {item.pdfPage ?? "—"}
                    <small>PDF</small>
                  </div>
                  <div>
                    <strong>
                      {relationLabel(item.triple)} · {objectLabel(item.triple)}
                    </strong>
                    <p>{item.summary || "教材关系证据记录"}</p>
                    <small>
                      {item.bookTitle ?? inspectionBook.title} ·{" "}
                      {item.textbookPage ? `教材第${item.textbookPage}页` : "教材页码待对应"}
                    </small>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-state">该节点暂未绑定可显示的教材证据。</p>
            )}
          </div>
        )}
        {panel === "teaching" && (
          <div className="inspector-teaching">
            <section className="teaching-path">
              <span className="eyebrow muted">课堂路径</span>
              <h3>从作品事实到音乐理解</h3>
              <ol>
                <li>观察节点的作品、人物与教材位置</li>
                <li>展开体裁、乐器和音乐要素关系</li>
                <li>结合教材证据组织欣赏或实践活动</li>
              </ol>
            </section>
            <section className="media-card">
              <div className="media-head">
                <div>
                  <span className="eyebrow muted">多模态资料</span>
                  <h3>音频 · 视频 · 乐谱</h3>
                </div>
                <b>{selected?.media?.length ?? 0}</b>
              </div>
              {selected?.media?.length ? (
                <div className="media-list">
                  {selected.media.map((asset, index) => (
                    <div className="media-item" key={asset.url + index}>
                      <strong>
                        {asset.title ?? (asset.kind === "audio" ? "音频资料" : asset.kind === "video" ? "视频资料" : "乐谱资料")}
                      </strong>
                      {asset.kind === "audio" && <audio controls preload="none" src={asset.url} />}
                      {asset.kind === "video" && <video controls preload="metadata" src={asset.url} />}
                      {asset.kind === "score" && (
                        <a href={publicAssetUrl(asset.url)} target="_blank" rel="noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img loading="lazy" src={publicAssetUrl(asset.url)} alt={asset.title ?? "教材谱例"} />
                        </a>
                      )}
                      <small>{asset.source ?? "外部资源链接"}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <p>已保留多模态挂载位，后续可直接关联教材乐谱、音频、视频或教学链接。</p>
              )}
            </section>
          </div>
        )}
      </section>
    </aside>
  );
}
