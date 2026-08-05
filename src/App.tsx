import AppHeader from './components/AppHeader'
import Toolbar from './components/Toolbar'
import Dropzone from './components/Dropzone'
import { useSourceFiles } from './state/useSourceFiles'
import './styles/App.css'

/**
 * Workspace screen (grain-2).
 * Owns the `sourceFiles` state so later grains (page grid, export) can consume
 * it, and wires the dropzone to load PDFs by drop or file picker. Page grid and
 * export land in later grains.
 */
export default function App() {
  const { sourceFiles, rejected, isLoading, addFiles, dismissRejected } =
    useSourceFiles()

  return (
    <div className="app-shell">
      <AppHeader />
      <Toolbar />
      <Dropzone
        sourceFiles={sourceFiles}
        rejected={rejected}
        isLoading={isLoading}
        onAddFiles={addFiles}
        onDismissRejected={dismissRejected}
      />
    </div>
  )
}
