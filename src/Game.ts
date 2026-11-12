import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import localforage from 'localforage'
import { Planet } from './Planet/Planet';
import { HardwareInfo } from './Infrastructure/HardwareInfo';
import { starField, twinkle, nebulaBlobs, nebulaPixels } from './Space/stars';
import { STAR_CLASSES, StarClass, SYSTEM_SCALE, starLight, starOrbitPosition, radialFalloff, flareStrength } from './Space/star';

const STAR_COUNT = 1500 // default
const STAR_RADIUS = 500
const NEBULA_BLOBS = 60
const SUN_DIR = new BABYLON.Vector3(0.3, -0.43, -0.913).normalize() // behind the planet, ~19° left of the default camera view so the star is in frame
const SUN_DISTANCE = 200
const AMBIENT_WITH_STAR = 0.15 // keep night side faintly visible
const SYSTEM_STAR_SIZE = 4 // ponytail: not to scale, a real star would be a dot at 20 units/AU
const CAMERA_RADIUS = 4.5
const CORONA_SIZE = 5 // corona diameter in star diameters
// [size (fraction of viewport), position along star -> screen center axis (1 = star, 0 = center, <0 = past center), color weight]
const FLARES: [number, number, number][] = [[0.35, 1, 0.6], [0.06, 0.5, 0.5], [0.03, 0.2, 0.6], [0.1, -0.2, 0.3], [0.05, -0.5, 0.5], [0.15, -0.8, 0.25]]

type StarSettings = { enabled: boolean, starClass: StarClass, distance: number, systemView?: boolean }

/**
 * Handles the whole Babylon engine instance and its
 * main scenes and objects
 */
class Game {
  engine: BABYLON.Engine
  scene: BABYLON.Scene
  camera: BABYLON.ArcRotateCamera
  light: BABYLON.Light
  planet: Planet
  rotationSpeed = 1 // multiplier of the base spin, 0 = stopped
  starCount = STAR_COUNT
  defaultClearColor: BABYLON.Color4
  stars?: { mesh: BABYLON.Mesh, field: ReturnType<typeof starField>, colors: Float32Array }
  nebula?: BABYLON.Mesh
  nebulaSettings = { enabled: true, intensity: 1 }
  sun?: { mesh: BABYLON.Mesh, material: BABYLON.StandardMaterial, light: BABYLON.DirectionalLight, glow: BABYLON.GlowLayer, corona: BABYLON.Mesh, flares: BABYLON.LensFlareSystem }
  starSettings?: StarSettings
  orbitLine?: BABYLON.LinesMesh

  constructor(el: HTMLCanvasElement) {
    const engineOptions = {
      antialias: false
    }
    window.game = this
    this.engine = new BABYLON.Engine(el, undefined, engineOptions, false);
    this.scene = new BABYLON.Scene(this.engine);
    this.defaultClearColor = this.scene.clearColor.clone()
    this.camera = new BABYLON.ArcRotateCamera(
      "camera",
      Math.PI / 2,
      Math.PI / 3.2,
      CAMERA_RADIUS,
      BABYLON.Vector3.Zero(),
      this.scene
    );
    this.camera.lowerRadiusLimit = 2.1

    this.camera.attachControl(el, true);
    this.camera.wheelPrecision = 90
    this.camera.pinchPrecision = 100

    this.light = new BABYLON.HemisphericLight(
      "light",
      new BABYLON.Vector3(0.5, 1, 0),
      this.scene);

    this.planet = new Planet('planet', {}, this.scene)

    this.setGraphicalSettings()
    this.prepareGraphicalPipeline()

    if (import.meta.env.DEV) {
      this.scene.debugLayer.show({ embedMode: true, overlay: true });
    }

    this.engine.runRenderLoop(() => this.render());
  }

