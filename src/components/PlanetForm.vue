<template>
  <div v-bind:style="`opacity: ${alpha};`" class="column is-half-tablet is-one-quarter-desktop is-one-fifth-fullhd">
    <div class="card">
      <header class="card-header" v-on:click="openned = !openned">
        <a class="card-header-title">
          Procedural generation settings
        </a>
        <a href="#" class="card-header-icon" aria-label="more options">
          <b-icon :icon="openned ? 'chevron-down' : 'chevron-right'"></b-icon>
        </a>
      </header>

      <div class="card-content" v-if="openned">
        <b-field label="Name (seed)" expanded>
          <b-field>
            <b-input v-model="settings.terrainSeed" expanded placeholder="Seed..."></b-input>
            <p class="control">
              <b-button v-on:click="setRandomSeed" class="button is-warning">Random</b-button>
            </p>
          </b-field>
        </b-field>

        <b-tabs>
          <b-tab-item label="Planet">
            <label class="label has-text-warning">General</label>
            <b-field label="Planet type">
              <div class="block">
                <b-radio v-model="settings.type" name="type" native-value="terra">Terrestrial</b-radio>
                <b-radio v-model="settings.type" name="type" native-value="gas">Gas</b-radio>
              </div>
            </b-field>

            <template v-if="settings.type === 'terra'">
            <label class="label has-text-warning">Terrain</label>
            <b-field label="Landmass scale">
              <b-slider v-model="settings.landMassSize"></b-slider>
            </b-field>

            <b-field label="Roughness">
              <b-slider v-model="settings.roughness" :min="0" :max="3" :value="2" aria-label="Roughness" :tooltip="false">
                <b-slider-tick :value="0">Low</b-slider-tick>
                <b-slider-tick :value="1">Medium</b-slider-tick>
                <b-slider-tick :value="2">High</b-slider-tick>
                <b-slider-tick :value="3">Very High</b-slider-tick>
              </b-slider>
            </b-field>

            <b-field>
              <b-checkbox v-model="settings.water">Seas</b-checkbox>
            </b-field>

            <b-field label="Sea level">
              <b-slider v-model="settings.seaLevel"></b-slider>
            </b-field>

            <b-field label="Coast detail">
              <b-slider v-model="settings.coastDetail" :min="0" :max="3" aria-label="Coast detail" :tooltip="false">
                <b-slider-tick :value="0">None</b-slider-tick>
                <b-slider-tick :value="1">Low</b-slider-tick>
                <b-slider-tick :value="2">Medium</b-slider-tick>
                <b-slider-tick :value="3">High</b-slider-tick>
              </b-slider>
            </b-field>
            </template>

            <template v-else>
            <label class="label has-text-warning">Bands</label>
            <b-field label="Band count">
              <b-slider v-model="settings.bands" :min="4" :max="24" aria-label="Band count"></b-slider>
            </b-field>

            <b-field label="Turbulence">
              <b-slider v-model="settings.turbulence" :min="0" :max="3" aria-label="Turbulence" :tooltip="false">
                <b-slider-tick :value="0">None</b-slider-tick>
                <b-slider-tick :value="1">Low</b-slider-tick>
                <b-slider-tick :value="2">Medium</b-slider-tick>
                <b-slider-tick :value="3">High</b-slider-tick>
              </b-slider>
            </b-field>
            </template>

            <label class="label has-text-warning">Colors</label>
            <b-field>
              <b-checkbox v-model="settings.realColors">Realistic colors</b-checkbox>
            </b-field>

            <b-field label="Color palette" v-if="settings.realColors">
              <b-select v-model="settings.realPalette" expanded>
                <option v-for="(palette, key) in palettesForType" :key="key" :value="key">{{ palette.label }}</option>
              </b-select>
            </b-field>

            <label class="label has-text-warning">Atmosphere</label>
            <b-field label="Density">
              <b-slider v-model="settings.atmosphereDensity" :min="0" :max="3" :value="2" aria-label="Atmosphere density" :tooltip="false">
                <b-slider-tick :value="0"></b-slider-tick>
                <b-slider-tick :value="1">Thin</b-slider-tick>
                <b-slider-tick :value="2">Medium</b-slider-tick>
                <b-slider-tick :value="3">Dense</b-slider-tick>
              </b-slider>
            </b-field>

            <b-field label="Main composition">
              <b-select v-model="settings.atmosphereColor" placeholder="Choose" expanded>
                <option value="blue">Oxygen & Nitrogen</option>
                <option value="orange">Carbon Dioxide</option>
                <option value="white">Hydrogen</option>
                <option value="green">Methane</option>
                <option value="purple">Argon</option>
              </b-select>
            </b-field>

            <label class="label has-text-warning">Motion</label>
            <b-field label="Rotation speed">
              <b-slider v-model="rotationSpeed" :min="0" :max="10" :step="0.5" aria-label="Rotation speed"></b-slider>
            </b-field>
          </b-tab-item>

          <b-tab-item label="Rings">
            <b-field>
              <b-checkbox v-model="ringsEnabled">Rings</b-checkbox>
            </b-field>

            <template v-if="ringsEnabled">
            <b-field label="Ring count">
              <b-slider v-model="ringCount" :min="1" :max="5" aria-label="Ring count"></b-slider>
            </b-field>

            <div v-for="(ring, i) in rings" :key="i">
              <label class="label has-text-warning">Ring {{ i + 1 }}</label>
              <b-field label="Width">
                <b-slider v-model="ring.width" :min="0.05" :max="1" :step="0.05" :aria-label="`Ring ${i + 1} width`"></b-slider>
              </b-field>
              <b-field :label="i === 0 ? 'Gap from planet' : 'Gap from previous ring'">
                <b-slider v-model="ring.gap" :min="0" :max="1" :step="0.05" :aria-label="`Ring ${i + 1} gap`"></b-slider>
              </b-field>
              <b-field label="Color">
                <input type="color" v-model="ring.color" :aria-label="`Ring ${i + 1} color`">
              </b-field>
              <b-field label="Angle">
                <b-slider v-model="ring.angle" :min="-45" :max="45" :aria-label="`Ring ${i + 1} angle`"></b-slider>
              </b-field>
            </div>
            </template>
          </b-tab-item>

          <b-tab-item label="Satellites">
            <b-field>
              <b-checkbox v-model="satellitesEnabled">Satellites</b-checkbox>
            </b-field>

            <template v-if="satellitesEnabled">
            <b-field label="Satellite count">
              <b-slider v-model="satelliteCount" :min="1" :max="5" aria-label="Satellite count"></b-slider>
            </b-field>

            <div v-for="(sat, i) in satellites" :key="i">
              <label class="label has-text-warning">Satellite {{ i + 1 }}</label>
              <b-field label="Width">
                <b-slider v-model="sat.width" :min="0.02" :max="0.5" :step="0.01" :aria-label="`Satellite ${i + 1} width`"></b-slider>
              </b-field>
              <b-field label="Gap from planet">
                <b-slider v-model="sat.gap" :min="0.1" :max="3" :step="0.05" :aria-label="`Satellite ${i + 1} gap`"></b-slider>
              </b-field>
              <b-field label="Color">
                <input type="color" v-model="sat.color" :aria-label="`Satellite ${i + 1} color`">
              </b-field>
              <b-field label="Angle">
                <b-slider v-model="sat.angle" :min="-90" :max="90" :aria-label="`Satellite ${i + 1} angle`"></b-slider>
              </b-field>
              <b-field label="Shape">
                <b-select v-model="sat.shape" expanded>
                  <option value="regular">Regular</option>
                  <option value="irregular">Irregular</option>
                </b-select>
              </b-field>
              <b-field label="Rotation speed">
                <b-slider v-model="sat.rotationSpeed" :min="0" :max="10" :step="0.5" :aria-label="`Satellite ${i + 1} rotation speed`"></b-slider>
              </b-field>
              <b-field label="Translation speed">
                <b-slider v-model="sat.translationSpeed" :min="0" :max="10" :step="0.5" :aria-label="`Satellite ${i + 1} translation speed`"></b-slider>
              </b-field>
            </div>
            </template>
          </b-tab-item>

          <b-tab-item label="Space">
            <b-field>
              <b-checkbox v-model="backgroundEnabled">Starry background</b-checkbox>
            </b-field>
            <b-field v-if="backgroundEnabled" label="Number of stars">
              <b-slider v-model="starCount" :min="100" :max="5000" :step="100" lazy aria-label="Number of stars"></b-slider>
            </b-field>

            <b-field>
              <b-checkbox v-model="star.enabled">Star</b-checkbox>
            </b-field>

            <template v-if="star.enabled">
            <b-field label="Star class">
              <b-select v-model="star.starClass" expanded>
                <option v-for="(starClass, key) in starClasses" :key="key" :value="key">{{ starClass.label }}</option>
              </b-select>
            </b-field>
            <b-field label="Distance to star (AU)">
              <b-slider v-model="star.distance" :min="0.2" :max="5" :step="0.1" aria-label="Distance to star"></b-slider>
            </b-field>
            </template>
          </b-tab-item>
        </b-tabs>
      </div>
      <footer class="card-footer">
        <a v-on:click="save" class="card-footer-item button is-primary">Save</a>
        <a v-on:click="$refs.loadInput.click()" class="card-footer-item button is-info">Load</a>
        <input ref="loadInput" type="file" accept=".json,application/json" hidden v-on:change="load">
        <a v-on:click="setRandomSettings" class="card-footer-item button is-warning">Randomize</a>
        <a v-on:click="openned = !openned" class="card-footer-item button is-text">{{ openned ? 'Close' : 'Settings' }} </a>
      </footer>
    </div>
  </div>
