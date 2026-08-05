import AppHeader from './components/AppHeader'
import Toolbar from './components/Toolbar'
import Dropzone from './components/Dropzone'
import './styles/App.css'

/**
 * Empty workspace screen (grain-2).
 * Composes the app shell: header + toolbar placeholder + central dropzone
 * empty state. PDF loading, page grid, and export land in later grains.
 */
export default function App() {
  return (
    <div className="app-shell">
      <AppHeader />
      <Toolbar />
      <Dropzone />
    </div>
  )
}
