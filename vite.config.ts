// `vitest/config` re-exports Vite's defineConfig with the `test` field typed.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Static SPA build. Output stays at the Vite default `dist/`
// so the preview runtime auto-detects it (see conventions/stack-frontend-react.md).
export default defineConfig({
  // Emit document-relative asset URLs (`./assets/...`) instead of root-absolute
  // ones. The app is served behind a reverse proxy that may mount it under a
  // sub-path, where `/assets/...` would resolve against the proxy root and 404.
  // `?url` asset imports (the pdf.js worker) keep working because Vite resolves
  // them through `import.meta.url`, i.e. relative to the emitted chunk.
  base: './',
  plugins: [react()],
  // Core logic (`src/core/`) is React-independent and unit tested with Vitest
  // under the fast default `node` environment. Component smoke tests (`.tsx`)
  // opt into jsdom per-file via a `@vitest-environment jsdom` docblock, so they
  // don't slow the core suite down.
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
