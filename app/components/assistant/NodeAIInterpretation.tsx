"use client";
export function NodeAIInterpretation({ name, onAsk }: { name: string; onAsk: (question: string) => void }) {
  return <section className="node-ai-interpretation"><h3>AI解读当前节点</h3><p>基于图谱与教材证据回答；当前为本地检索版。</p>{[`${name}的音乐特点是什么？`, `${name}与哪些知识或作品有关？`, `${name}在教材中的教学重点是什么？`, `${name}出现在哪些教材里？`].map(q => <button key={q} onClick={() => onAsk(q)}>{q} ↗</button>)}</section>;
}
