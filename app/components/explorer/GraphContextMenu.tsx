"use client";
import { SCHEMA_CATEGORIES, schemaCategoryMeta } from "../../graph-schema";
import type { GraphExplorerState } from "./useGraphExplorer";

/** Right-click menu on a graph node: expand, isolate, pin, hide, inspect. */
export function GraphContextMenu({ explorer }: { explorer: GraphExplorerState }) {
  const { contextMenu } = explorer;
  if (!contextMenu) return null;
  const { entity, book } = contextMenu;
  const category = schemaCategoryMeta(entity.type);
  const pinned = explorer.pinnedNodeKeys.includes(`${book.key}-${entity.id}`);
  return (
    <div
      className="graph-context-menu"
      style={{ left: contextMenu.x, top: contextMenu.y }}
      onClick={(event) => event.stopPropagation()}
      role="menu"
    >
      <div className="context-title">
        <strong>{entity.name}</strong>
        <small style={{ color: category.color }}>{category.label}</small>
      </div>
      <button onClick={() => explorer.expandNode(entity, book, 1)}>展开一层相关知识点</button>
      <button onClick={() => explorer.expandNode(entity, book, 2)}>展开两层相关知识点</button>
      <button onClick={() => explorer.expandNode(entity, book, 3)}>展开三层相关知识点</button>
      <button
        onClick={() => {
          explorer.setHighlightedCanonicalIds([entity.id]);
          explorer.setHighlightedCanonicalRelationIds([]);
          explorer.setSelectedId(entity.id);
          explorer.setContextMenu(null);
        }}
      >
        只看此知识点
      </button>
      <button onClick={() => explorer.expandNode(entity, book, 2, "work")}>查看关联作品</button>
      <button onClick={() => explorer.openPathFinder(entity)}>查找路径</button>
      <div className="context-divider">按知识联系类型展开</div>
      {[...new Set(Object.values(book.relations))].slice(0, 7).map((label) => (
        <button key={`relation-expand-${label}`} onClick={() => explorer.expandNode(entity, book, 2, undefined, label)}>
          {label}
        </button>
      ))}
      <div className="context-divider">按知识点类型展开</div>
      {SCHEMA_CATEGORIES.filter((category) =>
        ["person", "genre", "instrument", "element", "textbook"].includes(category.key),
      ).map((category) => (
        <button key={category.key} onClick={() => explorer.expandNode(entity, book, 1, category.key)}>
          展开 → {category.label}
        </button>
      ))}
      <button onClick={explorer.undoView} disabled={!explorer.viewHistory.length}>
        撤销上次展开
      </button>
      <button onClick={explorer.collapseExpansion}>收起展开的知识点</button>
      <div className="context-divider" />
      <button onClick={() => explorer.togglePin(entity, book)}>{pinned ? "取消固定知识点" : "固定知识点"}</button>
      <button onClick={() => explorer.restoreNodePosition(entity, book)}>恢复布局位置</button>
      <button onClick={() => explorer.openKnowledge(entity, book)}>查看知识</button>
      <button onClick={() => explorer.selectEntity(entity, book, true)}>聚焦此知识点</button>
      <button onClick={() => explorer.showNodeEvidence(entity, book)}>查看教材出处</button>
      <button className="danger" onClick={() => explorer.hideNode(entity, book)}>
        隐藏知识点
      </button>
    </div>
  );
}
