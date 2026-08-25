import { useCallback, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import type { SourceFile } from '../core/types'
import type { RejectedFile } from '../state/useSourceFiles'
import InfoTooltip from './InfoTooltip'

/**
 * PDF loading surface (design spec §4). Accepts files by drag-and-drop or the
 * file picker, stays available after the first load so more files can be added
 * mid-session, lists what is loaded (name + page count), and surfaces rejected
 * files as inline messages (design spec §6).
 *
 * Presentational + interaction only — every load judgment is delegated upward
 * to the state layer (grain-1 core), keeping this component free of PDF logic.
 */
export interface DropzoneProps {
  sourceFiles: SourceFile[]
  rejected: RejectedFile[]
  isLoading: boolean
  onAddFiles: (files: File[]) => void
  onDismissRejected: () => void
}

const PAGE_LABEL = (count: number) => `${count}페이지`

export default function Dropzone({
  sourceFiles,
  rejected,
  isLoading,
  onAddFiles,
  onDismissRejected,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  // Nested dragenter/leave events fire per child; count to know when the
  // pointer has truly left the drop area.
  const dragDepth = useRef(0)

  const hasFiles = sourceFiles.length > 0

  const openPicker = useCallback(() => inputRef.current?.click(), [])

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? [])
      if (files.length > 0) onAddFiles(files)
      // Reset so selecting the same file again still fires a change event.
      event.target.value = ''
    },
    [onAddFiles],
  )

  const handleDragEnter = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    dragDepth.current += 1
    setIsDragging(true)
  }, [])

  const handleDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    // Required so the element is treated as a valid drop target.
    event.preventDefault()
  }, [])

  const handleDragLeave = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault()
      dragDepth.current = 0
      setIsDragging(false)
      const files = Array.from(event.dataTransfer.files ?? [])
      if (files.length > 0) onAddFiles(files)
    },
    [onAddFiles],
  )

  const dropClasses = [
    'dropzone',
    hasFiles ? 'dropzone--compact' : '',
    isDragging ? 'dropzone--active' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <section
        className={dropClasses}
        aria-label="PDF 불러오기 영역"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="dropzone__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 15V3" />
            <path d="m7 8 5-5 5 5" />
            <path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4" />
          </svg>
        </div>
        <h2 className="dropzone__title">
          {hasFiles ? 'PDF를 더 끌어다 놓으세요' : 'PDF를 여기에 끌어다 놓으세요'}
        </h2>
        <p className="dropzone__desc">
          또는 아래 버튼으로 파일을 선택하세요. 여러 개를 한 번에 불러올 수
          있습니다.
        </p>
        <button
          type="button"
          className="btn btn--primary"
          onClick={openPicker}
          disabled={isLoading}
        >
          {isLoading ? '불러오는 중…' : hasFiles ? '파일 추가' : '파일 선택'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="dropzone__input"
          onChange={handleInputChange}
          aria-hidden="true"
          tabIndex={-1}
        />
        <p className="dropzone__note">
          모든 처리는 브라우저 안에서만 이루어집니다.
          {/* Feature help for the whole load surface (spec §Dropzone): drag-or-
              pick, multi-file append order, local-only processing. Last sibling
              of the notice so it reads as a trailing "more info" affordance. */}
          <InfoTooltip helpKey="dropzone" />
        </p>
      </section>

      {rejected.length > 0 && (
        <div className="load-errors" role="alert">
          <div className="load-errors__head">
            <span className="load-errors__title">
              불러오지 못한 파일 {rejected.length}개
            </span>
            <button
              type="button"
              className="load-errors__dismiss"
              onClick={onDismissRejected}
            >
              닫기
            </button>
          </div>
          <ul className="load-errors__list">
            {rejected.map((file, index) => (
              <li key={`${file.name}-${index}`} className="load-errors__item">
                <span className="load-errors__name">{file.name}</span>
                <span className="load-errors__message">{file.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasFiles && (
        <section className="source-list" aria-label="불러온 파일 목록">
          <h3 className="source-list__title">
            불러온 파일 {sourceFiles.length}개
          </h3>
          <ul className="source-list__items">
            {sourceFiles.map((file) => (
              <li key={file.id} className="source-list__item">
                <span className="source-list__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                </span>
                <span className="source-list__name">{file.name}</span>
                <span className="source-list__pages">
                  {PAGE_LABEL(file.pageCount)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
