import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import { PlanetMesh } from './PlanetMesh'
import { PlanetMaterialManager } from './PlanetMaterialManager'
import { PlanetOptions } from './types'
import { RingOptions, ringRadii, ringBands } from './rings'

const RING_SEGMENTS = 128
const RING_TEXTURE_SIZE = 256 // radial samples, inner → outer edge

/**
 * Extends TransformNode to make it like a native babylon mesh
 * that can be transformed (scaled, moved, rotated) with the
 * same API.
 *
 * Generates a procedural planet based on options upon instantiation.
 *
 * @see https://www.redblobgames.com/maps/terrain-from-noise/
 * @see https://www.redblobgames.com/maps/mapgen4/
 */
class Planet extends BABYLON.TransformNode {
  mesh: PlanetMesh
  materialManager: PlanetMaterialManager
  scene: BABYLON.Scene
  options: PlanetOptions
  ringMeshes: BABYLON.Mesh[] = []

  constructor(name: string = 'planet', options: any, scene: BABYLON.Scene) {
    super(name)
    this.scene = scene
    this.options = {
      terrainSeed: 'GIB GIB', // 'Foo' was also a good initial value
      type: 'terra',
      landMassSize: 80,
      roughness: 2,
      seaLevel: 25,
      coastDetail: 1,
      bands: 10,
      turbulence: 1,
      atmosphereDensity: 2,
      atmosphereColor: 'blue',
      meshOptions: { diameter: 1, diameterX: 1, subdivisions: 25 },
      ...options
    }

    this.mesh = new PlanetMesh(name, this.options.meshOptions as any, scene)
    this.mesh.setParent(this)

    this.materialManager = new PlanetMaterialManager('myPlanetMat', this.options, scene)
    this.mesh.material = this.materialManager.raw
    this.mesh.atmosphereMaterial = this.materialManager.rawAtmosphere

    this.setRings(this.options.rings ?? [])

    this.setInspectableProperties()
    this.setDisposeProcess()
  }

  /**
   * Rebuilds ring meshes (cheap, no texture work). Rings are not parented
   * to this node: Game spins the planet around world Y, which would make
   * tilted child rings wobble.
   */
  setRings(rings: RingOptions[]) {
    this.disposeRings()
    ringRadii(rings).forEach(({ inner, outer }, i) => {
      const circle = (r: number) => Array.from({ length: RING_SEGMENTS + 1 }, (_, s) => {
        const a = (s / RING_SEGMENTS) * Math.PI * 2
        return new BABYLON.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)
      })
      const mesh = BABYLON.MeshBuilder.CreateRibbon(`${this.name}Ring${i}`, { pathArray: [circle(inner), circle(outer)] }, this.scene)
      const material = new BABYLON.StandardMaterial(`${this.name}RingMat${i}`, this.scene)
      material.diffuseTexture = this.ringTexture(i, BABYLON.Color3.FromHexString(rings[i].color))
      material.diffuseTexture.hasAlpha = true
      material.useAlphaFromDiffuseTexture = true
      material.specularColor = BABYLON.Color3.Black()
      material.backFaceCulling = false
      mesh.material = material
      mesh.rotation.x = rings[i].angle * Math.PI / 180
      this.ringMeshes.push(mesh)
    })
  }

  /**
   * 1px-wide strip: ribbon V runs inner → outer path, so rows = radius.
   * Seeded by ring index so bands stay put while sliders move.
   */
  protected ringTexture(index: number, color: BABYLON.Color3): BABYLON.RawTexture {
    const data = new Uint8Array(RING_TEXTURE_SIZE * 4)
    ringBands(index + 1, RING_TEXTURE_SIZE).forEach(({ brightness, alpha }, i) => {
      data[i * 4] = color.r * brightness * 255
      data[i * 4 + 1] = color.g * brightness * 255
      data[i * 4 + 2] = color.b * brightness * 255
      data[i * 4 + 3] = alpha * 255
    })
    const texture = BABYLON.RawTexture.CreateRGBATexture(data, 1, RING_TEXTURE_SIZE, this.scene)
    texture.wrapU = texture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE
    return texture
  }

  protected disposeRings() {
    this.ringMeshes.forEach(mesh => mesh.dispose(false, true))
    this.ringMeshes = []
  }

  set subdivisions(value: number) {
    this.mesh.subdivisions = value
  }

  get subdivisions(): number {
    return this.mesh.subdivisions
  }

  set noiseSettings(value: string) {
    this.materialManager.noiseSettings = JSON.parse(value)
    setTimeout(() => {
      this.mesh.material = this.materialManager.raw
    }, 100)
  }

  get noiseSettings(): string {
    return JSON.stringify(this.materialManager.noiseSettings)
  }

  /**
   * @see https://doc.babylonjs.com/how_to/debug_layer#inspector
   */
  protected setInspectableProperties() {
    this.inspectableCustomProperties = [
      {
        label: "Subdivisions",
        propertyName: "subdivisions",
        type: BABYLON.InspectableType.Slider,
        min: 3,
        max: 256,
        step: 1
      },
      {
        label: "Noise Settings",
        propertyName: "noiseSettings",
        type: BABYLON.InspectableType.String
      }
    ]
  }

  protected setDisposeProcess() {
    this.onDisposeObservable.add(() => {
      this.materialManager.dispose()
      this.disposeRings()
    })
  }
}

export { Planet }
