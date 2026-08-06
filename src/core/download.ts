/**
 * Download helpers for exported PDFs (design spec S-00011 §5, "Blob 다운로드").
 *
 * Two concerns live here, kept apart so the naming logic can be unit tested
 * without a DOM:
 *
 * - {@link buildExportFilename} — a *pure* function deriving a deterministic,
 *   filesystem-safe `.pdf` name from the source file names. React- and
 *   DOM-independent, so it is covered directly by Vitest.
 * - {@link downloadPdf} — a thin DOM wrapper that packages bytes into a
 *   `Blob` and triggers an anchor download. It touches browser globals
 *   (`Blob`, `URL`, `document`) and is exercised through the UI, not unit tests.
 *
 * This module emits and packages bytes only; producing the merged PDF bytes is
 * `merge.ts`'s job (out of scope here).
 */

/** Default base name used when no usable source name is available (merge export). */
const DEFAULT_BASE = 'merged'

/** Default base name for split parts when no usable source name is available. */
const DEFAULT_SPLIT_BASE = 'split'

/**
 * File-name characters reserved on common platforms — `< > : " | ? *`. Path
 * separators (`/`, `\`) are stripped earlier while taking the leaf, so they are
 * not repeated here. Letters, digits, spaces, hyphens, dots and non-ASCII
 * (e.g. Korean) are intentionally preserved; whitespace is normalized
 * separately.
 */
const UNSAFE_CHARS = /[<>:"|?*]+/g

/**
 * Reduces one raw source name to a safe base (no directory, no `.pdf`, no
 * unsafe characters). Returns an empty string when nothing usable remains.
 */
function toSafeBase(rawName: string): string {
  // Drop any directory portion — handle both POSIX and Windows separators.
  const leaf = rawName.split(/[/\\]/).pop() ?? ''
  // Strip a single trailing `.pdf`/`.PDF` extension (case-insensitive).
  const withoutExt = leaf.replace(/\.pdf$/i, '')
  // Replace reserved runs with a single underscore, collapse whitespace, trim.
  return withoutExt
    .replace(UNSAFE_CHARS, '_')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Builds a deterministic file name for the merged export (design spec §2,
 * "전체 내보내기 = 병합").
 *
 * The name is derived purely from the ordered source file names, so the same
 * inputs always yield the same output:
 *
 * - **No usable names** (empty list, or every name blank/extension-only) →
 *   `"<fallback>.pdf"` (default `"merged.pdf"`).
 * - **One usable name** → that name with a normalized `.pdf` suffix, e.g.
 *   `"report.pdf"` or `"report"` → `"report.pdf"`.
 * - **Several usable names** → the first name plus a Korean "and N more"
 *   marker, e.g. `["a.pdf", "b.pdf", "c.pdf"]` → `"a-외2개.pdf"`.
 *
 * Directory prefixes are dropped and characters unsafe in file names are
 * replaced, so the result is always a bare, safe `.pdf` file name.
 *
 * @param sourceNames Source file names in workspace order.
 * @param options.fallback Base name (without extension) to use when no source
 *   name is usable. Defaults to `"merged"`.
 * @returns A safe file name ending in `.pdf`.
 */
export function buildExportFilename(
  sourceNames: readonly string[],
  options: { fallback?: string } = {},
): string {
  const fallbackBase = toSafeBase(options.fallback ?? DEFAULT_BASE) || DEFAULT_BASE

  const bases = sourceNames.map(toSafeBase).filter((base) => base.length > 0)

  let base: string
  if (bases.length === 0) {
    base = fallbackBase
  } else if (bases.length === 1) {
    base = bases[0]
  } else {
    base = `${bases[0]}-외${bases.length - 1}개`
  }

  return `${base}.pdf`
}

/**
 * Builds deterministic, ordered file names for a multi-part split result
 * (design spec §2, "N페이지 단위 분할 / 범위 지정 분할 → 다중 파일이면 zip").
 *
 * Each part is named `"<base>-<n>.pdf"` where `n` is its 1-based position. The
 * numeric suffix is zero-padded to the width of `count`, so parts sort
 * naturally both inside a zip and in a file manager:
 *
 * - `count` 3 → `["report-1.pdf", "report-2.pdf", "report-3.pdf"]`
 * - `count` 12 → `["report-01.pdf", …, "report-12.pdf"]`
 *
 * The base is sanitized like {@link buildExportFilename} (directory prefix
 * dropped, trailing `.pdf` removed, reserved characters replaced). When it
 * sanitizes to empty, `options.fallback` (default `"split"`) is used.
 *
 * @param baseName Raw base name to derive part names from (typically a source
 *   file name).
 * @param count Number of parts; must be a non-negative integer. `0` yields `[]`.
 * @param options.fallback Base name used when `baseName` is unusable. Defaults
 *   to `"split"`.
 * @returns One safe `.pdf` file name per part, in order.
 * @throws If `count` is not a non-negative integer.
 */
export function buildSplitFilenames(
  baseName: string,
  count: number,
  options: { fallback?: string } = {},
): string[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new Error(
      `buildSplitFilenames: count must be a non-negative integer (got ${count})`,
    )
  }
  if (count === 0) return []

  const fallbackBase =
    toSafeBase(options.fallback ?? DEFAULT_SPLIT_BASE) || DEFAULT_SPLIT_BASE
  const base = toSafeBase(baseName) || fallbackBase

  // Pad so lexical order matches numeric order (e.g. "09" before "10").
  const width = String(count).length
  return Array.from({ length: count }, (_unused, index) => {
    const suffix = String(index + 1).padStart(width, '0')
    return `${base}-${suffix}.pdf`
  })
}

/**
 * Wraps any {@link Blob} in a browser download (design spec §5, "→ Blob 다운로드").
 *
 * A temporary object URL backs an off-DOM anchor whose `download` attribute
 * carries `filename`; the anchor is clicked to start the download and the
 * object URL is revoked afterwards so the Blob can be garbage-collected. All
 * processing stays client-side — no bytes leave the browser (design spec §1).
 *
 * This is the generic primitive behind {@link downloadPdf}; use it directly for
 * non-PDF payloads such as the zip `Blob` from `zipFiles`.
 *
 * @param blob The payload to download (PDF, zip, …). Its own `type` is used.
 * @param filename The download file name.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  try {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.rel = 'noopener'
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    // The click has already captured the Blob, so it is safe to release the URL.
    URL.revokeObjectURL(url)
  }
}

/**
 * Wraps PDF bytes in a Blob and triggers a browser download (design spec §5,
 * "→ Blob 다운로드").
 *
 * Thin `application/pdf` wrapper over {@link downloadBlob}; all processing stays
 * client-side (design spec §1).
 *
 * @param bytes The serialized PDF payload (e.g. `mergePages`' output).
 * @param filename The download file name; use {@link buildExportFilename}.
 */
export function downloadPdf(bytes: Uint8Array, filename: string): void {
  // Cast around TS's ArrayBufferLike/ArrayBuffer generic mismatch: pdf-lib
  // returns `Uint8Array<ArrayBufferLike>`, which is a valid BlobPart at runtime.
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
  downloadBlob(blob, filename)
}
