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
  static generateGradient(seed, realPalette?: string): Array<rgba> {
    if (realPalette && REAL_PALETTES[realPalette]) {
      return paletteGradient(REAL_PALETTES[realPalette].colors)
    }
    const noise3D = makeNoise3D(seed)
    return this.generatePallete(noise3D)
  }

  protected static generatePallete (noise3D: (x: number, y: number, z: number) => number): Array<rgba> {
    const chosenPallet = colorPallets.length / 2 + Math.round(noise3D(23, 23, 23) * colorPallets.length * 0.5)
    return paletteGradient(colorPallets[chosenPallet])
  }
}

export { ColorGradientFactory, colorGradient }
