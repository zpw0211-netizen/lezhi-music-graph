import type { SVGProps } from "react";

const paths = {
  sprout: "M12 21V12M12 15C5 15 3 10 3 4c6 0 9 4 9 11Zm0-4c0-5 3-8 9-8 0 6-3 9-9 9",
  graph: "M8 7h8M7 9l4 8m6-8-4 8M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm12 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm-6 13a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z",
  message: "M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6 3V6a2 2 0 0 1 2-2Zm2 5h10M7 13h6",
  book: "M12 5v16M12 5C9 3 5 3 3 4v15c3-1 6-1 9 2 3-3 6-3 9-2V4c-3-1-6-1-9 1Z",
  research: "M4 3v18h17M8 16v-4m5 4V7m5 9V4",
  search: "m16 16 5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
  left: "m14 6-6 6 6 6", right: "m10 6 6 6-6 6", down: "m6 9 6 6 6-6",
  arrow: "M5 19 19 5M7 5h12v12", close: "m6 6 12 12M6 18 18 6",
  fit: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M8 8h8v8H8Z",
  path: "M7 5h9a4 4 0 0 1 0 8H8a3 3 0 0 0 0 6h9M7 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm14 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z",
  reset: "M3 10a9 9 0 1 1 2 8M3 3v7h7",
  plus: "M12 5v14M5 12h14", minus: "M5 12h14",
  expand: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5",
  collapse: "M3 8h5V3m8 0v5h5M8 21v-5H3m13 5v-5h5",
  tune: "M4 7h5m4 0h7M4 17h9m4 0h3M9 4v6m4-3h-4m4 7v6m4-3h-4",
  person: "M8 7a4 4 0 1 1 8 0 4 4 0 0 1-8 0ZM4 21v-3a8 8 0 0 1 16 0v3",
  music: "M9 17V5l11-2v12M9 5v4l11-2M9 17a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm11-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  home: "M3 11 12 4l9 7M5 10v10h5v-6h4v6h5V10",
  spark: "M12 3v4m0 10v4M3 12h4m10 0h4M6 6l2.5 2.5m7 7L18 18M6 18l2.5-2.5m7-7L18 6",
  layers: "m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5",
} as const;

export function WorkbenchIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: keyof typeof paths }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className="workbench-icon" {...props}><path d={paths[name]} /></svg>;
}
