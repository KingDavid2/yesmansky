<template>
  <div id="app">
    <canvas id="view" width="500" height="500" v-bind:style="{ filter: `blur(${canvasBlur}px)` }"></canvas>
    <div id="ui" class="container is-fluid">
      <Hello></Hello>
      <div id="main-grid" class="columns">
        <PlanetForm v-if="planet" :planet="planet" :game="game"></PlanetForm>
      </div>
      <Footer></Footer>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import Hello from './components/Hello.vue';
import PlanetForm from './components/PlanetForm.vue';
import Footer from './components/Footer.vue';
import { Game } from './Game'

export default defineComponent({
  name: 'app',
  components: {
    Hello,
    PlanetForm,
    Footer
  },
  data: function () {
    return {
      canvasBlur: 10,
      game: undefined as Game | undefined,
      planet: undefined
    }
  },
  mounted: function () {
    const view = document.getElementById("view") as HTMLCanvasElement
    view.width = window.innerWidth
    view.height = window.innerHeight

    // markRaw: keep Babylon objects out of Vue 3 reactive proxies
    this.game = window.game = markRaw(new Game(view)) // Instantiate game
    this.planet = markRaw(window.game.planet)

    // Skip intro blur on first click (Hello hides its message the same way)
    window.addEventListener('pointerdown', () => { this.canvasBlur = 0 }, { once: true })
    setTimeout(() => {
      this.unblur()
    }, 4000);
  },
  methods: {
    unblur: function () {
      const unblur = setInterval(() => {
        this.canvasBlur = Math.max(0, this.canvasBlur-0.5)
        if (this.canvasBlur <= 0) {
          clearInterval(unblur)
        }
      }, 100)
    }
  }
});
</script>

<style lang="scss">
@import './assets/bulma-theme';
@import './assets/fix-inspector';

body{
  overflow: hidden;
  height: 100%;
}

#view {
  touch-action: none;
  width: 100%;
  height: 100%;
}

#app {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#ui {
  pointer-events: none;
  position: absolute;
  top: 0px;
  width: 100%;
  height: 100%;
  margin: 0;
  & > * {
    pointer-events: all;
  }
}

#main-grid {
  pointer-events: none;
  & > * {
    pointer-events: all;
  }
}
</style>
