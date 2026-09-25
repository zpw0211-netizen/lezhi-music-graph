// 八年级上册：各作品谱例旋律（重点曲目见 melodies-key.ts）。
import { segment } from "./jianpu";
import type { Melody } from "./jianpu";

const B = "八年级上册";
const MELODIES: Record<string, Melody[]> = {
  "《非洲的节日》": [segment(B, 32, "节奏", "4/4", 104,
    "9// 9/ 9// 9/ 9/ 9// 9/ 9// 9/ 9/", "",
    { title: "打击乐主题节奏", note: "原谱为 X 节奏记号，无固定音高" })],
};
export default MELODIES;
