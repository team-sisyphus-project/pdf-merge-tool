// @vitest-environment jsdom
/**
 * Smoke tests for the toolbar's 선택 페이지 내보내기 (extract) wiring (grain-1).
 *
 * These cover the toolbar's *contract*, not its internals: the button is
 * disabled with no selection, enabled with one, and on click hands the checked
 * pages plus source files to the App-owned `onExportSelected`. Rendering runs in
 * jsdom via testing-library (opted in per-file above so the React-free core
 * suite keeps its fast `node` environment).
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import Toolbar from './Toolbar'
import type { SourceFile, WorkspacePage } from '../core/types'

afterEach(cleanup)

const SOURCE_FILES: SourceFile[] = [
  { id: 'src-1', name: 'report.pdf', bytes: new ArrayBuffer(0), pageCount: 2 },
]

const page = (id: string): WorkspacePage => ({
  id,
  sourceFileId: 'src-1',
  pageIndex: 0,
  rotation: 0,
})

/** Renders the toolbar with sensible defaults; overrides win. */
function renderToolbar(overrides: Partial<React.ComponentProps<typeof Toolbar>> = {}) {
  const props = {
    pages: [page('p-1'), page('p-2')],
    selectedPages: [] as WorkspacePage[],
    sourceFiles: SOURCE_FILES,
    onExportAll: vi.fn().mockResolvedValue(undefined),
    onExportSelected: vi.fn().mockResolvedValue(undefined),
    selectedCount: 0,
    ...overrides,
  }
  render(<Toolbar {...props} />)
  return props
}

const selectedExportButton = () =>
  screen.getByRole('button', { name: '선택 페이지 내보내기' }) as HTMLButtonElement

describe('Toolbar — 선택 페이지 내보내기', () => {
  it('is disabled when no pages are selected', () => {
    renderToolbar({ selectedPages: [], selectedCount: 0 })
    expect(selectedExportButton().disabled).toBe(true)
  })

  it('is enabled once at least one page is selected', () => {
    renderToolbar({ selectedPages: [page('p-2')], selectedCount: 1 })
    expect(selectedExportButton().disabled).toBe(false)
  })

  it('hands the checked pages and source files to onExportSelected on click', () => {
    const selectedPages = [page('p-2')]
    const { onExportSelected } = renderToolbar({ selectedPages, selectedCount: 1 })

    fireEvent.click(selectedExportButton())

    expect(onExportSelected).toHaveBeenCalledTimes(1)
    expect(onExportSelected).toHaveBeenCalledWith(selectedPages, SOURCE_FILES)
  })

  it('does not invoke onExportSelected when disabled (no selection)', () => {
    const { onExportSelected } = renderToolbar({ selectedPages: [], selectedCount: 0 })

    fireEvent.click(selectedExportButton())

    expect(onExportSelected).not.toHaveBeenCalled()
  })
})
