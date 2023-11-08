
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
const path = require('path');
export default defineConfig({
  plugins: [
    vue(), 
    VitePWA({
      registerType: 'prompt',
    })
  ],
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    alias: {
        "@": path.resolve(__dirname, "./src"),
    }
  },
  
  
})