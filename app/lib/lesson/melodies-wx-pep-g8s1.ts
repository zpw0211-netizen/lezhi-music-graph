// 八年级上册（五线谱）：与简谱版谱例不同之处。其余作品沿用 melodies-pep-g8s1.ts。
import type { Melody } from "./jianpu";
import PEP_G8S1 from "./melodies-pep-g8s1";

const MELODIES: Record<string, Melody[]> = {
  // 五线谱课本把 1=E 段最后 7 小节印在第 54 页末行（简谱课本在第 55 页），音符相同。
  "《思乡曲》": PEP_G8S1["《思乡曲》"].map((melody) => !melody.title?.startsWith("1=E续段") ? melody : {
    ...melody,
    title: "1=E续段（7小节）",
    source: "据人教版八年级上册第 54 页谱例转写（第54页末行，1=E段最后7小节至双线终止；倚音、装饰音、力度与速度文字从略）",
  }),
};

export default MELODIES;
