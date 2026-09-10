"use client";

import { useMemo, useState } from "react";
import type { GraphEntity, GraphPath } from "../../lib/graph/types";

type Props<E extends GraphEntity = GraphEntity> = {
  open: boolean;
  entities: E[];
  startId: string;
  endId: string;
  paths: GraphPath[];
  activePathIndex: number;
  onStartChange: (id: string) => void;
  onEndChange: (id: string) => void;
  onPathIndexChange: (index: number) => void;
  onApply: () => void;
  onClose: () => void;
};

type EntityPickerProps<E extends GraphEntity> = {
  label: string;
  value: string;
  entities: E[];
  onChange: (id: string) => void;
};

function EntityPicker<E extends GraphEntity>({
  label,
  value,
  entities,
  onChange,
}: EntityPickerProps<E>) {
  const selected = entities.find((entity) => entity.id === value);
  const [query, setQuery] = useState(selected?.name ?? "");
  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return entities.slice(0, 8);
    return entities
      .filter((entity) =>
        [entity.name, entity.type, ...(entity.aliases ?? [])]
          .join(" ")
          .toLowerCase()
          .includes(term),
      )
      .slice(0, 8);
  }, [entities, query]);
  return (
    <label className="path-entity-picker">
      <span>{label}</span>
      <input
        value={query}
        placeholder="输入实体名称"
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setQuery(selected?.name ?? query)}
      />
      {query && (!selected || selected.name !== query) && (
        <div className="path-entity-results">
          {matches.map((entity) => (
            <button
              type="button"
              key={entity.id}
              onClick={() => {
                onChange(entity.id);
                setQuery(entity.name);
              }}
            >
              <strong>{entity.name}</strong>
              <small>{entity.type}</small>
            </button>
          ))}
          {!matches.length && <p>未找到匹配实体</p>}
        </div>
      )}
    </label>
  );
}

export function GraphPathFinder<E extends GraphEntity>({
  open,
  entities,
  startId,
  endId,
  paths,
  activePathIndex,
  onStartChange,
  onEndChange,
  onPathIndexChange,
  onApply,
  onClose,
}: Props<E>) {
  const entityMap = useMemo(
    () => new Map(entities.map((entity) => [entity.id, entity])),
    [entities],
  );
  if (!open) return null;
  const path = paths[activePathIndex];
  return (
    <aside className="graph-path-finder" aria-label="图谱路径查询">
      <header>
        <div>
          <span>GRAPH PATH FINDER</span>
          <h3>最短路径查询</h3>
        </div>
        <button type="button" onClick={onClose} aria-label="关闭路径查询">
          ×
        </button>
      </header>
      <div className="path-pickers">
        <EntityPicker
          key={`start-${startId}`}
          label="起点"
          value={startId}
          entities={entities}
          onChange={onStartChange}
        />
        <span className="path-arrow">→</span>
        <EntityPicker
          key={`end-${endId}`}
          label="终点"
          value={endId}
          entities={entities}
          onChange={onEndChange}
        />
      </div>
      <div className="path-result-summary">
        {!startId || !endId ? (
          <p>选择两个实体后，系统会在当前规范知识网络中计算最短路径。</p>
        ) : !paths.length ? (
          <p>当前筛选范围内未找到可达路径。</p>
        ) : (
          <>
            <div>
              <strong>{path.nodeIds.length - 1} 跳</strong>
              <span>{paths.length} 条等长路径</span>
            </div>
            {paths.length > 1 && (
              <div className="path-switcher">
                {paths.map((_, index) => (
                  <button
                    type="button"
                    key={index}
                    className={activePathIndex === index ? "active" : ""}
                    onClick={() => onPathIndexChange(index)}
                  >
                    路径 {index + 1}
                  </button>
                ))}
              </div>
            )}
            <ol>
              {path.steps.map((step, index) => (
                <li key={step.edgeId}>
                  <button type="button" onClick={onApply}>
                    {entityMap.get(path.nodeIds[index])?.name ?? path.nodeIds[index]}
                  </button>
                  <span>{step.predicate}</span>
                  {index === path.steps.length - 1 && (
                    <button type="button" onClick={onApply}>
                      {entityMap.get(step.targetId)?.name ?? step.targetId}
                    </button>
                  )}
                </li>
              ))}
            </ol>
            <button type="button" className="path-apply" onClick={onApply}>
              在图中突出此路径
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
