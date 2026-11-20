// 分享链接：把一件作品编进网址的 # 后面（不经过服务器），扫码或点链接就能在别的设备上打开。
// 格式：#/<工具>/s/<版本号><base64url>。音符写成短字符串，例如 "5'e" 是高音 sol 八分音符。
// 解码时逐项检查，长度设上限，坏链接只会得到 null。

export type ShareTool = "compose" | "vary" | "beat" | "choir";
export const SHARE_TOOLS: ShareTool[] = ["compose", "vary", "beat", "choir"];
const VERSION = "1";
/** 二维码装得下、手机屏幕上还扫得清的上限。 */
export const MAX_PAYLOAD = 1800;

export type ShareNote = { d: number; o: number; b: number; tie?: boolean };

const DURATIONS: Array<[string, number]> = [["s", 0.25], ["t", 0.375], ["e", 0.5], ["E", 0.75], ["q", 1], ["Q", 1.5], ["h", 2], ["H", 3], ["w", 4], ["W", 6]];
const CODE_OF = new Map(DURATIONS.map(([code, beats]) => [beats, code]));
const BEATS_OF = new Map(DURATIONS);

function noteToken(note: ShareNote) {
  const octave = note.o > 0 ? "'".repeat(Math.min(2, note.o)) : note.o < 0 ? ",".repeat(Math.min(2, -note.o)) : "";
  const code = CODE_OF.get(note.b) ?? `(${Number(note.b.toFixed(4))})`;
  return `${note.d}${octave}${code}${note.tie ? "~" : ""}`;
}

/** 小节之间用 / 分开，音符直接相连。 */
export function encodeBars(bars: ShareNote[][]) {
  return bars.map((bar) => bar.map(noteToken).join("")).join("/");
}

const TOKEN = /(\d)('{1,2}|,{1,2})?([stEeqQhHwW]|\((\d+(?:\.\d+)?)\))(~)?/y;
export function decodeBars(text: unknown, maxBars = 32): ShareNote[][] | null {
  if (typeof text !== "string" || text.length > 1200) return null;
  const bars = text.split("/");
  if (!bars.length || bars.length > maxBars) return null;
  const out: ShareNote[][] = [];
  for (const raw of bars) {
    const notes: ShareNote[] = [];
    TOKEN.lastIndex = 0;
    while (TOKEN.lastIndex < raw.length) {
      const at = TOKEN.lastIndex;
      const match = TOKEN.exec(raw);
      if (!match || match.index !== at) return null;
      const d = Number(match[1]);
      if (d > 9 || d === 8) return null;
      const o = match[2] ? (match[2][0] === "'" ? 1 : -1) * match[2].length : 0;
      const b = match[4] ? Number(match[4]) : BEATS_OF.get(match[3])!;
      if (!(b > 0 && b <= 8)) return null;
      notes.push(match[5] ? { d, o, b, tie: true } : { d, o, b });
    }
    out.push(notes);
  }
  return out;
}

function toBase64Url(text: string) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromBase64Url(text: string) {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((text.length + 3) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function encodePayload(data: Record<string, unknown>) {
  return VERSION + toBase64Url(JSON.stringify(data));
}
export function decodePayload(payload: string): Record<string, unknown> | null {
  if (!payload || payload.length > MAX_PAYLOAD * 2 || payload[0] !== VERSION || !/^[A-Za-z0-9_-]+$/.test(payload.slice(1))) return null;
  try {
    const value = JSON.parse(fromBase64Url(payload.slice(1)));
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

/** 文字字段：去掉控制字符，截到给定长度。 */
export const cleanText = (value: unknown, max: number) => (typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, max) : "");
export const oneOf = <T extends string>(value: unknown, allowed: readonly T[]): T | undefined => (allowed.includes(value as T) ? value as T : undefined);

/** 这件作品在本站的分享网址。 */
export function shareUrl(tool: ShareTool, payload: string) {
  return `${window.location.origin}${window.location.pathname}#/${tool}/s/${payload}`;
}

// ── 打开网址时，路由会把 #/compose/s/… 规整成 #/compose，先把作品记下来交给对应的工具。
type Pending = { tool: ShareTool; payload: string };
let pending: Pending | null = null;
export const SHARED_EVENT = "yapu-shared-work";
const SHARED = /^#\/(compose|vary|beat|choir)\/s\/([A-Za-z0-9_-]+)$/;

/** 在解析路由前调用：网址里带着分享的作品就记下来。 */
export function captureShared(hash: string) {
  const match = SHARED.exec(hash);
  if (!match) return;
  pending = { tool: match[1] as ShareTool, payload: match[2] };
  if (typeof window !== "undefined") window.setTimeout(() => window.dispatchEvent(new Event(SHARED_EVENT)), 0);
}

/** 有没有发给这个工具、还没被取走的作品（不取走）。 */
export const hasShared = (tool: ShareTool) => pending?.tool === tool;

/** 工具页取走发给自己的作品（只取一次）。 */
export function takeShared(tool: ShareTool) {
  if (!pending || pending.tool !== tool) return null;
  const { payload } = pending;
  pending = null;
  // 取走后把网址改回工具本身，刷新或后退时不会再导入一遍、盖掉接着改的内容。
  if (typeof window !== "undefined" && SHARED.test(window.location.hash)) {
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}#/${tool}`);
  }
  return decodePayload(payload);
}

/** 扫到的二维码：是本站的作品链接就返回要去的网址。 */
export function sharedLinkTarget(text: string) {
  try {
    const url = new URL(text.trim());
    if (url.origin !== window.location.origin || !SHARED.test(url.hash)) return null;
    return url.href;
  } catch {
    return null;
  }
}
