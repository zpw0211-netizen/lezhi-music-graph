"use client";
import { useState, type ChangeEvent } from "react";
import { fmt, type Book } from "../../lib/app/types";

// Declared here (not imported) so the static build folds it and drops the /api/import call.
const IS_STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";

/** 教材数据导入: validate a JSON package locally; persist it only when a backend is attached. */
export function ImportView() {
  const [summary, setSummary] = useState<string | null>(null);
  const onImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text()) as { books?: Book[] };
      const books = payload.books?.length ?? 0;
      const triples = payload.books?.reduce((sum, book) => sum + (book.triples?.length ?? 0), 0) ?? 0;
      if (IS_STATIC_EXPORT) {
        setSummary(`已读取 ${file.name}：${books || 1} 册、${fmt(triples)} 条关系。静态公开版支持本地校验；在线持久化导入需连接独立后端。`);
        return;
      }
      setSummary(`已读取 ${file.name}：${books || 1} 册、${fmt(triples)} 条关系，正在写入…`);
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { ok?: boolean; message?: string; statements?: number };
      setSummary(
        response.ok && result.ok
          ? `导入成功：${fmt(result.statements ?? 0)} 条持久化记录。`
          : `格式已校验，但未写入：${result.message ?? "请检查登录状态。"}`,
      );
    } catch {
      setSummary("文件格式无法识别，请上传标准 JSON 导入包。");
    }
  };
  return (
    <section className="import-view">
      <div className="import-hero">
        <span className="tag cyan">DATA PIPELINE</span>
        <h2>持续接入更多教材与资源</h2>
        <p>
          {IS_STATIC_EXPORT
            ? "当前为 GitHub Pages 静态公开版；JSON 可在本地校验，在线持久化需连接独立后端。"
            : "结构化数据进入 D1，乐谱图片、音频、视频和 PDF 进入 R2，再通过中文关系边挂回作品节点。"}
        </p>
      </div>
      <div className="import-grid">
        <div className="import-card">
          <div className="import-icon">⇧</div>
          <h3>导入 JSON 数据包</h3>
          <p>
            {IS_STATIC_EXPORT
              ? "上传标准包后进行本地格式校验，不会把文件发送到第三方。"
              : "上传包含 books、entities、triples、evidenceByTriple 的标准包，网站会先校验，再写入持久化层。"}
          </p>
          <label className="upload-button">
            选择 JSON 文件
            <input type="file" accept=".json" onChange={onImport} />
          </label>
          {summary && <div className="import-result">{summary}</div>}
        </div>
        <div className="import-card">
          <div className="import-icon">◉</div>
          <h3>中文关系标准</h3>
          <ul className="schema-list">
            <li>
              作品关系 <span>作曲 · 作词 · 属于单元 · 表现主题</span>
            </li>
            <li>
              乐理关系 <span>是 · 指 · 凭借 · 解释概念</span>
            </li>
            <li>
              证据关系 <span>教材页码 · PDF页码 · 原文摘要</span>
            </li>
            <li>
              资源关系 <span>拥有乐谱 · 音频 · 视频</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
