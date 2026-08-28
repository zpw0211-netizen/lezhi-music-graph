"use client";

import { SCHEMA_CATEGORIES } from "../graph-schema";

type Props = {
  open: boolean;
  version: string;
  generatedAt?: string;
  onClose: () => void;
};

export function ResearchInfo({ open, version, generatedAt, onClose }: Props) {
  if (!open) return null;
  const updated = generatedAt
    ? new Intl.DateTimeFormat("zh-CN", { dateStyle: "long", timeStyle: "short" }).format(new Date(generatedAt))
    : "随数据构建更新";
  return (
    <div className="research-info-backdrop" role="presentation" onMouseDown={onClose}>
      <aside className="research-info" role="dialog" aria-modal="true" aria-labelledby="research-info-title" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div>
            <span>ABOUT / RESEARCH INFO</span>
            <h2 id="research-info-title">芽谱研究信息</h2>
          </div>
          <button aria-label="关闭研究信息" onClick={onClose}>×</button>
        </header>
        <dl>
          <div><dt>平台全称</dt><dd>芽谱——中小学音乐教育知识图谱与智能分析平台</dd></div>
          <div><dt>研究对象</dt><dd>中小学音乐教材中的作品、人物、体裁、音乐要素、理论、文化与教学活动关系</dd></div>
          <div><dt>教材范围</dt><dd>人民音乐出版社七至九年级上下册，共六册教材</dd></div>
          <div><dt>数据版本</dt><dd>{version}</dd></div>
          <div><dt>更新时间</dt><dd>{updated}</dd></div>
          <div><dt>实体类型体系</dt><dd>{SCHEMA_CATEGORIES.map((item) => item.label).join("、")}</dd></div>
          <div><dt>知识抽取流程</dt><dd>教材 OCR/版面识别 → 音乐学实体与关系抽取 → 证据核对 → 规范实体融合 → 质量审计 → 图谱发布</dd></div>
          <div><dt>Canonical Entity</dt><dd>同名同类型知识跨册融合为一个规范实体，教材中的每次出现单独保留来源记录。</dd></div>
          <div><dt>Evidence 机制</dt><dd>教材事实保留册次、PDF 页码、原始证据与置信信息；补充解释不冒充教材原文。</dd></div>
          <div><dt>技术栈</dt><dd>React / TypeScript / Canvas 2D / 静态图谱索引 / Canonical Graph Audit</dd></div>
          <div><dt>研究团队</dt><dd>待补充</dd></div>
          <div><dt>项目支持 / 导师项目</dt><dd>名称与编号待正式确认</dd></div>
        </dl>
        <p>平台提供关联查询、多跳路径探索与图谱分析；未声明使用形式化规则推理系统。</p>
      </aside>
    </div>
  );
}

