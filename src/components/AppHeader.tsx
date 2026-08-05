/**
 * App shell header: brand mark, product title, and the working-name badge.
 * The badge shows the interim project code (`s00011-pdftool`) until a brand
 * name is confirmed (design spec §1).
 */
export default function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M9 13h6" />
            <path d="M9 17h4" />
          </svg>
        </span>
        <div>
          <h1 className="app-header__title">PDF 워크스페이스</h1>
          <p className="app-header__subtitle">
            브라우저에서 바로 처리 · 파일은 서버로 전송되지 않습니다
          </p>
        </div>
      </div>
      <span className="app-header__job-badge">s00011-pdftool</span>
    </header>
  )
}