  render() {
    if (this.planet) {
      this.planet.rotateAround(BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 1, 0), 0.0001 * this.rotationSpeed)
      this.planet.mesh.atmosphereMesh.rotateAround(BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 1, 0), 0.0003 * this.rotationSpeed)
    }
    if (this.stars?.mesh.isEnabled()) {
      const { mesh, field, colors } = this.stars
      const t = performance.now() / 1000
      for (let i = 0; i < field.brightness.length; i++) {
        const b = twinkle(field.brightness[i], field.phase[i], t)
        colors.fill(b, i * 4, i * 4 + 3)
      }
      mesh.updateVerticesData(BABYLON.VertexBuffer.ColorKind, colors)
    }
    if (this.sun && this.starSettings?.enabled && this.starSettings.systemView) {
      const { x, y, z } = starOrbitPosition(this.starSettings.distance, performance.now() / 1000)
      this.sun.mesh.position.set(x, y, z)
      this.sun.light.direction = this.sun.mesh.position.negate().normalize()
      this.orbitLine?.position.copyFrom(this.sun.mesh.position)
      this.camera.target.copyFrom(this.sun.mesh.position)
    }
    this.scene.render();
  }

  /** Black sky with nebula clouds and twinkling stars; off restores the default clear color. */
  setBackground(enabled: boolean) {
    this.scene.clearColor = enabled ? new BABYLON.Color4(0, 0, 0, 1) : this.defaultClearColor.clone()
    if (enabled && !this.stars) this.stars = this.createStars()
    this.stars?.mesh.setEnabled(enabled)
    this.setNebula(this.nebulaSettings)
  }

  /** Nebula shows only with the starry background; intensity scales the cloud brightness. */
  setNebula(settings: { enabled: boolean, intensity: number }) {
    this.nebulaSettings = { ...settings }
    const visible = settings.enabled && !!this.stars?.mesh.isEnabled()
    if (visible && !this.nebula) this.nebula = this.createNebula()
    if (!this.nebula) return
    this.nebula.setEnabled(visible)
    // emissiveColor is added to the texture, not multiplied: scale the texture level instead
    ;(this.nebula.material as BABYLON.StandardMaterial).emissiveTexture!.level = settings.intensity
  }

  /** Rebuilds the star field; same seed keeps the first stars in place. */
  setStarCount(count: number) {
    this.starCount = count
    if (!this.stars) return
    const enabled = this.stars.mesh.isEnabled()
    this.stars.mesh.dispose(false, true)
    this.stars = this.createStars()
    this.stars.mesh.setEnabled(enabled)
  }

  /**
   * Visible star + directional light; color by spectral class, brightness by distance (AU).
   * System view: star orbits the planet in the planet's frame and the camera follows the star,
   * so the star reads as the center with the planet orbiting it (planet stays at origin).
   */
  setStar(settings: StarSettings) {
    const { enabled, starClass, distance } = settings
    const systemView = enabled && !!settings.systemView
    const wasSystemView = !!(this.starSettings?.enabled && this.starSettings.systemView)
    this.starSettings = { ...settings }
    this.light.intensity = enabled ? AMBIENT_WITH_STAR : 1
    if (enabled && !this.sun) this.sun = this.createSun()
    if (this.sun) {
      const { mesh, material, light, corona, flares } = this.sun
      mesh.setEnabled(enabled)
      light.setEnabled(enabled)
      flares.isEnabled = enabled
      if (enabled) {
        const color = BABYLON.Color3.FromHexString(STAR_CLASSES[starClass].color)
        const { intensity, size } = starLight(distance)
        material.emissiveColor = color
        ;(corona.material as BABYLON.StandardMaterial).emissiveColor = color
        const strength = flareStrength(distance)
        flares.lensFlares.forEach((f, i) => f.color = color.scale(FLARES[i][2] * strength))
        light.diffuse = color
        light.intensity = intensity
        mesh.scaling.setAll(systemView ? SYSTEM_STAR_SIZE : size)
        if (!systemView) {
          mesh.position = SUN_DIR.scale(SUN_DISTANCE)
          light.direction = SUN_DIR.negate()
        }
      }
    }
    this.setOrbitLine(systemView ? distance : 0)
    if (systemView) {
      const orbitRadius = SYSTEM_SCALE * distance
      this.camera.upperRadiusLimit = orbitRadius * 6
      if (!wasSystemView || this.camera.radius < orbitRadius) this.camera.radius = orbitRadius * 2.5
    } else if (wasSystemView) {
      this.camera.target = BABYLON.Vector3.Zero()
      this.camera.radius = CAMERA_RADIUS
      this.camera.upperRadiusLimit = null
    }
  }

  /** Circle of the planet's orbit around the star; 0 removes it. */
  setOrbitLine(distance: number) {
    this.orbitLine?.dispose()
    this.orbitLine = undefined
    if (!distance) return
    const radius = SYSTEM_SCALE * distance
    const points = Array.from({ length: 129 }, (_, i) => {
      const a = i / 128 * Math.PI * 2
      return new BABYLON.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius)
    })
    this.orbitLine = BABYLON.MeshBuilder.CreateLines('orbitLine', { points }, this.scene)
    this.orbitLine.color = new BABYLON.Color3(0.4, 0.4, 0.5)
    this.orbitLine.isPickable = false
  }

  createSun() {
    const mesh = BABYLON.MeshBuilder.CreateSphere('sun', { diameter: 1, segments: 32 }, this.scene)
    mesh.position = SUN_DIR.scale(SUN_DISTANCE)
    mesh.isPickable = false
    const material = new BABYLON.StandardMaterial('sunMaterial', this.scene)
    material.disableLighting = true
    const granulation = new BABYLON.NoiseProceduralTexture('sunGranulation', 256, this.scene)
    granulation.octaves = 4
    granulation.persistence = 0.9
    granulation.brightness = 0.6
    granulation.animationSpeedFactor = 0.5
    material.emissiveTexture = granulation // tinted by emissiveColor
    mesh.material = material
    const glow = new BABYLON.GlowLayer('sunGlow', this.scene, { blurKernelSize: 64 })
    glow.intensity = 1.5
    // every mesh enters the glow map so the planet occludes the halo; only the sun emits
    glow.customEmissiveColorSelector = (m, _subMesh, _material, result) => {
      if (m === mesh) result.set(material.emissiveColor.r, material.emissiveColor.g, material.emissiveColor.b, 1)
      else result.set(0, 0, 0, 0)
    }
    const light = new BABYLON.DirectionalLight('sunLight', SUN_DIR.negate(), this.scene)
    light.specular = BABYLON.Color3.Black()

    // soft additive halo; depth-tested so the planet hides it
    const SPRITE = 128
    const sprite = () => BABYLON.RawTexture.CreateRGBATexture(new Uint8Array(radialFalloff(SPRITE).buffer), SPRITE, SPRITE, this.scene, false)
    const corona = BABYLON.MeshBuilder.CreatePlane('sunCorona', { size: CORONA_SIZE }, this.scene)
    corona.parent = mesh
    corona.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL
    corona.isPickable = false
    const coronaMaterial = new BABYLON.StandardMaterial('sunCoronaMaterial', this.scene)
    coronaMaterial.disableLighting = true
    coronaMaterial.emissiveTexture = sprite()
    coronaMaterial.opacityTexture = coronaMaterial.emissiveTexture
    coronaMaterial.alphaMode = BABYLON.Engine.ALPHA_ADD
    coronaMaterial.disableDepthWrite = true
    corona.material = coronaMaterial
    glow.addExcludedMesh(corona)

    // Babylon places flares on the star -> screen-center axis, fades them near the border and hides them when occluded
    const flares = new BABYLON.LensFlareSystem('sunFlares', mesh, this.scene)
    const flareTexture = sprite()
    for (const [size, position] of FLARES) new BABYLON.LensFlare(size, position, BABYLON.Color3.White(), '', flares).texture = flareTexture
    flares.meshesSelectionPredicate = m => m.isEnabled() && m.isVisible && !!m.material
      && m !== mesh && m !== corona && m !== this.nebula && m !== this.stars?.mesh && m !== this.orbitLine
      && m !== this.planet.mesh.atmosphereMesh
    return { mesh, material, light, glow, corona, flares }
  }

  /** Gaussian-blurred green/blue/purple clouds on an equirect texture inside a big sphere. */
  createNebula() {
    const W = 2048, H = 1024
    const pixels = nebulaPixels(nebulaBlobs(NEBULA_BLOBS, 2), W, H)
    const texture = BABYLON.RawTexture.CreateRGBATexture(new Uint8Array(pixels.buffer), W, H, this.scene, false, false, BABYLON.Texture.BILINEAR_SAMPLINGMODE)
    const mesh = BABYLON.MeshBuilder.CreateSphere('nebula', { diameter: STAR_RADIUS * 3.6, segments: 32, sideOrientation: BABYLON.Mesh.BACKSIDE }, this.scene)
    const material = new BABYLON.StandardMaterial('nebulaMaterial', this.scene)
    material.disableLighting = true
    material.emissiveTexture = texture
    material.diffuseColor = BABYLON.Color3.Black()
    material.specularColor = BABYLON.Color3.Black()
    mesh.material = material
    mesh.infiniteDistance = true
    mesh.isPickable = false
    mesh.alwaysSelectAsActiveMesh = true
    return mesh
  }

  createStars() {
    const field = starField(this.starCount, STAR_RADIUS, 1)
    const colors = new Float32Array(this.starCount * 4).fill(1)
    const mesh = new BABYLON.Mesh('stars', this.scene)
    const data = new BABYLON.VertexData()
    data.positions = field.positions
    data.colors = colors
    data.applyToMesh(mesh, true)
    const material = new BABYLON.StandardMaterial('starsMaterial', this.scene)
    material.pointsCloud = true
    material.pointSize = 2
    material.disableLighting = true
    material.emissiveColor = BABYLON.Color3.White()
    material.alpha = 0.999 // enables blending; additive so dim stars brighten the nebula instead of punching dark squares in it
    material.alphaMode = BABYLON.Engine.ALPHA_ADD
    mesh.material = material
    mesh.infiniteDistance = true
    mesh.isPickable = false
    mesh.alwaysSelectAsActiveMesh = true // surrounds the camera, skip frustum culling
    return { mesh, field, colors }
  }

  setGraphicalSettings() {
    if (!HardwareInfo.hasGoodVideoCard()) {
      // this.engine.setHardwareScalingLevel(1.25)
    }
    this.engine.renderEvenInBackground = false
  }

  prepareGraphicalPipeline(): BABYLON.DefaultRenderingPipeline {
    const pipeline = new BABYLON.DefaultRenderingPipeline(
      "default", // The name of the pipeline
      true, // Do you want HDR textures ?
      this.scene, // The scene instance
      [this.camera] // The list of cameras to be attached to
    )

    pipeline.imageProcessingEnabled = true
    pipeline.imageProcessing.contrast = 1.2
    pipeline.fxaaEnabled = false
    pipeline.bloomEnabled = true
    pipeline.sharpenEnabled = true
    pipeline.grainEnabled = true
    pipeline.grain.intensity = 5
    pipeline.grain.animated = true
    pipeline.sharpen.colorAmount = 1
    if (HardwareInfo.hasGoodVideoCard()) {
      pipeline.samples = 4
      pipeline.sharpen.edgeAmount = 0.4
    } else {
      pipeline.sharpen.edgeAmount = 0.2
    }

    return pipeline
  }
}

export { Game }
