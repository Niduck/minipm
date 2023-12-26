import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
// https://vitejs.dev/config/
export default function(){
  const baseURL = "/minipm"

  return defineConfig({
    base: baseURL,
    build: {
      outDir: 'docs'
    },
    resolve: {
      alias: [{ find: '@', replacement: '/src' }, { find: 'src', replacement: '/src' }],
    },
    plugins: [react()],
  })
}
