import { describe, it, expect } from 'vitest'
import { buildExportFilename } from './download'

describe('buildExportFilename — default fallback', () => {
  it('uses the default merged name for an empty list', () => {
    expect(buildExportFilename([])).toBe('merged.pdf')
  })

  it('falls back when every name is blank', () => {
    expect(buildExportFilename(['', '   ', '\t'])).toBe('merged.pdf')
  })

  it('falls back when a name is only an extension', () => {
    expect(buildExportFilename(['.pdf'])).toBe('merged.pdf')
  })

  it('honors a custom fallback base', () => {
    expect(buildExportFilename([], { fallback: 'export' })).toBe('export.pdf')
  })

  it('reverts to the default when the custom fallback sanitizes to empty', () => {
    expect(buildExportFilename([], { fallback: '   ' })).toBe('merged.pdf')
  })
})

describe('buildExportFilename — single source', () => {
  it('keeps a plain .pdf name unchanged', () => {
    expect(buildExportFilename(['report.pdf'])).toBe('report.pdf')
  })

  it('normalizes an uppercase extension to lowercase .pdf', () => {
    expect(buildExportFilename(['report.PDF'])).toBe('report.pdf')
  })

  it('appends .pdf when the source has no extension', () => {
    expect(buildExportFilename(['report'])).toBe('report.pdf')
  })

  it('strips only the trailing .pdf, leaving inner dots intact', () => {
    expect(buildExportFilename(['2026.q3.report.pdf'])).toBe('2026.q3.report.pdf')
  })

  it('preserves spaces and hyphens in the base name', () => {
    expect(buildExportFilename(['my - report.pdf'])).toBe('my - report.pdf')
  })
})

describe('buildExportFilename — multiple sources', () => {
  it('marks two sources with 외1개 after the first name', () => {
    expect(buildExportFilename(['a.pdf', 'b.pdf'])).toBe('a-외1개.pdf')
  })

  it('counts all but the first for the 외N개 marker', () => {
    expect(buildExportFilename(['a.pdf', 'b.pdf', 'c.pdf'])).toBe('a-외2개.pdf')
  })

  it('ignores blank entries when counting usable sources', () => {
    // Two usable names (a, b) despite the blank → single "외1개" marker.
    expect(buildExportFilename(['a.pdf', '', 'b.pdf'])).toBe('a-외1개.pdf')
  })

  it('degrades to a single name when only one entry is usable', () => {
    expect(buildExportFilename(['', 'only.pdf', '   '])).toBe('only.pdf')
  })
})

describe('buildExportFilename — path and unsafe-character handling', () => {
  it('drops a POSIX directory prefix', () => {
    expect(buildExportFilename(['docs/sub/report.pdf'])).toBe('report.pdf')
  })

  it('drops a Windows directory prefix', () => {
    expect(buildExportFilename(['C:\\docs\\report.pdf'])).toBe('report.pdf')
  })

  it('replaces reserved characters with an underscore', () => {
    expect(buildExportFilename(['a<b>c:d.pdf'])).toBe('a_b_c_d.pdf')
  })
})

describe('buildExportFilename — determinism', () => {
  it('returns the same name for the same inputs', () => {
    const input = ['first.pdf', 'second.pdf', 'third.pdf']
    expect(buildExportFilename(input)).toBe(buildExportFilename(input))
  })

  it('always ends in .pdf', () => {
    for (const names of [[], ['x'], ['x.pdf', 'y.pdf'], ['.pdf']]) {
      expect(buildExportFilename(names).endsWith('.pdf')).toBe(true)
    }
  })
})
