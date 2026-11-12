type RGB = [number, number, number]
type rgba = { r: number, g: number, b: number, a: number }

/**
 * Approximate surface colors of real bodies, ordered by height:
 * sea / lowest basin, shore, lowland, highland, peak.
 */
export const REAL_PALETTES: Record<string, { label: string, colors: RGB[], gas?: boolean }> = {
  earth: { label: 'Earth', colors: [[28, 64, 120], [194, 178, 128], [60, 110, 50], [110, 90, 60], [240, 240, 245]] },
  mars: { label: 'Mars', colors: [[90, 50, 35], [160, 82, 45], [193, 110, 60], [210, 150, 100], [230, 220, 210]] },
  venus: { label: 'Venus', colors: [[150, 110, 50], [190, 150, 80], [210, 170, 100], [225, 195, 130], [240, 220, 170]] },
  moon: { label: 'Moon', colors: [[60, 60, 65], [110, 110, 110], [140, 140, 140], [170, 170, 170], [200, 200, 200]] },
  mercury: { label: 'Mercury', colors: [[80, 75, 70], [120, 112, 104], [150, 140, 130], [175, 165, 155], [200, 192, 184]] },
  io: { label: 'Io', colors: [[140, 90, 30], [200, 170, 60], [225, 200, 90], [235, 220, 150], [250, 245, 220]] },
  europa: { label: 'Europa', colors: [[120, 80, 60], [200, 180, 160], [220, 210, 195], [235, 230, 220], [250, 250, 250]] },
  titan: { label: 'Titan', colors: [[30, 30, 40], [120, 85, 40], [160, 115, 55], [190, 145, 80], [210, 175, 110]] },
  // Gas giants: dark belt → light zone
  jupiter: { label: 'Jupiter', gas: true, colors: [[120, 70, 45], [170, 110, 70], [200, 160, 120], [225, 205, 175], [240, 235, 220]] },
  saturn: { label: 'Saturn', gas: true, colors: [[150, 120, 75], [190, 160, 105], [215, 190, 135], [230, 210, 160], [245, 230, 190]] },
  uranus: { label: 'Uranus', gas: true, colors: [[120, 175, 185], [140, 195, 205], [160, 210, 215], [180, 222, 225], [200, 235, 235]] },
  neptune: { label: 'Neptune', gas: true, colors: [[30, 50, 140], [45, 75, 170], [65, 105, 200], [95, 140, 220], [150, 185, 235]] },
}

/** Spreads colors evenly over the 0-249 height range as gradient stops */
export const paletteGradient = (colors: ArrayLike<number | string>[]): rgba[] =>
  Array.from(colors, (c, i) => ({ r: +c[0], g: +c[1], b: +c[2], a: Math.round((248.8 * i) / (colors.length - 1)) }))
