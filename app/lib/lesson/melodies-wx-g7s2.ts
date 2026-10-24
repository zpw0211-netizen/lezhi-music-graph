// 七年级下册（五线谱）：与简谱版谱例不同之处。其余作品沿用 melodies-g7s2.ts。
import { segment } from "./jianpu";
import type { Melody } from "./jianpu";
import G7S2 from "./melodies-g7s2";

const B = "七年级下册";
const MELODIES: Record<string, Melody[]> = {
  // 五线谱课本第 28 页「战争气氛」末尾印的是还原 C、D（简谱课本印的是 3 3 4 5，即 ♭C、♭D）。
  "《1812序曲》": G7S2["《1812序曲》"].map((melody, index) => index !== 2 ? melody :
    segment(B, 28, "1=♭G", "4/4", 132,
      "0/ 4/ | 4' ~4'// 3'// 2'// 3'// 2'// 1'// 7// 6// 5/ 7/ | 4/ 6/ 2/ 4/ 7,/ 2/ 3,// 3,// #4,// #5,//",
      "", { title: "激烈残酷的战争气氛（一）" })),
};

export default MELODIES;
