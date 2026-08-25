/**
 * Central catalogue of user-facing UI copy for the presentation layer.
 *
 * Every label, placeholder, hint, status line, and accessibility label
 * (`aria-label` / `alt`) rendered by the app's components is defined here, in
 * one place, so a developer forking this template has a single English source
 * to translate from. Values are fixed to English on purpose: this module leaves
 * room for a future locale layer but does not itself build a runtime language
 * system (only the copy is centralised, not a switching mechanism).
 *
 * Parameterised entries are small functions so call sites read naturally and
 * pluralisation/interpolation stays out of the components.
 */

/** Pluralises the English word "page" for a page count. */
const pageWord = (count: number): string => (count === 1 ? 'page' : 'pages')

/** Pluralises the English word "file" for a file count. */
const fileWord = (count: number): string => (count === 1 ? 'file' : 'files')

export const strings = {
  /** App shell header (brand title + privacy subtitle). */
  header: {
    title: 'PDF Workspace',
    subtitle: 'Processed right in your browser · files are never sent to a server',
  },

  /** Workspace toolbar: export/split actions, inputs, hints, and errors. */
  toolbar: {
    ariaLabel: 'Document actions',
    exportAll: 'Export All',
    exportSelected: 'Export Selected Pages',
    exporting: 'Exporting…',
    splitByCount: 'Split by N Pages',
    /** Stable accessible name for the count-split button (survives busy swap). */
    splitByCountAria: 'Split by N pages',
    splitByRange: 'Split by Range',
    /** Stable accessible name for the range-split button (survives busy swap). */
    splitByRangeAria: 'Split by range',
    splitting: 'Splitting…',
    countPlaceholder: 'e.g. 2',
    countAria: 'Pages per split',
    rangePlaceholder: 'e.g. 1-3, 7, 10-12',
    rangeAria: 'Split range',
    /** Calm inline copy shown when an export/split pipeline fails. */
    exportError: 'Could not create the PDF. Please try again in a moment.',
    selection: (count: number): string => `Selected ${count}`,
    hintReady: 'Export or split to save your PDF.',
    hintEmpty: 'Load a PDF to enable these tools.',
  },

  /** PDF loading surface: drop area, picker button, and the loaded-file list. */
  dropzone: {
    ariaLabel: 'PDF loading area',
    titleMore: 'Drop more PDFs here',
    titleEmpty: 'Drop your PDFs here',
    description:
      'Or choose files with the button below. You can load several at once.',
    loading: 'Loading…',
    addFiles: 'Add files',
    chooseFiles: 'Choose files',
    note: 'All processing happens entirely in your browser.',
    loadErrorsTitle: (count: number): string =>
      `${count} ${fileWord(count)} could not be loaded`,
    dismiss: 'Dismiss',
    sourceListAria: 'Loaded files',
    sourceListTitle: (count: number): string =>
      `${count} ${fileWord(count)} loaded`,
    pageCount: (count: number): string => `${count} ${pageWord(count)}`,
  },

  /** A single page thumbnail card: preview alt + accessibility labels. */
  pageCard: {
    previewAlt: (source: string, page: number): string =>
      `${source} page ${page} preview`,
    previewError: 'Preview failed to load',
    previewLoading: 'Preparing preview',
    selectPage: (source: string, page: number): string =>
      `Select ${source} page ${page}`,
    rotatePage: (source: string, page: number): string =>
      `Rotate ${source} page ${page} 90 degrees`,
    deletePage: (source: string, page: number): string =>
      `Delete ${source} page ${page}`,
  },

  /** The unified page grid: region label + page-count heading. */
  pageGrid: {
    ariaLabel: 'Page preview',
    title: (count: number): string => `${count} ${pageWord(count)}`,
  },
} as const
