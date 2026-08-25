/**
 * Workspace toolbar. Hosts the export/split actions (design spec §4) and the
 * live selection count.
 *
 * Actions and the grain that wired each:
 * - `전체 내보내기` (= 병합, design spec §2) — {@link onExportAll}.
 * - `선택 페이지 내보내기` (= 추출, design spec §2) — {@link onExportSelected}.
 * - `N페이지 단위 분할` / `범위 지정 분할` (design spec §2, this grain) — an
 *   input + run button each, calling {@link onSplitByCount} / {@link
 *   onSplitByRanges}. The actual split/zip/download is owned by {@link App}; the
 *   toolbar owns only the "when" (input state, validation, busy, inline error).
 *
 * Every action shares one pattern: the run button is enabled only when its
 * inputs are valid and no action is already running, shows an in-progress label
 * while its action runs, and surfaces a calm inline Korean error if the pipeline
 * fails (design spec §6, 인라인 오류 메시지). A single in-flight guard
 * ({@link exporting}) blocks starting a second action mid-run. The range field
 * additionally validates its string with {@link parseRange} and shows the
 * classified inline message *before* running, blocking the run (design spec §6).
 */
import { useState } from 'react'
import type { SourceFile, WorkspacePage } from '../core/types'
import { parseRange } from '../core/range-parser'
import InfoTooltip from './InfoTooltip'

/**
 * Inline copy shown when a merge/split/download pipeline throws. Kept generic on
 * purpose: the core layers only throw on corrupt workspace state (design spec
 * §5) and `download*` on a DOM failure — neither is a user-actionable detail, so
 * the message stays a calm "try again" rather than leaking internals
 * (security.md §7, error messages must not reveal system internals).
 */
const EXPORT_ERROR_MESSAGE = 'PDF를 만들지 못했어요. 잠시 후 다시 시도해 주세요.'

/** Which action is currently running (`null` = idle). Used as the in-flight guard. */
type ActionKind = 'all' | 'selected' | 'count' | 'ranges'

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
  /**
   * Splits every `count` pages into their own PDF, bundling multiple results as
   * a zip (owned by {@link App}). Optional so the toolbar renders (with the
   * control disabled) until the App wires the pipeline in a later grain.
   */
  onSplitByCount?: (
    count: number,
    pages: WorkspacePage[],
    sourceFiles: SourceFile[],
  ) => Promise<void>
  /**
   * Splits by a 1-based range string (e.g. `"1-3, 7, 10-12"`) into one PDF per
   * comma group, bundling multiple results as a zip (owned by {@link App}). The
   * toolbar validates the string with {@link parseRange} first and only calls
   * this with a string that parsed cleanly. Optional for the same reason as
   * {@link onSplitByCount}.
   */
  onSplitByRanges?: (
    rangeInput: string,
    pages: WorkspacePage[],
    sourceFiles: SourceFile[],
  ) => Promise<void>
  /** Number of pages currently checked in the grid (SSoT selection size). */
  selectedCount?: number
}

/** A positive-integer string ("1", "12"); rejects "", "0", "1.5", "-2", "2a". */
const POSITIVE_INT = /^\d+$/

