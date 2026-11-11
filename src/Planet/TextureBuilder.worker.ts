/**
 * web-worker that generates textures
 * @see https://developer.mozilla.org/pt-PT/docs/Web/API/Web_Workers_API
 * @see https://github.com/webpack-contrib/worker-loader
 */

import { makeNoise3D } from 'open-simplex-noise'
import { NoiseSettings } from './types'
import { sharpenCoast, dryHeight } from './coastline'
import { cubeMapPosition, CUBE_PAD } from './cubeMap'
const ctx: Worker = self as any;

const normalize = (val, min, max) => ((val - min) / (max - min))

type BuiltTextures = {
  heightData: Uint8ClampedArray,
  specularData: Uint8ClampedArray,
  diffuseData: Uint8ClampedArray,
}

ctx.addEventListener("message", async (event) => {
  const result = await _buildTextures(...(event.data as [number, NoiseSettings, Uint8ClampedArray, Uint8ClampedArray, Uint8ClampedArray, boolean]))
  ctx.postMessage(result)
});

/**
 * Builds procedural texture based in given params and imageData
 */
const _buildTextures = async (
  seed: number,
  noiseSettings: NoiseSettings,
  heightData: Uint8ClampedArray,
  specularData: Uint8ClampedArray,
  diffuseData: Uint8ClampedArray,
  water: boolean
): Promise<BuiltTextures> => {
  const settings = noiseSettings

  const noise3D = makeNoise3D(seed)

  const numberOfPixels = heightData.length / 4
  const colorGradientValues = diffuseData.slice(0, 256 * 4)

  const width = Math.sqrt(numberOfPixels)

  for (let i = 0; i < numberOfPixels; i++) {
    const a = i * 4
    // Exact float position on cube faces (border = neighbor face); normal map only outside the cross
    let [r, g, b] = cubeMapPosition(i % width, Math.floor(i / width), width, width, CUBE_PAD) ?? [
      heightData[a],
      heightData[a + 1],
      heightData[a + 2]
    ]
    if (r + g + b === 0) {
      continue
    }

    let value = 0
    for (let j = 0; j < settings.length; j++) {
      const layerSettings = settings[j];

      let roughness = layerSettings.roughness / 100
      let strength = layerSettings.strength
      for (let pass = 0; pass < layerSettings.passes; pass++) {
        let noiseValue: number
        if (layerSettings.hard) {
          noiseValue = 1 - 4*Math.abs(noise3D(layerSettings.shift + r * roughness, g * roughness, b * roughness));
          noiseValue *= (noiseValue * noiseValue) * strength
        } else {
          noiseValue = noise3D(layerSettings.shift + r * roughness, g * roughness, b * roughness) * strength;
        }
        value += noiseValue
        roughness = roughness * 2
        strength = strength * layerSettings.resistance
      }
    }

    const floor = 255 * settings[0].min
    if (water) {
      value = Math.max(value * 128 + 128, floor)
      value = sharpenCoast(Math.min(Math.round(normalize(value, floor, 255) * 255), 255))
    } else {
      // Dry: sea level marks basins with relief, not a flat shiny sea
      value = dryHeight(value * 128 + 128, floor)
    }
    if (water && value <= 1) {
      heightData[a] = heightData[a + 1] = heightData[a + 2] = 0
      specularData[a] = specularData[a + 1] = specularData[a + 2] = 100
    } else {
      heightData[a] = heightData[a + 1] = heightData[a + 2] = value
    }
    diffuseData[a] = colorGradientValues[value * 4]
    diffuseData[a + 1] = colorGradientValues[value * 4 + 1]
    diffuseData[a + 2] = colorGradientValues[value * 4 + 2]
    diffuseData[a + 3] = 255
  }

  return {
    heightData,
    specularData,
    diffuseData
  }
}
