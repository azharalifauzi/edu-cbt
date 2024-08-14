import { defineConfig } from 'astro/config'

import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'
import svgr from 'vite-plugin-svgr'
import node from '@astrojs/node'

// https://astro.build/config
export default defineConfig({
  output: 'server',
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  adapter: node({
    mode: 'standalone',
  }),
  vite: {
    plugins: [svgr()],
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url),
      },
    },
    optimizeDeps: {
      exclude: ['@mapbox', 'react-use', 'bcrypt', '@mapbox/node-pre-gyp'],
    },
  },
})
