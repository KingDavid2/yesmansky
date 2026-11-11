import { makeNoise3D } from 'open-simplex-noise'
import colorPallets from './color-pallets.json'
import { REAL_PALETTES, paletteGradient } from './realPalettes'

type rgba = { r: number, g: number, b: number, a: number }
type colorGradient = {
  pallete: Array<rgba>
  gradient: Array<rgba>
}

/**
 * Generate color pallets based in given seed
 */
class ColorGradientFactory {
  static generateGradient(seed, realPalette?: string, seas = true): Array<rgba> {
    const colors = realPalette && REAL_PALETTES[realPalette]
      ? REAL_PALETTES[realPalette].colors
      : this.choosePallete(makeNoise3D(seed))
    // First color is the sea; dry planets use only the land colors
    return paletteGradient(seas ? colors : colors.slice(1))
  }

  protected static choosePallete (noise3D: (x: number, y: number, z: number) => number) {
    const chosenPallet = colorPallets.length / 2 + Math.round(noise3D(23, 23, 23) * colorPallets.length * 0.5)
    return colorPallets[chosenPallet]
  }
}

export { ColorGradientFactory, colorGradient }
