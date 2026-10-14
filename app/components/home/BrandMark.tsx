// The sprout-and-note mark from public/brand/mark.svg, inline so the hero can grow it: stem first, then the leaves open.
export function BrandMark() {
  return <svg className="brand-mark-svg" viewBox="12 8 70 74" aria-hidden="true">
    <path className="brand-mark-head" d="M24 67 C27 58 38 55 47 60 C48 67 43 74 35 77 C29 76 25 72 24 67Z" fill="var(--ink)" />
    <path className="brand-mark-stem" d="M45 66 V28" fill="none" stroke="var(--ink)" strokeWidth="7" strokeLinecap="round" />
    <path className="brand-mark-leaf brand-mark-leaf--left" d="M45 32 C35 16 23 14 17 17 C19 29 30 36 45 34Z" fill="#3E9B4F" />
    <path className="brand-mark-leaf brand-mark-leaf--right" d="M45 31 C49 16 63 9 77 12 C74 25 63 33 45 34Z" fill="#3E9B4F" />
  </svg>;
}
