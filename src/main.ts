import { createApp } from 'vue'
import Buefy from 'buefy'
import App from './App.vue'
import { Game } from './Game'
import localforage from 'localforage'
import * as BABYLON from '@babylonjs/core/Legacy/legacy'

declare global {
  interface Window {
    game: Game
    localforage: LocalForage
    BABYLON: any
  }
}

if (import.meta.env.DEV) {
  window.localforage = localforage
  window.BABYLON = BABYLON
}

createApp(App).use(Buefy).mount('#app')
