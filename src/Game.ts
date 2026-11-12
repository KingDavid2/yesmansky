import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import localforage from 'localforage'
import { Planet } from './Planet/Planet';
import { HardwareInfo } from './Infrastructure/HardwareInfo';
import { starField, twinkle } from './Space/stars';

const STAR_COUNT = 1500 // default
const STAR_RADIUS = 500
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
      4.5,
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
    this.scene.render();
  }

  /** Black sky with twinkling stars; off restores the default clear color. */
  setBackground(enabled: boolean) {
    this.scene.clearColor = enabled ? new BABYLON.Color4(0, 0, 0, 1) : this.defaultClearColor.clone()
    if (enabled && !this.stars) this.stars = this.createStars()
    this.stars?.mesh.setEnabled(enabled)
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
