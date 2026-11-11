import { makeNoise3D } from 'open-simplex-noise'
import colorPallets from './color-pallets.json'

type rgba = { r: number, g: number, b: number, a: number }
type colorGradient = {
  pallete: Array<rgba>
  gradient: Array<rgba>
}

/**
 * Generate color pallets based in given seed
 */
class ColorGradientFactory {
  static generateGradient(seed): Array<rgba> {
    const noise3D = makeNoise3D(seed)
    return this.generatePallete(noise3D)
  }

  protected static generatePallete (noise3D: (x: number, y: number, z: number) => number): Array<rgba> {
    const chosenPallet = colorPallets.length / 2 + Math.round(noise3D(23, 23, 23) * colorPallets.length * 0.5)
    const result = []
    for (let i = 0; i < colorPallets[chosenPallet].length; i++) {
      result.push({
        r: colorPallets[chosenPallet][i][0],
        g: colorPallets[chosenPallet][i][1],
        b: colorPallets[chosenPallet][i][2],
        a: Math.round(62.2 * i)
      })
    }

    return result.sort((a, b) => a.a - b.a)
  }
}

export { ColorGradientFactory, colorGradient }
