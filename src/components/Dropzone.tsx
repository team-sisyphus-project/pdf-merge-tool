/**
 * Central empty-state dropzone. Presentational only for this grain — it shows
 * the guidance copy and entry affordance. Actual file loading/parsing lands in
 * a later grain (design spec §4, out of scope here).
 */
export default function Dropzone() {
  return (
    <main className="workspace">
      <section className="dropzone" aria-label="PDF 불러오기 영역">
        <div className="dropzone__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 15V3" />
            <path d="m7 8 5-5 5 5" />
            <path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4" />
          </svg>
        </div>
        <h2 className="dropzone__title">PDF를 여기에 끌어다 놓으세요</h2>
        <p className="dropzone__desc">
          또는 아래 버튼으로 파일을 선택하세요. 여러 개를 한 번에 불러올 수
          있습니다.
        </p>
        <button type="button" className="btn btn--primary">
          파일 선택
        </button>
        <p className="dropzone__note">
          모든 처리는 브라우저 안에서만 이루어집니다.
        </p>
      </section>
    </main>
  )
}
