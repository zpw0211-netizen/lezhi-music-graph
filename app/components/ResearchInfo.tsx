"use client";

import Image from "next/image";
import { useEffect } from "react";
import { SCHEMA_CATEGORIES } from "../graph-schema";
import { publicAssetUrl } from "../lib/app/assets";
import { PUBLISHED_EDITION_LABEL, PUBLISHED_SCOPE_LABEL } from "../lib/app/books";

type Props = {
  open: boolean;
  version: string;
  generatedAt?: string;
  onClose: () => void;
};

export function ResearchInfo({ open, version, generatedAt, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  const updated = generatedAt
    ? new Intl.DateTimeFormat("zh-CN", { dateStyle: "long", timeStyle: "short" }).format(new Date(generatedAt))
    : "随数据构建更新";
  return (
    <div className="research-info-backdrop" role="presentation" onMouseDown={onClose}>
      <aside className="research-info" role="dialog" aria-modal="true" aria-labelledby="research-info-title" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div className="research-info-heading">
            <Image className="research-info-logo" src={publicAssetUrl("brand/logo.svg")} alt="芽谱" width={220} height={80} unoptimized />
            <h2 id="research-info-title">芽谱研究信息</h2>
          </div>
          <button type="button" aria-label="关闭研究信息" onClick={onClose}>×</button>
        </header>
        <dl>
          <div><dt>站点名称</dt><dd>芽谱 · 人音版{PUBLISHED_EDITION_LABEL}音乐教材</dd></div>
          <div><dt>研究对象</dt><dd>中小学音乐教材中的作品、人物、体裁、音乐要素、理论、文化，以及教学活动方面的知识联系</dd></div>
          <div><dt>教材范围</dt><dd>人民音乐出版社{PUBLISHED_SCOPE_LABEL}</dd></div>
          <div><dt>数据版本</dt><dd>{version}</dd></div>
          <div><dt>更新时间</dt><dd>{updated}</dd></div>
          <div><dt>知识点类型体系</dt><dd>{SCHEMA_CATEGORIES.map((item) => item.label).join("、")}</dd></div>
          <div><dt>图谱整理流程</dt><dd>教材 OCR/版面识别 → 音乐学知识点与知识联系整理 → 教材出处核对 → 同名知识融合 → 质量审计 → 图谱发布</dd></div>
          <div><dt>知识融合</dt><dd>同名同类型的知识跨册合并为一个知识点，教材中的每次出现单独保留出处记录。</dd></div>
          <div><dt>教材出处</dt><dd>教材事实保留册次、PDF 页码与原文出处记录；补充解释不冒充教材原文。</dd></div>
          <div><dt>技术栈</dt><dd>React / TypeScript / 静态图谱索引</dd></div>
        </dl>
        <p>芽谱提供关联查询、路径探索与图谱浏览；未声明使用形式化规则推理系统。</p>
      </aside>
    </div>
  );
}

