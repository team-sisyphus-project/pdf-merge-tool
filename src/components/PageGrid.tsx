import { useMemo } from 'react'
import { assignSourceColors } from '../core/source-color'
import type { ThumbnailRenderer } from '../core/thumbnail'
import type { SourceFile, WorkspacePage } from '../core/types'
import PageThumbnailCard from './PageThumbnailCard'

/**
 * The unified page grid (design spec §4): every page of every loaded file laid
 * out as thumbnail cards in one grid, each tagged with its origin file's colour.
 *
 * The grid owns the cross-cutting concerns a single card cannot see:
 *
 * - **Colour assignment** — resolves each source id to its categorical colour
 *   once ({@link assignSourceColors}) so every card of the same file shares one
 *   colour and the palette stays stable as files are added.
 * - **Origin lookup** — links each {@link WorkspacePage} back to its
 *   {@link SourceFile} for the bytes/name a card needs.
 *
 * The lazy-render machinery itself lives per-card ({@link PageThumbnailCard}).
 */
export interface PageGridProps {
  /** Loaded files in workspace order — drives colour assignment order. */
  sourceFiles: SourceFile[]
  /** Flattened workspace pages (from `deriveWorkspacePages`). */
  pages: WorkspacePage[]
  /** Shared rasteriser so all cards reuse one parsed-document cache. */
  renderer: ThumbnailRenderer
  /** Thumbnail width in device pixels. Defaults to {@link DEFAULT_TARGET_WIDTH}. */
  targetWidth?: number
}

/** Device-pixel width each thumbnail is rasterised at. Implementation setting. */
const DEFAULT_TARGET_WIDTH = 240

export default function PageGrid({
  sourceFiles,
  pages,
  renderer,
  targetWidth = DEFAULT_TARGET_WIDTH,
}: PageGridProps) {
  // Colour per source id, assigned in load order (stable across re-renders).
  const colors = useMemo(
    () => assignSourceColors(sourceFiles.map((file) => file.id)),
    [sourceFiles],
  )
  // Origin file per id, for the bytes/name each card needs.
  const byId = useMemo(() => {
    const map = new Map<string, SourceFile>()
    for (const file of sourceFiles) map.set(file.id, file)
    return map
  }, [sourceFiles])

  if (pages.length === 0) return null

  return (
    <section className="page-grid-section" aria-label="페이지 미리보기">
      <h3 className="page-grid__title">페이지 {pages.length}개</h3>
      <div className="page-grid">
        {pages.map((page) => {
          const source = byId.get(page.sourceFileId)
          const color = colors.get(page.sourceFileId)
          // A page whose source vanished is a corrupt derivation, not a render
          // error — skip it rather than crash the whole grid.
          if (!source || !color) return null

          return (
            <PageThumbnailCard
              key={page.id}
              sourceId={source.id}
              bytes={source.bytes}
              pageIndex={page.pageIndex}
              sourceName={source.name}
              pageLabel={page.pageIndex + 1}
              color={color}
              targetWidth={targetWidth}
              renderer={renderer}
            />
          )
        })}
      </div>
    </section>
  )
}
