# Backlog

Out-of-scope findings recorded during grain work. Not fixed here.

## Tooling

- `vitest@4` pulls its own `rolldown-vite`, so every `npm test` run prints
  deprecation warnings from `@vitejs/plugin-react` (`esbuild` option vs `oxc`,
  `optimizeDeps.esbuildOptions` vs `optimizeDeps.rolldownOptions`). Tests pass;
  aligning the vitest/vite/plugin-react versions would silence them.
- `vite build` warns that the main chunk exceeds 500 kB (pdf-lib + pdfjs-dist
  are bundled eagerly). Code-splitting the PDF engines behind dynamic imports
  would cut first-paint bytes.
- `npm ci` reports 3 advisories (1 moderate, 2 high) in the dependency tree.
  Needs a triage pass before release.
