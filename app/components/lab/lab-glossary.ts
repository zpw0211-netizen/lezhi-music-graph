/**
 * Plain-language notes for the 律盘 explanation card. The five 正声 are school-level music theory;
 * the 偏音 entries describe the equal-tempered teaching model used on this dial (extension knowledge).
 */
export type DialNoteInfo = {
  pinyin: string;
  /** One or two sentences: what this tone is. */
  what: string;
  /** Interval from 宫 in words. */
  interval: string;
  extension?: boolean;
};

export const DIAL_NOTE_INFO: Record<string, DialNoteInfo> = {
  宫: { pinyin: "gōng", what: "五声的第一个音，是整套音阶的出发点和落脚点。宫音定在哪里，整首曲子的“调”就定在哪里。", interval: "起点，简谱 1" },
  商: { pinyin: "shāng", what: "五声的第二个音，紧挨在宫音之上，常用来让旋律从宫音轻轻走开。", interval: "比宫高一个全音（两格）" },
  角: { pinyin: "jué", what: "五声的第三个音。宫、角之间是一个明亮的大三度，听起来开阔、明朗。", interval: "比宫高两个全音（四格）" },
  徵: { pinyin: "zhǐ", what: "五声的第四个音，和宫音构成稳固的五度关系，是旋律里最常停靠的音之一。", interval: "比宫高纯五度（七格）" },
  羽: { pinyin: "yǔ", what: "五声的第五个音。以羽为主音的羽调式色彩柔和，许多民歌用它写成。", interval: "比宫高大六度（九格）" },
  清角: { pinyin: "qīng jué", what: "加在角与徵之间的偏音，比角高半音。清乐音阶用到它。", interval: "比宫高五格，简谱 4", extension: true },
  变徵: { pinyin: "biàn zhǐ", what: "加在角与徵之间的偏音，比徵低半音。雅乐音阶用到它。", interval: "比宫高六格，简谱 ♯4", extension: true },
  变宫: { pinyin: "biàn gōng", what: "加在羽与宫之间的偏音，比上方的宫低半音。清乐、雅乐音阶都用到它。", interval: "比宫高十一格，简谱 7", extension: true },
  闰: { pinyin: "rùn", what: "加在羽与宫之间的偏音，比上方的宫低一个全音。燕乐音阶用到它。", interval: "比宫高十格，简谱 ♭7", extension: true },
};

/** Fixed-pitch letter names around the outer ring, read the Chinese way. */
export const PITCH_NAME_READING: Record<string, string> = {
  C: "C", "C♯": "升 C", D: "D", "E♭": "降 E", E: "E", F: "F",
  "F♯": "升 F", G: "G", "A♭": "降 A", A: "A", "B♭": "降 B", B: "B",
};
