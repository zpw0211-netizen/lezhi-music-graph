const GRADES = "一二三四五六七八九";

export function requestedVolumes(question: string): string[] {
  const text = question.normalize("NFKC").replace(/[\s(),、]+/g, "");
  const references = [...text.matchAll(/([一二三四五六七八九1-9])(?:(?:年级)?([上下])(?:册|学期)?|年级)/g)];
  const hasSemester = references.some((reference) => reference[2]);
  return references
    .filter((reference) => !hasSemester || reference[2])
    .map(([, grade, semester]) => `g${Number(grade) || GRADES.indexOf(grade) + 1}s${semester ? (semester === "上" ? 1 : 2) : ""}`);
}

export const matchesVolume = (bookKey: string, volumes: readonly string[]) =>
  !volumes.length || volumes.some((volume) => (bookKey.match(/g[1-9]s[12]$/)?.[0] ?? "").startsWith(volume));
