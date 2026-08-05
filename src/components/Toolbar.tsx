/**
 * Workspace toolbar. Hosts the export actions (design spec §4) and the live
 * selection count.
 *
 * grain-2 wired `전체 내보내기` (= 병합, design spec §2); grain-1 (this) wires
 * `선택 페이지 내보내기` (= 추출, design spec §2) to the extract/download
 * pipeline supplied by {@link App} via `onExportSelected`. Both share one
 * pattern: the button is enabled only when its inputs are non-empty and no
 * export is already running, shows an in-progress label while its export runs,
 * and surfaces an inline Korean error if the pipeline fails (design spec §6,
 * 인라인 오류 메시지). A single in-flight guard blocks starting a second export
 * mid-run. The last action (분할) stays disabled until its own grain lands.
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

/** Which export is currently running (`null` = idle). Used as the in-flight guard. */
type ExportKind = 'all' | 'selected'

export interface ToolbarProps {
  /** Ordered SSoT pages to merge on 전체 내보내기 (order/rotation reflected). */
  pages: WorkspacePage[]
  /**
   * The checked pages in workspace order — the exact subset 선택 페이지 내보내기
   * extracts. Empty when nothing is checked, which disables that action.
   */
  selectedPages: WorkspacePage[]
  /** Source files the pages reference; their names drive the export filename. */
  sourceFiles: SourceFile[]
  /**
   * Runs the actual merge + download (owned by {@link App}). Rejects if the
   * merge or download fails, which the toolbar turns into the inline error.
   */
  onExportAll: (pages: WorkspacePage[], sourceFiles: SourceFile[]) => Promise<void>
  /**
   * Runs the actual extract + download of the checked pages (owned by
   * {@link App}). Rejects on failure, surfaced as the same inline error.
   */
  onExportSelected: (
    pages: WorkspacePage[],
    sourceFiles: SourceFile[],
  ) => Promise<void>
  /** Number of pages currently checked in the grid (SSoT selection size). */
  selectedCount?: number
}

export default function Toolbar({
  pages,
  selectedPages,
  sourceFiles,
  onExportAll,
  onExportSelected,
  selectedCount = 0,
}: ToolbarProps) {
  const [exporting, setExporting] = useState<ExportKind | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hasPages = pages.length > 0
  const hasSelection = selectedPages.length > 0
  const isBusy = exporting !== null
  // Each action needs its own inputs, and both re-disable during any export so
  // a second click can't start an overlapping run.
  const canExportAll = hasPages && !isBusy
  const canExportSelected = hasSelection && !isBusy

  // Shared run wrapper for both actions (design spec §6 inline-error pattern):
  // clear the prior error, mark this action busy, run it, and on failure show
  // the calm inline copy — the detail is not user-actionable.
  const runExport = async (
    kind: ExportKind,
    action: () => Promise<void>,
  ): Promise<void> => {
    setError(null)
    setExporting(kind)
    try {
      await action()
    } catch {
      setError(EXPORT_ERROR_MESSAGE)
    } finally {
      setExporting(null)
    }
  }

  const handleExportAll = () => {
    if (!canExportAll) return
    void runExport('all', () => onExportAll(pages, sourceFiles))
  }

  const handleExportSelected = () => {
    if (!canExportSelected) return
    void runExport('selected', () => onExportSelected(selectedPages, sourceFiles))
  }

  return (
    <div className="toolbar" role="toolbar" aria-label="문서 작업 도구">
      <div className="toolbar__group">
        <button
          type="button"
          className={`btn ${canExportAll ? 'btn--primary' : 'btn--disabled'}`}
          disabled={!canExportAll}
          aria-busy={exporting === 'all'}
          onClick={handleExportAll}
        >
          {exporting === 'all' ? '내보내는 중…' : '전체 내보내기'}
        </button>
        <button
          type="button"
          className={`btn ${canExportSelected ? 'btn--primary' : 'btn--disabled'}`}
          disabled={!canExportSelected}
          aria-busy={exporting === 'selected'}
          onClick={handleExportSelected}
        >
          {exporting === 'selected' ? '내보내는 중…' : '선택 페이지 내보내기'}
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