export default function Toolbar({
  pages,
  selectedPages,
  sourceFiles,
  onExportAll,
  onExportSelected,
  onSplitByCount,
  onSplitByRanges,
  selectedCount = 0,
}: ToolbarProps) {
  const [exporting, setExporting] = useState<ActionKind | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [countInput, setCountInput] = useState('')
  const [rangeInput, setRangeInput] = useState('')

  const hasPages = pages.length > 0
  const hasSelection = selectedPages.length > 0
  const isBusy = exporting !== null

  // ── N페이지 단위 분할: a positive integer chunk size. ──────────────────────
  const countText = countInput.trim()
  const countValue = Number(countText)
  const countValid = POSITIVE_INT.test(countText) && countValue >= 1

  // ── 범위 지정 분할: validate the string up front (design spec §6). Skip while
  // empty or before any pages load — an out-of-range message against a 0-page
  // document would just be noise. The classified message shows inline and blocks
  // the run; a clean parse enables it.
  const rangeParse =
    hasPages && rangeInput.trim().length > 0
      ? parseRange(rangeInput, pages.length)
      : null
  const rangeError = rangeParse && !rangeParse.ok ? rangeParse.error.message : null

  // Each action needs its own valid inputs, its App-owned handler, and no other
  // action already running — a second click can't start an overlapping run.
  const canExportAll = hasPages && !isBusy
  const canExportSelected = hasSelection && !isBusy
  const canSplitCount = hasPages && countValid && !isBusy && !!onSplitByCount
  const canSplitRanges =
    hasPages && rangeParse?.ok === true && !isBusy && !!onSplitByRanges

  // Shared run wrapper for every action (design spec §6 inline-error pattern):
  // clear the prior error, mark this action busy, run it, and on failure show
  // the calm inline copy — the detail is not user-actionable.
  const runAction = async (
    kind: ActionKind,
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
    void runAction('all', () => onExportAll(pages, sourceFiles))
  }

  const handleExportSelected = () => {
    if (!canExportSelected) return
    void runAction('selected', () => onExportSelected(selectedPages, sourceFiles))
  }

  const handleSplitCount = () => {
    if (!canSplitCount || !onSplitByCount) return
    void runAction('count', () => onSplitByCount(countValue, pages, sourceFiles))
  }

  const handleSplitRanges = () => {
    if (!canSplitRanges || !onSplitByRanges) return
    void runAction('ranges', () => onSplitByRanges(rangeInput, pages, sourceFiles))
  }

  const inputsDisabled = !hasPages || isBusy

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
        {/* Explains the 전체(병합) vs 선택(추출) difference for this action group. */}
        <InfoTooltip helpKey="exportAll" />
      </div>

      <div className="toolbar__group toolbar__group--split">
        <div className="split-control">
          <input
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            className="field-input field-input--count"
            value={countInput}
            onChange={(event) => setCountInput(event.target.value)}
            placeholder="예: 2"
            aria-label="분할할 페이지 수"
            disabled={inputsDisabled}
          />
          <button
            type="button"
            className={`btn ${canSplitCount ? 'btn--primary' : 'btn--disabled'}`}
            disabled={!canSplitCount}
            aria-busy={exporting === 'count'}
            aria-label="N페이지 단위 분할"
            onClick={handleSplitCount}
          >
            {exporting === 'count' ? '분할 중…' : 'N단위 분할'}
          </button>
          {/* Explains the N-page chunk-split behaviour. */}
          <InfoTooltip helpKey="splitByCount" />
        </div>

        <div className="split-control">
          <input
            type="text"
            className={`field-input field-input--range${
              rangeError ? ' field-input--invalid' : ''
            }`}
            value={rangeInput}
            onChange={(event) => setRangeInput(event.target.value)}
            placeholder="예: 1-3, 7, 10-12"
            aria-label="분할 범위"
            aria-invalid={rangeError ? true : undefined}
            disabled={inputsDisabled}
          />
          <button
            type="button"
            className={`btn ${canSplitRanges ? 'btn--primary' : 'btn--disabled'}`}
            disabled={!canSplitRanges}
            aria-busy={exporting === 'ranges'}
            aria-label="범위 지정 분할"
            onClick={handleSplitRanges}
          >
            {exporting === 'ranges' ? '분할 중…' : '범위 분할'}
          </button>
          {/* Explains the "1-3, 7, 10-12" range notation and input format. */}
          <InfoTooltip helpKey="splitByRange" />
        </div>
      </div>

      {rangeError ? (
        <p className="toolbar__error" role="alert">
          {rangeError}
        </p>
      ) : null}

      {selectedCount > 0 ? (
        <p className="toolbar__selection" aria-live="polite">
          선택 {selectedCount}개
        </p>
      ) : (
        <p className="toolbar__hint">
          {hasPages
            ? '전체 내보내기·분할로 PDF를 저장할 수 있어요.'
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
