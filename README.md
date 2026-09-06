# s00011-pdftool — PDF Workspace

A static web app that handles the repetitive work of merging and splitting PDFs
(for approvals, submissions, etc.) right in the browser. All processing runs
**100% client-side (in the browser)** and **files are never sent to any
server.** The UI language is English.

- Management code: S-00011 (document & form utilities)
- Working name: `s00011-pdftool` (kept until the brand name is finalized)
- Reference service: iLovePDF (but as a unified workspace rather than
  per-tool pages)

## Tech stack

| Role | Choice | Notes |
| --- | --- | --- |
| Build / framework | Vite + React + TypeScript | Only static build output is deployed |
| PDF manipulation | pdf-lib | Merge / split / rotate (planned) |
| Thumbnail rendering | pdfjs-dist | Web Worker rendering (planned) |
| Drag sorting | dnd-kit | Page card reordering (planned) |
| zip bundling | client-zip | For multi-file split results (planned) |
| Testing | Vitest | Unit tests for core logic (planned) |

There is no server component. Static hosting (a local preview or any static
host) is all it takes to run, and the build output goes to Vite's default
`dist/` directory.

## Current status

The workspace screen and the MVP feature set below are implemented and covered
by unit tests. Everything runs in the browser: there is no server component, no
database, and no account system.

## MVP scope

- **Merge**: load multiple PDFs and export them as one PDF, preserving the
  current page order and rotation
- **Split / extract**: extract selected pages, split every N pages, split by
  ranges (`1-3, 7, 10-12`); multiple results download as a zip
- **Page editing**: drag-to-reorder in the thumbnail grid, 90° rotation,
  deletion, checkbox selection

Compression, image↔PDF conversion, form workflow presets, and PWA/offline
support are out of scope until phase 2 or later.

## Generated file names

The file names produced by export and split are decided by a pure function
(`core/download.ts`) from the source file names. Because users observe these
strings directly in their downloads, the rules are documented here. All wording
is English (unified English templates), and the exact values are managed in one
place: the `filenames` group in `src/strings.ts`.

- **Merge / export all**
  - One source: that name, normalized, with a `.pdf` extension
    (e.g. `report.pdf`).
  - Several sources: the first name followed by a `+N more` marker, where `N`
    is the number of remaining sources beyond the first. The composition,
    separator, and order follow `"{firstName}-{marker}"`.
    - Example: `["a.pdf", "b.pdf", "c.pdf"]` → `a-+2 more.pdf`.
  - No usable name: fallback `merged.pdf`.
- **Export selected pages**: follows the same rules as merge, except the
  fallback when no usable source name exists is `selected-pages.pdf`.
- **Split (every N / by range)**: `"{base}-{n}.pdf"`, where `n` is a 1-based
  part number zero-padded to the width of the total part count
  (e.g. `report-01.pdf` … `report-12.pdf`). No usable base: fallback `split`.

> Rule history: the merge marker used to be a Korean-language notation
> (meaning "and N others") and was changed to `+N more` as part of the switch
> to English templates (the separator and order are unchanged). The
> Korean-language fallback for selected pages likewise became
> `selected-pages`. Any future marker change only requires editing the
> `filenames` group in `src/strings.ts`.

Names are stripped of directory prefixes and characters reserved on common
platforms (`< > : " | ? *`).

## Running locally (green-field)

This is a pure client-side static frontend. There is **no database, no
migration, no seed data, and no dummy account or credential** — nothing to
provision before the first run, and no environment variables or secrets to
supply. Starting from a clean checkout, these two commands are all it takes:

```bash
npm ci           # install dependencies exactly as locked (npm install also works)
npm run dev      # dev server (Vite, default http://localhost:5173)
```

Open the address the dev server prints to use the workspace.

## Production build / preview

```bash
npm run build    # type check (tsc -b) + static build → dist/
npm run preview  # serve the build output locally
```

`npm run build` writes the static output to `dist/`, and `npm run preview`
serves that output so you can check the real bundle before shipping.

The preview runtime detects and serves `dist/` automatically, so there is no
`preview.toml` in this repository: the app sits at the repo root, `vite` is a
dependency, the standard `build` script is present, and the output directory is
left at Vite's default `dist/`. That is the documented build-to-static detection
path — build with `npm run build`, serve `dist/`. If the app ever moves into a
subdirectory, renames its `build` script, changes `build.outDir`, gains a server
process, or starts requiring env keys, add a `preview.toml` declaring the new
shape (see `context/decisions/2026-09-06-no-preview-toml.md`).

Assets are referenced with document-relative URLs (`./assets/...`, set via
`base: './'` in `vite.config.ts`), so `dist/` serves correctly over plain HTTP
whether it is mounted at the domain root or under a sub-path behind the reverse
proxy.
