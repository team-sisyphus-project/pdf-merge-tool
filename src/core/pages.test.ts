import { describe, it, expect } from 'vitest'
import {
  DEFAULT_PAGE_ROTATION,
  deriveWorkspacePages,
  workspacePageId,
} from './pages'
import type { SourceFile } from './types'

/**
 * A `SourceFile` with a real (but empty) ArrayBuffer. The pages builder never
 * inspects the bytes, so their content is irrelevant to these tests.
 */
function makeSource(id: string, pageCount: number, name = `${id}.pdf`): SourceFile {
  return { id, name, bytes: new ArrayBuffer(0), pageCount }
}

describe('workspacePageId', () => {
  it('builds a stable, delimited id from source id and page index', () => {
    expect(workspacePageId('src-a', 0)).toBe('src-a:0')
    expect(workspacePageId('src-a', 12)).toBe('src-a:12')
  })

  it('is deterministic for the same inputs', () => {
    expect(workspacePageId('src-b', 3)).toBe(workspacePageId('src-b', 3))
  })
})

describe('deriveWorkspacePages', () => {
  it('returns no pages for an empty workspace', () => {
    expect(deriveWorkspacePages([])).toEqual([])
  })

  it('emits one page per page of a single file, in ascending page order', () => {
    const pages = deriveWorkspacePages([makeSource('src-a', 3)])

    expect(pages).toHaveLength(3)
    expect(pages.map((p) => p.pageIndex)).toEqual([0, 1, 2])
    expect(pages.every((p) => p.sourceFileId === 'src-a')).toBe(true)
  })

  it('flattens multiple files file-by-file, preserving load order', () => {
    const pages = deriveWorkspacePages([
      makeSource('src-a', 2),
      makeSource('src-b', 1),
      makeSource('src-c', 2),
    ])

    expect(pages.map((p) => [p.sourceFileId, p.pageIndex])).toEqual([
      ['src-a', 0],
      ['src-a', 1],
      ['src-b', 0],
      ['src-c', 0],
      ['src-c', 1],
    ])
  })

  it('gives every derived page a stable, unique id', () => {
    const pages = deriveWorkspacePages([
      makeSource('src-a', 2),
      makeSource('src-b', 2),
    ])
    const ids = pages.map((p) => p.id)

    expect(ids).toEqual(['src-a:0', 'src-a:1', 'src-b:0', 'src-b:1'])
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('starts every page at the default rotation', () => {
    const pages = deriveWorkspacePages([makeSource('src-a', 2)])
    expect(pages.every((p) => p.rotation === DEFAULT_PAGE_ROTATION)).toBe(true)
    expect(DEFAULT_PAGE_ROTATION).toBe(0)
  })

  it('contributes nothing for a zero-page file but keeps the rest', () => {
    const pages = deriveWorkspacePages([
      makeSource('src-a', 0),
      makeSource('src-b', 2),
    ])
    expect(pages.map((p) => p.sourceFileId)).toEqual(['src-b', 'src-b'])
  })

  it('does not mutate the source files it reads', () => {
    const source = makeSource('src-a', 1)
    const before = { ...source }
    deriveWorkspacePages([source])
    expect(source).toEqual(before)
  })

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'throws RangeError on an invalid pageCount (%s)',
    (bad) => {
      expect(() => deriveWorkspacePages([makeSource('src-a', bad)])).toThrow(
        RangeError,
      )
    },
  )
})
