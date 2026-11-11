/**
 * Minimum land height (0-255). Lifting land above sea level by a fixed step
 * creates a hard edge at the shoreline, in both height (bump map) and color.
 * Raise for crisper coasts, lower for softer beaches.
 */
export const COAST_STEP = 24

/** Remaps land heights (> 1) into [COAST_STEP, 255]; sea (<= 1) is left as is. */
export const sharpenCoast = (value: number): number =>
  value <= 1 ? value : Math.round(COAST_STEP + (value * (255 - COAST_STEP)) / 255)

/**
 * Dry planets: below sea level becomes basins that keep their relief in
 * [0, COAST_STEP); above it maps like land on a planet with seas.
 * `raw` is the summed noise height (0-255, may overshoot), `floor` the sea level.
 */
export const dryHeight = (raw: number, floor: number): number => {
  if (raw < floor) return floor > 0 ? Math.round((Math.max(0, raw) / floor) * (COAST_STEP - 1)) : 0
  const land = Math.max(2, Math.round(((raw - floor) / (255 - floor)) * 255))
  return sharpenCoast(Math.min(land, 255))
}
