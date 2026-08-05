/**
 * Toolbar placeholder for the empty workspace state.
 * All actions are disabled until PDFs are loaded (loading arrives in a later
 * grain). Labels mirror the export actions in design spec §4.
 */
const ACTIONS = ['전체 내보내기', '선택 페이지 내보내기', '분할'] as const

export default function Toolbar() {
  return (
    <div className="toolbar" role="toolbar" aria-label="문서 작업 도구">
      <div className="toolbar__group">
        {ACTIONS.map((label) => (
          <button key={label} type="button" className="btn btn--disabled" disabled>
            {label}
          </button>
        ))}
      </div>
      <p className="toolbar__hint">PDF를 불러오면 도구가 활성화됩니다.</p>
    </div>
  )
}
