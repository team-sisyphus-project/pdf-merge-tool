// @vitest-environment jsdom
/**
 * Smoke tests for {@link Dropzone}'s load-error surface.
 *
 * Covers the component's contract, not its internals: rejected files render as
 * inline messages while already-loaded files stay visible (existing state is
 * preserved), and the dismiss control notifies upward. Rendering runs in jsdom
 * via testing-library (opted in per-file so the React-free core suite keeps its
 * fast `node` environment).
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import Dropzone from './Dropzone'
import type { SourceFile } from '../core/types'
import type { RejectedFile } from '../state/useSourceFiles'

afterEach(cleanup)

const LOADED: SourceFile[] = [
  { id: 'src-1', name: 'good.pdf', bytes: new ArrayBuffer(0), pageCount: 3 },
]

const REJECTED: RejectedFile[] = [
  {
    name: 'locked.pdf',
    kind: 'encrypted',
    message: '암호로 보호된 PDF입니다. 암호 해제 후 다시 시도해 주세요.',
  },
  {
    name: 'broken.pdf',
    kind: 'corrupt',
    message: '파일이 손상되었거나 올바른 PDF 형식이 아닙니다.',
  },
]

function renderDropzone(overrides: Partial<React.ComponentProps<typeof Dropzone>> = {}) {
  const props = {
    sourceFiles: [] as SourceFile[],
    rejected: [] as RejectedFile[],
    isLoading: false,
    onAddFiles: vi.fn(),
    onDismissRejected: vi.fn(),
    ...overrides,
  }
  render(<Dropzone {...props} />)
  return props
}

describe('Dropzone load errors', () => {
  it('lists each rejected file with its name and guidance message', () => {
    renderDropzone({ rejected: REJECTED })

    expect(screen.getByText('locked.pdf')).toBeDefined()
    expect(
      screen.getByText((t) => t.includes('암호 해제 후 다시 시도해 주세요')),
    ).toBeDefined()
    expect(screen.getByText('broken.pdf')).toBeDefined()
    expect(
      screen.getByText((t) => t.includes('손상되었거나')),
    ).toBeDefined()
  })

  it('shows rejected files inline while keeping loaded files visible', () => {
    renderDropzone({ sourceFiles: LOADED, rejected: REJECTED })

    // Existing workspace state is preserved alongside the error banner.
    expect(screen.getByText('good.pdf')).toBeDefined()
    expect(screen.getByText('locked.pdf')).toBeDefined()
  })

  it('renders no error banner when there are no rejections', () => {
    renderDropzone({ sourceFiles: LOADED, rejected: [] })

    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('calls onDismissRejected when the dismiss control is clicked', () => {
    const { onDismissRejected } = renderDropzone({ rejected: REJECTED })

    fireEvent.click(screen.getByText('Dismiss'))

    expect(onDismissRejected).toHaveBeenCalledTimes(1)
  })
})
