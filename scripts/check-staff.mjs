// Validates that every registered jianpu and staff excerpt can be laid out on
// a five-line staff without changing its rhythm or its MIDI pitch spelling.
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const lessonDir = "app/lib/lesson";
const tempRoot = path.resolve(".tmp");
mkdirSync(tempRoot, { recursive: true });
const tempDir = mkdtempSync(path.join(tempRoot, "staff-check-"));
let failures = 0;
let excerpts = 0;
let midiOf;

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const NATURAL_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const SHARP_KEYS = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, "F#": 6, "C#": 7 };
const FLAT_KEYS = { F: 1, Bb: 2, Eb: 3, Ab: 4, Db: 5, Gb: 6, Cb: 7 };
const SHARP_ORDER = ["F", "C", "G", "D", "A", "E", "B"];
const FLAT_ORDER = ["B", "E", "A", "D", "G", "C", "F"];

function tonicOf(key) {
  const match = String(key).replace(/\s/g, "").match(/^1=([♭♯#b]?)([A-G])/);
  if (!match) return null;
  return { letter: match[2], accidental: match[1] === "♭" || match[1] === "b" ? "b" : match[1] ? "#" : "" };
}

function signatureFor(key) {
  const tonic = tonicOf(key);
  if (!tonic) return null;
  const name = tonic.letter + tonic.accidental;
  const flats = tonic.accidental === "b" || (!tonic.accidental && Object.hasOwn(FLAT_KEYS, name));
  const order = flats ? FLAT_ORDER : SHARP_ORDER;
  const count = tonic.accidental === "b" ? FLAT_KEYS[name] ?? 0
    : tonic.accidental === "#" ? SHARP_KEYS[name] ?? 0
      : FLAT_KEYS[name] ?? SHARP_KEYS[name] ?? 0;
  return { order: order.slice(0, count), alteration: Object.fromEntries(order.slice(0, count).map((letter) => [letter, flats ? -1 : 1])) };
}

function staffPlacement(melody, bars) {
  const notes = bars.flat().filter((note) => note.d > 0 && note.d !== 9);
  const preferred = notes.filter((note) => midiOf(melody, note) < 67).length > notes.length / 2 ? "bass" : "treble";
  const candidates = [preferred, preferred === "bass" ? "treble" : "bass"].flatMap((clef, order) => {
    const bottom = clef === "treble" ? 4 * 7 + LETTERS.indexOf("E") : 2 * 7 + LETTERS.indexOf("G");
    return [-3, -2, -1, 0, 1, 2, 3].map((octaveShift) => {
      const steps = notes.map((note) => spelledPitch(melody, note).step - octaveShift * 7 - bottom);
      const outside = steps.filter((step) => step < -10 || step > 18);
      const distance = steps.reduce((sum, step) => sum + Math.max(0, -10 - step) + Math.max(0, step - 18), 0);
      return { clef, octaveShift, outside: outside.length, distance, order };
    });
  });
  candidates.sort((a, b) => a.outside - b.outside || a.distance - b.distance || a.order - b.order || Math.abs(a.octaveShift) - Math.abs(b.octaveShift));
  return candidates[0] ?? { clef: "treble", octaveShift: 0, outside: 0, distance: 0, order: 0 };
}

function spelledPitch(melody, note) {
  const tonic = tonicOf(melody.key);
  if (!tonic || note.d < 1 || note.d > 7) return null;
  const tonicIndex = LETTERS.indexOf(tonic.letter);
  const absoluteLetter = tonicIndex + note.d - 1;
  const letter = LETTERS[absoluteLetter % 7];
  const midi = midiOf(melody, note);
  const pitchClass = NATURAL_PC[letter];
  const octave = Math.round((midi - pitchClass) / 12) - 1;
  const alteration = midi - ((octave + 1) * 12 + pitchClass);
  return { letter, octave, alteration, midi, naturalMidi: (octave + 1) * 12 + pitchClass, step: octave * 7 + LETTERS.indexOf(letter) };
}

function checkRange(melody, label, bars) {
  const { clef, octaveShift } = staffPlacement(melody, bars);
  const bottom = clef === "treble" ? 4 * 7 + LETTERS.indexOf("E") : 2 * 7 + LETTERS.indexOf("G");
  const issues = [];
  bars.forEach((bar, barIndex) => bar.forEach((note, noteIndex) => {
    if (note.d === 0 || note.d === 9) return;
    const pitch = spelledPitch(melody, note);
    if (!pitch) { issues.push(`${label} ${barIndex + 1}小节第${noteIndex + 1}音无法识别音级`); return; }
    const step = pitch.octave * 7 + LETTERS.indexOf(pitch.letter) - bottom - octaveShift * 7;
    if (step < -10 || step > 18) issues.push(`${label} ${barIndex + 1}小节第${noteIndex + 1}音超出${clef === "treble" ? "高音" : "低音"}谱号五条加线范围（step=${step}, MIDI=${pitch.midi}, d=${note.d}, o=${note.o ?? 0}）`);
    if (Math.abs(pitch.alteration) > 2) issues.push(`${label} ${barIndex + 1}小节第${noteIndex + 1}音需要双升/双降以外的记号`);
    if (pitch.naturalMidi + pitch.alteration !== pitch.midi) issues.push(`${label} ${barIndex + 1}小节第${noteIndex + 1}音的调号/临时记号与实际音高冲突`);
    if (note.a != null && ![-1, 0, 1].includes(note.a)) issues.push(`${label} ${barIndex + 1}小节第${noteIndex + 1}音的临时记号字段无效`);
  }));
  return issues;
}

try {
  for (const name of readdirSync(lessonDir).filter((item) => item.endsWith(".ts"))) {
    const code = ts.transpileModule(readFileSync(path.join(lessonDir, name), "utf8"), {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    }).outputText.replace(/from "\.\/([\w-]+)"/g, 'from "./$1.mjs"');
    writeFileSync(path.join(tempDir, name.replace(/\.ts$/, ".mjs")), code);
  }

  const { BOOK_MELODIES, checkMelody, midiOf: midiFunction } = await import(pathToFileURL(path.join(tempDir, "melodies.mjs")).href);
  midiOf = midiFunction;
  for (const [bookKey, book] of Object.entries(BOOK_MELODIES)) {
    for (const [name, segments] of Object.entries(book)) {
      for (const [index, melody] of segments.entries()) {
        excerpts += 1;
        const prefix = `${bookKey} ${name}${segments.length > 1 ? `（${index + 1}）` : ""}`;
        const timing = checkMelody(melody);
        const issues = [
          ...timing.map((problem) => `${problem.voice} ${problem.index + 1}小节时值 ${problem.total} 与拍号不符`),
          ...checkRange(melody, "主旋律", melody.bars),
          ...(melody.voices ?? []).flatMap((voice) => checkRange(melody, voice.label, voice.bars)),
        ];

        if (melody.key !== "节奏" && !signatureFor(melody.key)) issues.push(`无法读取调号 ${melody.key}`);
        if (issues.length) {
          failures += issues.length;
          for (const issue of issues) console.log(`✗ ${prefix}: ${issue}`);
        }
      }
    }
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

console.log(`${excerpts} excerpts, ${failures} failing`);
if (failures) process.exit(1);
