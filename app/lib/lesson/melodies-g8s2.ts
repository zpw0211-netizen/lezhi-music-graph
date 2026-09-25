// 八年级下册：各作品谱例旋律（重点曲目见 melodies-key.ts）。
import { segment } from "./jianpu";
import type { Melody } from "./jianpu";

const B = "八年级下册";
const MELODIES: Record<string, Melody[]> = {
  "《老鼠娶亲》": [
    segment(B, 45, "节奏", "2/4", 88,
      "9/. 9// 9/ 9/ | 9/ 9/ 9// 9// 9// 9//", "",
      { title: "中速节奏", note: "原谱为 X 节奏记号，无固定音高" }),
    segment(B, 45, "节奏", "2/4", 120,
      "9/. 9// 9/ 9/ | 9/ 9/ 9/ 9/", "",
      { title: "快速节奏", note: "原谱为 X 节奏记号，无固定音高" }),
  ],
};
export default MELODIES;
