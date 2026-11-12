/**
 * Gas giant band color index (0-255) for a latitude in [-1, 1] (pole to pole).
 * `warp` bends the bands (turbulence noise), `bands` = light bands pole to pole.
 */
export const gasHeight = (lat: number, warp: number, bands: number): number =>
  Math.round(((Math.sin((lat + warp) * bands * Math.PI) + 1) / 2) * 255)
