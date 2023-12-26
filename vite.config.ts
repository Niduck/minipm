import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
// https://vitejs.dev/config/
export default function({mode}){
  const baseURL = mode === 'ghpages' ? "/dowop_time-tracking" : ""

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
