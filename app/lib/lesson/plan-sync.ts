import type { LessonPlan } from "./plan";
import type { LessonKind } from "./reflective";

export const SLIDE_STORAGE_PREFIX = "yapu-reflective:";
export const LESSON_MODEL_KEY = "yapu-lesson-model";

export type SlideSyncPayload = {
  kind: LessonKind;
  edits: Record<string, string>;
  boardNote?: string;
  syncedFromPlanAt: string;
};

export function slideStorageKey(editionKey: string, bookKey: string | undefined, workId: string): string {
  return `${SLIDE_STORAGE_PREFIX}v2:${editionKey}:${bookKey ?? "unscoped"}:${workId}`;
}

const CIRCLED_PREFIX = /^[①②③④⑤⑥⑦⑧⑨⑩]\s*/;

function extractNumberedLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => CIRCLED_PREFIX.test(line))
    .map((line) => line.replace(CIRCLED_PREFIX, "").trim())
    .filter(Boolean);
}

function extractQuestions(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("提问："))
    .map((line) => line.slice(3).trim())
    .filter(Boolean);
}

function extractQuotedScene(text: string): string | null {
  const match = text.match(/导入语[—\-：:]*[“"]([^”"]+)[”"]/);
  if (match?.[1]?.trim()) return match[1].trim();
  const first = text.split("\n").map((line) => line.trim()).find(Boolean);
  return first ? first.replace(/^教师[：:]\s*/, "") : null;
}

/** 把智能备课里的教案内容整理成上课模式（常规课 + 公共项）可直接读取的覆盖字段。 */
export function buildSlideSyncFromPlan(plan: LessonPlan, nowIso = new Date().toISOString()): SlideSyncPayload {
  const edits: Record<string, string> = {};

  plan.goals.forEach((goal, index) => {
    const trimmed = goal.text.trim();
    if (!trimmed) return;
    edits[`r-goal-${index}`] = trimmed;
    edits[`goal-${index}`] = trimmed;
  });

  if (plan.focus.key.trim()) edits["r-focus-key"] = plan.focus.key.trim();
  if (plan.focus.hard.trim()) edits["r-focus-hard"] = plan.focus.hard.trim();
  if (plan.homework.trim()) {
    edits["r-homework"] = plan.homework.trim();
    edits.homework = plan.homework.trim();
  }

  const allActivities = plan.stages.flatMap((stage) => stage.activities.map((activity) => ({ stage: stage.key, activity })));

  for (const { stage, activity } of allActivities) {
    const title = activity.title ?? "";
    const text = activity.text.trim();
    if (!text) continue;

    if (stage === "motivate" && /情境导入|导入/.test(title)) {
      const scene = extractQuotedScene(text);
      if (scene) {
        edits["r-scene"] = scene;
        edits.scene = scene;
      }
      continue;
    }

    if (stage === "motivate") {
      const steps = extractNumberedLines(text);
      steps.forEach((step, index) => { edits[`r-warmup-${index}`] = step; });
      continue;
    }

    if (stage === "conflict" && /初听/.test(title)) {
      const qs = extractQuestions(text);
      qs.forEach((q, index) => { edits[`r-first-${index}`] = q; });
      continue;
    }

    if (stage === "conflict" && /复听/.test(title)) {
      const qs = extractQuestions(text);
      qs.forEach((q, index) => { edits[`r-second-${index}`] = q; });
      continue;
    }

    if (stage === "construct" && /难点突破/.test(title)) {
      const line = text.split("\n").map((item) => item.trim()).find(Boolean);
      if (line) {
        const clean = line.replace(/^教师[：:]\s*/, "");
        edits["r-practice"] = clean;
        edits.practice = clean;
      }
      continue;
    }

    if (stage === "construct" && !/表现|巩固|照顾|鼓励|分组/.test(title)) {
      const steps = extractNumberedLines(text);
      steps.forEach((step, index) => { edits[`r-learn-${index}`] = step; });
      continue;
    }

    if (stage === "transfer" && /文化理解|走近作品/.test(title)) {
      const line = text.split("\n").map((item) => item.trim()).find((item) => !item.startsWith("学生")) ?? text.split("\n")[0];
      if (line) edits["r-culture"] = line.replace(/^教师[：:]\s*/, "");
      continue;
    }

    if (stage === "transfer" && /创编|拓展|实践/.test(title)) {
      const tiers = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => /^(基础|提升|挑战|进阶|层次)[：:]/.test(line))
        .map((line) => line.replace(/^(基础|提升|挑战|进阶|层次)[：:]\s*/, "").trim());
      tiers.forEach((task, index) => { if (task) edits[`r-create-${index}`] = task; });
    }
  }

  return {
    kind: plan.kind,
    edits,
    ...(plan.board?.trim() ? { boardNote: plan.board.trim() } : {}),
    syncedFromPlanAt: nowIso,
  };
}

/** 将教案同步写入本机浏览器保存的上课模式配置，保留老师已设置的隐藏页和主题图。 */
export function syncPlanToSlides(
  editionKey: string,
  bookKey: string,
  workId: string,
  plan: LessonPlan,
): { ok: boolean; syncedFields: number } {
  const key = slideStorageKey(editionKey, bookKey, workId);
  const payload = buildSlideSyncFromPlan(plan);
  try {
    const raw = window.localStorage.getItem(key);
    const prev = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const prevEdits = (prev.edits && typeof prev.edits === "object" ? prev.edits : {}) as Record<string, string>;
    const next = {
      ...prev,
      kind: payload.kind,
      edits: { ...prevEdits, ...payload.edits },
      ...(payload.boardNote ? { boardNote: payload.boardNote } : {}),
      syncedFromPlanAt: payload.syncedFromPlanAt,
    };
    window.localStorage.setItem(key, JSON.stringify(next));
    window.localStorage.setItem(LESSON_MODEL_KEY, "regular");
    return { ok: true, syncedFields: Object.keys(payload.edits).length };
  } catch {
    return { ok: false, syncedFields: 0 };
  }
}
