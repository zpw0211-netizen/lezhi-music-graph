export const DESIGN_TOKENS = {
  colors: { background: "#ffffff", secondary: "#f7f7f8", border: "#e5e7eb", text: "#18181b", muted: "#71717a" },
  spacing: {
    xs: 4,
    sm: 6,
    md: 10,
    lg: 12,
    xl: 16,
  },
  radius: {
    control: 7,
    panel: 10,
    circle: 999,
  },
  typography: {
    micro: 11,
    small: 12,
    body: 14,
    title: 22,
  },
  graph: {
    width: 2400,
    height: 1500,
    centerX: 1200,
    centerY: 750,
    clusterSpacingScale: 1.25,
  },
} as const;

export const designTokenCssVariables = {
  "--space-xs": `${DESIGN_TOKENS.spacing.xs}px`,
  "--space-sm": `${DESIGN_TOKENS.spacing.sm}px`,
  "--space-md": `${DESIGN_TOKENS.spacing.md}px`,
  "--space-lg": `${DESIGN_TOKENS.spacing.lg}px`,
  "--space-xl": `${DESIGN_TOKENS.spacing.xl}px`,
  "--radius-control": `${DESIGN_TOKENS.radius.control}px`,
  "--radius-panel": `${DESIGN_TOKENS.radius.panel}px`,
} as Record<string, string>;
