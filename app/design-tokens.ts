export const DESIGN_TOKENS = {
  spacing: {
    xs: 4,
    sm: 6,
    md: 10,
    lg: 12,
    xl: 16,
  },
  radius: {
    control: 3,
    panel: 5,
    circle: 999,
  },
  typography: {
    micro: 8,
    small: 9,
    body: 10,
    title: 16,
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

