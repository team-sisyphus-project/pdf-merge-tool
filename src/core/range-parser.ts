/**
 * Parses 1-based page-range strings into 0-based page indices.
 *
 * React-independent pure logic (design spec S-00011 §5): a string such as
 * `"1-3, 7, 10-12"` becomes a sorted, de-duplicated array of 0-based page
 * indices ready for the split/extract layer. Inline error copy is centralised
 * in `src/strings.ts`. Every failure mode a user can
 * type — empty input, reversed range, out-of-range page, malformed/non-numeric
 * token — is reported as a distinct {@link RangeErrorKind} via a discriminated
 * result (same shape as {@link LoadResult} in `types.ts`), never thrown, so the
 * UI can show a single inline message and block export (design spec §6).
 *
 * Duplicates are **not** an error: overlapping pages (e.g. `"1-3, 2"`) are
 * sorted and merged. Their presence is still surfaced — non-fatally — through
 * the `notices` channel so the UI may optionally hint that pages were merged.
 */

import { strings } from '../strings'

/**
 * Why a range string could not be parsed. Each kind maps to exactly one class
 * of user mistake so the UI can react distinctly (design spec §6):
 * - `empty`: the input was blank or only whitespace.
 * - `invalid-token`: a token was not a positive integer or `a-b` range
 *   (non-numeric, zero, negative, decimal, or malformed like `1-` / `1-2-3`).
 * - `reversed-range`: a range's end page is smaller than its start (`5-3`).
 * - `out-of-range`: a page exceeds the document's `pageCount`.
 */
export type RangeErrorKind =
  | 'empty'
  | 'invalid-token'
  | 'reversed-range'
  | 'out-of-range'

/**
 * A non-fatal observation about an otherwise valid parse.
 * - `duplicate`: at least one page was listed more than once and was merged.
 */
export type RangeNoticeKind = 'duplicate'

export interface RangeError {
  kind: RangeErrorKind
  /** Human-facing English message suitable for inline display. */
  message: string
}

/**
 * Discriminated result of parsing a range string. Mirrors the `types.ts`
 * pattern: parsing never throws for bad user input — failures arrive as
 * `{ ok: false, error }` with a classified {@link RangeErrorKind}.
 *
 * On success, `indices` is sorted ascending and free of duplicates, and
 * `notices` reports non-fatal observations (currently only `'duplicate'`).
 */
export type ParseRangeResult =
  | { ok: true; indices: number[]; notices: RangeNoticeKind[] }
  | { ok: false; error: RangeError }

// --- Inline messages -------------------------------------------------------
// The English copy lives in `src/strings.ts`; these thin aliases keep the
// parsing code below readable. Tone mirrors `LoadError` in pdf-source.ts:
// a declarative statement of the problem, then how to fix it.

const { rangeError } = strings

// --- Parsing ---------------------------------------------------------------

const SINGLE = /^\d+$/
// Spaces around the `-` separator are tolerated ("1 - 3"); digits themselves
// must be contiguous so "1 2" stays malformed rather than merging into "12".
const RANGE = /^(\d+)\s*-\s*(\d+)$/

function fail(kind: RangeErrorKind, message: string): ParseRangeResult {
  return { ok: false, error: { kind, message } }
}

/**
 * Converts a 1-based page-range string into 0-based page indices.
 *
 * @param input Comma-separated ranges/pages, e.g. `"1-3, 7, 10-12"`. Whitespace
 *   around tokens and the `-` separator is tolerated (`" 1 - 3 , 7 "`).
 * @param pageCount Total pages in the document; any page above it (or a
 *   non-positive `pageCount`) yields an `out-of-range` error.
 * @returns `{ ok: true, indices, notices }` where `indices` is sorted ascending
 *   and de-duplicated (0-based); otherwise `{ ok: false, error }` with a
 *   classified {@link RangeErrorKind}. The first offending token wins, so the
 *   error kind is deterministic.
 */
export function parseRange(input: string, pageCount: number): ParseRangeResult {
  if (input.trim().length === 0) {
    return fail('empty', rangeError.empty)
  }

  // `seen` tracks 1-based pages to detect (and merge) duplicates; the sorted,
  // de-duplicated 0-based indices are derived from it at the end.
  const seen = new Set<number>()
  let duplicated = false

  const addPage = (page: number): ParseRangeResult | null => {
    if (page < 1) {
      return fail('invalid-token', rangeError.invalidToken(String(page)))
    }
    if (page > pageCount) {
      return fail('out-of-range', rangeError.outOfRange(page, pageCount))
    }
    if (seen.has(page)) duplicated = true
    seen.add(page)
    return null
  }

  for (const raw of input.split(',')) {
    const token = raw.trim()
    if (token.length === 0) {
      // A stray/empty segment ("1,,3" or a trailing comma "1,") is malformed.
      return fail('invalid-token', rangeError.invalidToken(raw))
    }

    if (SINGLE.test(token)) {
      const page = Number(token)
      const err = addPage(page)
      if (err) return err
      continue
    }

    const range = RANGE.exec(token)
    if (range) {
      const start = Number(range[1])
      const end = Number(range[2])
      if (start < 1 || end < 1) {
        return fail('invalid-token', rangeError.invalidToken(token))
      }
      if (start > end) {
        return fail('reversed-range', rangeError.reversedRange(start, end))
      }
      for (let page = start; page <= end; page++) {
        const err = addPage(page)
        if (err) return err
      }
      continue
    }

    // Non-numeric, decimal, negative, or otherwise malformed (`1-`, `1-2-3`).
    return fail('invalid-token', rangeError.invalidToken(token))
  }

  const indices = [...seen].sort((a, b) => a - b).map((page) => page - 1)
  const notices: RangeNoticeKind[] = duplicated ? ['duplicate'] : []
  return { ok: true, indices, notices }
}
