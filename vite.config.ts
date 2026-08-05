import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static SPA build. Output stays at the Vite default `dist/`
// so the preview runtime auto-detects it (see conventions/stack-frontend-react.md).
export default defineConfig({
  plugins: [react()],
})
