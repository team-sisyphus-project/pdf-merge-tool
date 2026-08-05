/**
 * Core domain types for the PDF workspace.
 *
 * This layer is intentionally React-independent (design spec S-00011 §5):
 * pure data + pure functions so the merge/split/load logic can be unit tested
 * in isolation from the UI.
 */

/**
 * A single PDF loaded into the workspace.
 *
 * `bytes` holds the *original* file data untouched, so later operations
 * (merge/split/rotate) always re-read from the source rather than a lossy
 * intermediate. Design spec §5: `sourceFiles: {id, name, bytes, pageCount}`.
 */
export interface SourceFile {
  /** Stable identifier assigned at load time; used to link pages back to their origin. */
  id: string
  /** Original file name shown to the user and reused on export. */
  name: string
  /** Untouched original bytes of the PDF. */
  bytes: ArrayBuffer
  /** Number of pages in the document. */
  pageCount: number
}

/**
 * Why a file could not be loaded (design spec §6):
 * - `encrypted`: the PDF is password-protected and must be unlocked first.
 * - `corrupt`: the bytes are not a readable PDF (damaged or wrong format).
 */
export type LoadErrorKind = 'encrypted' | 'corrupt'

export interface LoadError {
  kind: LoadErrorKind
  /** Human-facing Korean message suitable for inline display. */
  message: string
}

/**
 * Discriminated result of attempting to load one file. A failed load never
 * throws — callers keep their existing workspace state and surface `error`
 * against the offending file only (design spec §6).
 */
export type LoadResult =
  | { ok: true; file: SourceFile }
  | { ok: false; error: LoadError }
