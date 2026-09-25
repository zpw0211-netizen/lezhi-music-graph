// Lesson melodies, hand-transcribed from the textbook scores. A work may have
// several excerpts (themes printed separately), each possibly with extra voices.
import { KEY_MELODIES } from "./melodies-key";
import G7S1 from "./melodies-g7s1";
import G7S2 from "./melodies-g7s2";
import G8S1 from "./melodies-g8s1";
import G8S2 from "./melodies-g8s2";
import G9S1 from "./melodies-g9s1";
import G9S2 from "./melodies-g9s2";
import { DRAFT_MELODIES } from "./melodies-draft";
import type { Melody } from "./jianpu";

export type { Melody, MelodyNote } from "./jianpu";
export { checkMelody, jianpu, midiOf, notation } from "./jianpu";

const BOOKS: Array<Record<string, Melody[]>> = [G7S1, G7S2, G8S1, G8S2, G9S1, G9S2];
export const MELODIES: Record<string, Melody[]> = Object.fromEntries(Object.entries(KEY_MELODIES).map(([name, melody]) => [name, [melody]]));
for (const book of BOOKS)
  for (const [name, segments] of Object.entries(book)) MELODIES[name] = [...(MELODIES[name] ?? []), ...segments];
for (const [name, segments] of Object.entries(DRAFT_MELODIES))
  if (!MELODIES[name]?.length) MELODIES[name] = segments;
