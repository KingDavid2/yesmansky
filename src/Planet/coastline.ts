/**
 * Minimum land height (0-255). Lifting land above sea level by a fixed step
 * creates a hard edge at the shoreline, in both height (bump map) and color.
 * Raise for crisper coasts, lower for softer beaches.
 */
export const COAST_STEP = 24

/** Remaps land heights (> 1) into [COAST_STEP, 255]; sea (<= 1) is left as is. */
export const sharpenCoast = (value: number): number =>
  value <= 1 ? value : Math.round(COAST_STEP + (value * (255 - COAST_STEP)) / 255)
