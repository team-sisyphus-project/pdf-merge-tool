/**
 * Workspace toolbar. Hosts the export actions (design spec §4) and the live
 * selection count.
 *
 * grain-2 wires the first action — `전체 내보내기` (= 병합, design spec §2) — to
 * the merge/download pipeline supplied by {@link App} via `onExportAll`. The
 * button is enabled only while at least one page is loaded, shows an
 * in-progress label while an export is running, and surfaces an inline Korean
 * error if the merge/download fails (design spec §6, 인라인 오류 메시지). The
 * remaining two actions (선택 페이지 내보내기 / 분할) stay disabled until their
 * own grains land.
 */
import { useState } from 'react'
import type { SourceFile, WorkspacePage } from '../core/types'

/**
 * Inline copy shown when the merge/download pipeline throws. Kept generic on
 * purpose: `mergePages` only throws on corrupt workspace state (design spec §5)
 * and `downloadPdf` on a DOM failure — neither is a user-actionable detail, so
 * the message stays a calm "try again" rather than leaking internals
 * (security.md §7, error messages must not reveal system internals).
 */
const EXPORT_ERROR_MESSAGE = 'PDF를 만들지 못했어요. 잠시 후 다시 시도해 주세요.'

export interface ToolbarProps {
  /** Ordered SSoT pages to merge on 전체 내보내기 (order/rotation reflected). */
  pages: WorkspacePage[]
  /** Source files the pages reference; their names drive the export filename. */
  sourceFiles: SourceFile[]
  /**
   * Runs the actual merge + download (owned by {@link App}). Rejects if the
   * merge or download fails, which the toolbar turns into the inline error.
   */
  onExportAll: (pages: WorkspacePage[], sourceFiles: SourceFile[]) => Promise<void>
  /** Number of pages currently checked in the grid (SSoT selection size). */
  selectedCount?: number
}

export default function Toolbar({
  pages,
  sourceFiles,
  onExportAll,
  selectedCount = 0,
}: ToolbarProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasPages = pages.length > 0
  // Disabled with no pages, and re-disabled mid-export so a second click can't
  // start an overlapping merge.
  const canExportAll = hasPages && !isExporting

  const handleExportAll = async () => {
    if (!canExportAll) return
    setError(null)
    setIsExporting(true)
    try {
      await onExportAll(pages, sourceFiles)
    } catch {
      // The failure detail is not user-actionable; show the calm inline copy.
      setError(EXPORT_ERROR_MESSAGE)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="toolbar" role="toolbar" aria-label="문서 작업 도구">
      <div className="toolbar__group">
        <button
          type="button"
          className={`btn ${canExportAll ? 'btn--primary' : 'btn--disabled'}`}
          disabled={!canExportAll}
          aria-busy={isExporting}
          onClick={handleExportAll}
        >
          {isExporting ? '내보내는 중…' : '전체 내보내기'}
        </button>
        <button type="button" className="btn btn--disabled" disabled>
          선택 페이지 내보내기
        </button>
        <button type="button" className="btn btn--disabled" disabled>
          분할
        </button>
      </div>
      {selectedCount > 0 ? (
        <p className="toolbar__selection" aria-live="polite">
          선택 {selectedCount}개
        </p>
      ) : (
        <p className="toolbar__hint">
          {hasPages
            ? '전체 내보내기로 병합된 PDF를 저장할 수 있어요.'
            : 'PDF를 불러오면 도구가 활성화됩니다.'}
        </p>
      )}
      {error ? (
        <p className="toolbar__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
