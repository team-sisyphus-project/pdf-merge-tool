import { useMemo } from 'react'
import AppHeader from './components/AppHeader'
import Toolbar from './components/Toolbar'
import Dropzone from './components/Dropzone'
import PageGrid from './components/PageGrid'
import { deriveWorkspacePages } from './core/pages'
import { ThumbnailRenderer } from './core/thumbnail'
import { useSourceFiles } from './state/useSourceFiles'
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
  const pages = useMemo(() => deriveWorkspacePages(sourceFiles), [sourceFiles])

  return (
    <div className="app-shell">
      <AppHeader />
      <Toolbar />
      <main className="workspace">
        <Dropzone
          sourceFiles={sourceFiles}
          rejected={rejected}
          isLoading={isLoading}
          onAddFiles={addFiles}
          onDismissRejected={dismissRejected}
        />
        <PageGrid sourceFiles={sourceFiles} pages={pages} renderer={renderer} />
      </main>
    </div>
  )
}
