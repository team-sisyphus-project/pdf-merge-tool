import { useCallback, useMemo } from 'react'
import AppHeader from './components/AppHeader'
import Toolbar from './components/Toolbar'
import Dropzone from './components/Dropzone'
import PageGrid from './components/PageGrid'
import { ThumbnailRenderer } from './core/thumbnail'
import { mergePages } from './core/merge'
import { buildExportFilename, downloadPdf } from './core/download'
import type { SourceFile, WorkspacePage } from './core/types'
import { useSourceFiles } from './state/useSourceFiles'
import { useWorkspacePages } from './state/useWorkspacePages'
import './styles/App.css'

/**
 * Workspace screen.
 * Owns the `sourceFiles` state, derives the flat `pages` array from it, and
 * renders the page grid (grain-3) below the dropzone. A single
 * {@link ThumbnailRenderer} is shared across every card so each source document
 * is parsed once regardless of how many of its pages are on screen. Export lands
 * in a later grain.
 */
export default function App() {
  const { sourceFiles, rejected, isLoading, addFiles, dismissRejected } =
    useSourceFiles()

  // One rasteriser for the whole workspace — its per-source document cache is
  // what keeps a many-page file from being re-parsed per thumbnail.
  const renderer = useMemo(() => new ThumbnailRenderer(), [])

  // The SSoT `pages` array (order/rotation/deletion) plus its mutations and the
  // selection set. Drag reordering commits through `reorder`; the per-card
  // rotate/delete/select controls (grain-3) commit through the rest.
  const { pages, selected, reorder, rotate, delete: deletePages, toggleSelect } =
    useWorkspacePages(sourceFiles)

  // A card's delete button removes exactly that one page; the SSoT `delete`
  // takes an id iterable, so wrap the single id.
  const deleteOne = useCallback(
    (id: string) => deletePages([id]),
    [deletePages],
  )

  // 전체 내보내기 (design spec §2, 병합): assemble the current `pages` (order +
  // rotation) into one PDF and hand the bytes to the client-side download. This
  // "how" lives here in the UI-owning layer; the toolbar owns the "when"
  // (button-state, in-progress, inline error). Rejects propagate so the toolbar
  // can surface the failure. All bytes stay in the browser (design spec §1).
  const exportAll = useCallback(
    async (pagesToExport: WorkspacePage[], files: SourceFile[]) => {
      const bytes = await mergePages(pagesToExport, files)
      const filename = buildExportFilename(files.map((file) => file.name))
      downloadPdf(bytes, filename)
    },
    [],
  )

  return (
    <div className="app-shell">
      <AppHeader />
      <Toolbar
        pages={pages}
        sourceFiles={sourceFiles}
        onExportAll={exportAll}
        selectedCount={selected.size}
      />
      <main className="workspace">
        <Dropzone
          sourceFiles={sourceFiles}
          rejected={rejected}
          isLoading={isLoading}
          onAddFiles={addFiles}
          onDismissRejected={dismissRejected}
        />
        <PageGrid
          sourceFiles={sourceFiles}
          pages={pages}
          renderer={renderer}
          onReorder={reorder}
          selected={selected}
          onRotate={rotate}
          onDelete={deleteOne}
          onToggleSelect={toggleSelect}
        />
      </main>
    </div>
  )
}
