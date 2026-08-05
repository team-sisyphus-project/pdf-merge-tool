/**
 * Workspace toolbar. Hosts the export actions (design spec §4) and the live
 * selection count. The export actions themselves stay disabled until their
 * behaviour lands in a later grain; grain-3 only surfaces how many pages are
 * currently checked (`선택 N개`) so the count reflects the SSoT selection set.
 */
const ACTIONS = ['전체 내보내기', '선택 페이지 내보내기', '분할'] as const

export interface ToolbarProps {
  /** Number of pages currently checked in the grid (SSoT selection size). */
  selectedCount?: number
}

export default function Toolbar({ selectedCount = 0 }: ToolbarProps) {
  return (
    <div className="toolbar" role="toolbar" aria-label="문서 작업 도구">
      <div className="toolbar__group">
        {ACTIONS.map((label) => (
          <button key={label} type="button" className="btn btn--disabled" disabled>
            {label}
          </button>
        ))}
      </div>
      {selectedCount > 0 ? (
        <p className="toolbar__selection" aria-live="polite">
          선택 {selectedCount}개
        </p>
      ) : (
        <p className="toolbar__hint">PDF를 불러오면 도구가 활성화됩니다.</p>
      )}
    </div>
  )
}
