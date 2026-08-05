/**
 * Pure `sourceFiles` → `WorkspacePage[]` derivation (design spec S-00011 §5).
 *
 * The page grid lists *every* page of *every* loaded file in one flat grid. This
 * module is the single place that flattens the loaded documents into the ordered
 * `pages` array that later becomes the workspace SSoT for order/rotation/deletion.
 *
 * It is intentionally React-, DOM- and pdf.js-free so the flattening rules can be
 * unit tested in plain Node. Rendering (pdf.js) and colour assignment
 * (`source-color`) live in their own modules; this one only decides *which* pages
 * exist and in what order.
 */
import type { SourceFile, WorkspacePage } from './types'

/**
 * Rotation a freshly-derived page starts at. Absolute orientation in degrees;
 * later grains (rotate) mutate the SSoT `pages` array, never the source bytes.
 */
export const DEFAULT_PAGE_ROTATION = 0

/**
 * Stable id for a derived page: `"{sourceFileId}:{pageIndex}"`.
 *
 * Deterministic so the same (source, page) always yields the same key — React
 * can keep a card mounted across re-derivations, which is what lets a lazily
 * rendered thumbnail survive an unrelated state change instead of re-rasterising.
 */
export function workspacePageId(sourceFileId: string, pageIndex: number): string {
  return `${sourceFileId}:${pageIndex}`
}

/**
 * Flattens loaded source files into the ordered workspace `pages` array.
 *
 * Files are visited in `sourceFiles` order (i.e. load order) and each file
 * contributes its pages `0 … pageCount-1` in ascending order, so the resulting
 * grid reads file-by-file, page-by-page. Every page points back to its origin
 * via `sourceFileId` + `pageIndex` and owns no bytes, keeping the original
 * {@link SourceFile} data untouched (SSoT).
 *
 * @param sourceFiles Loaded files in workspace order.
 * @returns One {@link WorkspacePage} per page across all files, in grid order.
 * @throws {RangeError} If a file reports a `pageCount` that is not a
 *   non-negative integer — that signals a corrupt load result, not user error,
 *   and is surfaced loudly rather than silently producing a truncated grid.
 */
export function deriveWorkspacePages(
  sourceFiles: readonly SourceFile[],
): WorkspacePage[] {
  const pages: WorkspacePage[] = []

  for (const file of sourceFiles) {
    if (!Number.isInteger(file.pageCount) || file.pageCount < 0) {
      throw new RangeError(
        `deriveWorkspacePages: source "${file.id}" has an invalid pageCount ` +
          `(${file.pageCount}); expected a non-negative integer`,
      )
    }

    for (let pageIndex = 0; pageIndex < file.pageCount; pageIndex += 1) {
      pages.push({
        id: workspacePageId(file.id, pageIndex),
        sourceFileId: file.id,
        pageIndex,
        rotation: DEFAULT_PAGE_ROTATION,
      })
    }
  }

  return pages
}
