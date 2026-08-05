import './styles/App.css'

/**
 * Placeholder workspace shell for grain-1.
 * Renders an empty workspace screen; PDF loading/editing/export UI
 * lands in later grains.
 */
export default function App() {
  return (
    <main className="workspace">
      <div className="workspace__panel">
        <h1 className="workspace__title">PDF 워크스페이스</h1>
        <p className="workspace__lead">
          여러 PDF를 합치고 나누는 작업을 한 화면에서 처리합니다.
        </p>
        <p className="workspace__note">
          모든 처리는 브라우저 안에서만 이루어지며, 파일은 서버로 전송되지
          않습니다.
        </p>
        <p className="workspace__placeholder">
          워크스페이스를 준비하고 있습니다.
        </p>
      </div>
    </main>
  )
}
