import type { MeterId } from "./patterns";

// The 闯关 path: eight exercises from the first quarter and eighth notes to
// syncopation, triplets and 6/8. Each level draws a fresh eight-bar rhythm
// from its patterns; a score of PASS_SCORE or more opens the next level.

export type RhythmLevelStage = {
  name: string;
  meter: MeterId;
  bpm: number;
  patterns: string[];
};

export const PASS_SCORE = 80;
export const LEVEL_BARS = 8;

export const LEVELS: RhythmLevelStage[] = [
  { name: "四分与八分", meter: "2/4", bpm: 72, patterns: ["q", "ee"] },
  { name: "加入二分和休止", meter: "2/4", bpm: 76, patterns: ["q", "ee", "h", "qr"] },
  { name: "三拍子", meter: "3/4", bpm: 80, patterns: ["q", "ee", "h", "qr"] },
  { name: "十六分音符", meter: "2/4", bpm: 72, patterns: ["q", "ee", "ssss", "ess", "sse"] },
  { name: "附点与小切分", meter: "4/4", bpm: 76, patterns: ["q", "ee", "dq", "ses", "re"] },
  { name: "六八拍", meter: "6/8", bpm: 120, patterns: ["c3e", "cqe", "cdq", "ceq"] },
  { name: "附点八分与大切分", meter: "2/4", bpm: 72, patterns: ["q", "ee", "des", "syn", "ess"] },
  { name: "三连音综合", meter: "4/4", bpm: 76, patterns: ["q", "ee", "tri", "dq", "ssss", "re"] },
];
