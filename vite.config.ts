import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: './', // gh-pages support
  plugins: [vue()],
  server: { host: '0.0.0.0', port: 9000 },
  worker: { format: 'es' },
  css: {
    preprocessorOptions: {
      // ponytail: theme still uses @import + global color fns; port to @use when Sass 3 drops them
      scss: { silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'] },
    },
  },
})