</template>

<script lang="ts">
import { debounce } from 'lodash-es';
import { defineComponent, markRaw } from 'vue';
import { Planet } from '../Planet/Planet';
import { Game } from '../Game';
import { REAL_PALETTES } from '../Planet/realPalettes';
import { STAR_CLASSES } from '../Space/star';

export default defineComponent({
  name: 'PlanetForm',
  props: {
    game: Game,
    planet: Planet
  },
  data: function () {
    return {
      alpha: 0,
      openned: false,
      planetInstance: this.planet,
      rotationSpeed: 1, // outside settings: changing it must not rebuild the planet
      ringsEnabled: false, // rings also outside settings: updated live, no rebuild
      ringCount: 1,
      rings: [{ width: 0.3, gap: 0.2, angle: 0, color: '#c8a878' }],
      backgroundEnabled: false, // scene-level, no rebuild
      starCount: 1500,
      star: { enabled: false, starClass: 'G', distance: 1 }, // scene-level, no rebuild
      starClasses: STAR_CLASSES,
      satellitesEnabled: false, // live like rings, no rebuild
      satelliteCount: 1,
      satellites: [{ width: 0.15, gap: 1, angle: 10, color: '#aaaaaa', shape: 'irregular', rotationSpeed: 1, translationSpeed: 1 }],
      settings: {
        terrainSeed: 'GIB GIB',
        type: 'terra',
        landMassSize: 80,
        roughness: 1,
        seaLevel: 25,
        water: true,
        coastDetail: 1,
        bands: 10,
        turbulence: 1,
        atmosphereDensity: 2,
        atmosphereColor: 'blue',
        realColors: false,
        realPalette: 'earth'
      }
    }
  },
  created: function () {
    this.rebuildPlanet = debounce(this.rebuildPlanet, 2000)
  },
  mounted: function () {
    setTimeout(() => {
      this.fadeIn()
    }, 4000);
  },
  computed: {
    palettesForType () {
      const gas = this.settings.type === 'gas'
      return Object.fromEntries(Object.entries(REAL_PALETTES).filter(([, p]) => !!p.gas === gas))
    },
    activeRings () {
      return this.ringsEnabled ? this.rings : []
    },
    activeSatellites () {
      return this.satellitesEnabled ? this.satellites : []
    }
  },
  watch: {
    'settings.type' () {
      if (!(this.settings.realPalette in this.palettesForType)) {
        this.settings.realPalette = Object.keys(this.palettesForType)[0]
      }
    },
    rotationSpeed (value) {
      this.game.rotationSpeed = value
    },
    backgroundEnabled (value) {
      this.game.setBackground(value)
    },
    starCount (value) {
      this.game.setStarCount(value)
    },
    star: {
      handler (value) {
        this.game.setStar(value)
      },
      deep: true
    },
    ringCount (count) {
      while (this.rings.length < count) this.rings.push({ width: 0.3, gap: 0.05, angle: 0, color: '#a08060' })
      this.rings.length = count
    },
    activeRings: {
      handler (rings) {
        this.planetInstance.setRings(rings)
      },
      deep: true
    },
    satelliteCount (count) {
      while (this.satellites.length < count) {
        this.satellites.push({ width: 0.1, gap: 0.5 + this.satellites.length * 0.6, angle: 0, color: '#999999', shape: 'irregular', rotationSpeed: 1, translationSpeed: 1 })
      }
      this.satellites.length = count
    },
    activeSatellites: {
      handler (satellites) {
        this.planetInstance.setSatellites(satellites)
      },
      deep: true
    },
    settings: {
      handler (newSettings) {
        this.rebuildPlanet(newSettings)
      },
      deep: true
    }
  },
  methods: {
    save: function () {
      const { settings, rotationSpeed, ringsEnabled, rings, satellitesEnabled, satellites, backgroundEnabled, starCount, star } = this
      const json = JSON.stringify({ settings, rotationSpeed, ringsEnabled, rings, satellitesEnabled, satellites, backgroundEnabled, starCount, star }, null, 2)
      const link = document.createElement('a')
      link.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
      link.download = `${settings.terrainSeed || 'planet'}.json`
      link.click()
      URL.revokeObjectURL(link.href)
    },
    load: async function (event) {
      const file = event.target.files[0]
      event.target.value = '' // allow loading the same file twice
      if (!file) return
      let saved
      try {
        saved = JSON.parse(await file.text())
      } catch {
        this.$buefy.toast.open({ message: 'Invalid planet file', type: 'is-danger' })
        return
      }
      if (!saved?.settings) {
        this.$buefy.toast.open({ message: 'Invalid planet file', type: 'is-danger' })
        return
      }
      Object.assign(this.settings, saved.settings)
      this.rotationSpeed = saved.rotationSpeed ?? this.rotationSpeed
      if (saved.rings?.length) {
        this.rings = saved.rings
        this.ringCount = saved.rings.length
      }
      if (saved.satellites?.length) {
        this.satellites = saved.satellites
        this.satelliteCount = saved.satellites.length
      }
      this.ringsEnabled = !!saved.ringsEnabled
      this.satellitesEnabled = !!saved.satellitesEnabled
      this.backgroundEnabled = !!saved.backgroundEnabled
      this.starCount = saved.starCount ?? 1500
      Object.assign(this.star, { enabled: false }, saved.star)
    },
    setRandomSeed: function () {
      const baseName = ['Planet ', 'Moon ', 'Rogue ', 'Exo ', 'Dwarf ', 'Earth ', 'Hypothetical ', '', '', '']
      const randomBaseName = baseName[Math.floor(Math.random()*baseName.length)]
      const randomNamePart = Math.random().toString(36).substring(6+Math.random()*6)
      this.settings.terrainSeed = `${randomBaseName}${randomNamePart}`
    },
    setRandomSettings: function () {
      const possibleAtmospheres = ['blue', 'orange', 'white', 'green', 'purple']
      this.setRandomSeed()
      this.settings.landMassSize = Math.round(Math.random()*70+10)
      this.settings.roughness = Math.round(Math.random()*4)
      this.settings.seaLevel = Math.round(Math.random()*55)
      this.settings.coastDetail = Math.round(Math.random()*3)
      this.settings.bands = Math.round(Math.random()*20+4)
      this.settings.turbulence = Math.round(Math.random()*3)
      this.settings.atmosphereDensity = Math.round(Math.random()*4)
      this.settings.atmosphereColor = possibleAtmospheres[Math.floor(Math.random()*possibleAtmospheres.length)]
    },
    fadeIn: function () {
      const disapear = setInterval(() => {
        this.alpha = Math.min(1, this.alpha+0.04)
        if (this.alpha >= 1) {
          clearInterval(disapear)
        }
      }, 50)
    },
    rebuildPlanet: function (newSettings) {
      console.log('rebuilding planet...');
      this.planetInstance.dispose()
      this.game.planet = this.planetInstance = markRaw(new Planet('planet', { ...newSettings, rings: this.activeRings, satellites: this.activeSatellites }, this.game.scene))
    }
  }
})
</script>

<style scoped>
/* Settings grew past the viewport (rings); scroll inside the card, header/footer stay put */
.card-content {
  max-height: calc(100vh - 14rem);
  overflow-y: auto;
}
</style>
