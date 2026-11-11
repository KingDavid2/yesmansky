import type { NoiseSettings, PlanetOptions } from './types'

type NoiseOptions = Pick<PlanetOptions, 'landMassSize' | 'roughness' | 'seaLevel' | 'coastDetail'>

/**
 * Builds the noise layers used by the texture worker.
 * The first layer's `min` sets the sea level threshold.
 */
export const buildNoiseSettings = (options: NoiseOptions): NoiseSettings => {
  const min = options.seaLevel * 0.01
  const layers: NoiseSettings = [
    { shift: 5, passes: 14, strength: 0.65, roughness: 2.1 - options.landMassSize * 0.02, resistance: 0.6, min, hard: true }
  ]

  if (options.roughness > 1) {
    layers.unshift({ shift: 18, passes: 15, strength: 0.45, roughness: 0.3, resistance: 0.65, min, hard: true })
  }
  if (options.roughness > 2) {
    layers.unshift({ shift: 0, passes: 10, strength: 0.8, roughness: 0.6, resistance: 0.70, min, hard: true })
  }

  // High-frequency, low-strength noise: barely moves inland heights but
  // jitters where the terrain crosses sea level, giving jagged coastlines.
  if (options.coastDetail > 0) {
    layers.push({ shift: 31, passes: 5, strength: 0.06 * options.coastDetail, roughness: 6, resistance: 0.5, min, hard: false })
  }

  return layers
}
