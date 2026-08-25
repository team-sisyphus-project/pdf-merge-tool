/**
 * Central source for feature help copy (spec: 기능별 도움말 시스템).
 *
 * This module is the single place description copy for each feature lives, so the
 * info-tooltip components and the unified help screen (built in later cards) all
 * read the same text instead of duplicating strings inline. It is deliberately
 * React-, DOM- and framework-free: it exports plain data so the copy can be unit
 * tested in plain Node and reused from any component.
 *
 * Scope of THIS card: the copy itself for the 9 identified features plus the
 * local-processing/privacy notice. The info-icon / help-screen UI, and the
 * English conversion of display strings (Spec A), are handled elsewhere.
 *
 * Tone: matches the current app's calm, polite Korean ("~합니다" / "~세요").
 * Delete copy reflects the analysed `deletePages`/`reconcilePages` behaviour —
 * a deletion cannot be undone inside the workspace, but the source file is left
 * untouched, so re-loading the same file restores the removed pages.
 */

/** One help entry: a short heading and the explanatory body shown to the user. */
export interface HelpEntry {
  /** Short label naming the feature — used as the tooltip / help-section heading. */
  title: string
  /** One- to three-sentence explanation shown in the info tooltip and help screen. */
  body: string
}

/**
 * Keys for the nine feature help entries plus the local-processing notice.
 * Named by semantic role, not by any component that renders them, so the copy
 * can be reused wherever a feature appears.
 */
export type HelpKey =
  | 'exportAll'
  | 'exportSelected'
  | 'splitByCount'
  | 'splitByRange'
  | 'dropzone'
  | 'rotate'
  | 'delete'
  | 'reorder'
  | 'thumbnailPreview'
  | 'localProcessing'

/** The nine feature keys (excludes the `localProcessing` notice). */
export const HELP_FEATURE_KEYS = [
  'exportAll',
  'exportSelected',
  'splitByCount',
  'splitByRange',
  'dropzone',
  'rotate',
  'delete',
  'reorder',
  'thumbnailPreview',
] as const satisfies readonly HelpKey[]

/** Key of the local-processing / privacy notice shown in the unified help screen. */
export const LOCAL_PROCESSING_KEY = 'localProcessing' as const satisfies HelpKey

/**
 * The description copy for every feature and the local-processing notice.
 *
 * Single source of truth: components import an entry by key rather than hardcoding
 * strings, keeping the wording consistent between per-feature tooltips and the
 * unified help screen.
 */
export const HELP_TEXT: Record<HelpKey, HelpEntry> = {
  exportAll: {
    title: '전체 내보내기',
    body: '불러온 모든 페이지를 현재 순서와 회전 그대로 하나의 PDF로 합쳐 내보냅니다. 여러 파일을 올렸다면 하나로 병합됩니다.',
  },
  exportSelected: {
    title: '선택 페이지 내보내기',
    body: '체크한 페이지만 골라 하나의 PDF로 내보냅니다. 전체 병합과 달리 선택하지 않은 페이지는 포함되지 않습니다.',
  },
  splitByCount: {
    title: 'N단위 분할',
    body: '숫자 N을 입력하면 앞에서부터 N페이지씩 잘라 여러 개의 PDF로 나눕니다. 결과가 여러 개면 ZIP으로 묶어 내려받습니다.',
  },
  splitByRange: {
    title: '범위 분할',
    body: '"1-3, 7, 10-12"처럼 페이지 번호와 범위를 쉼표로 구분해 입력하면 각 구간을 별도의 PDF로 잘라냅니다. 페이지 번호는 1부터 세며, 구간이 여러 개면 ZIP으로 묶어 내려받습니다.',
  },
  dropzone: {
    title: '파일 불러오기',
    body: 'PDF를 영역 위로 끌어다 놓거나 버튼으로 선택해 불러옵니다. 여러 파일을 한 번에 올리면 고른 순서대로 이어붙습니다. 모든 처리는 브라우저 안에서만 이뤄지며 파일은 서버로 전송되지 않습니다.',
  },
  rotate: {
    title: '페이지 회전',
    body: '버튼을 누를 때마다 페이지가 시계 방향으로 90도씩 누적해 회전합니다. 원본 파일은 바뀌지 않고 내보낼 때의 방향만 달라집니다.',
  },
  delete: {
    title: '페이지 삭제',
    body: '선택한 페이지를 작업 화면에서 제거합니다. 작업 화면에서는 되돌릴 수 없지만, 원본 파일은 그대로 남아 있어 같은 파일을 다시 불러오면 삭제한 페이지가 복원됩니다.',
  },
  reorder: {
    title: '드래그 재정렬',
    body: '썸네일을 끌어다 놓아 페이지 순서를 바꿉니다. 여기서 정한 순서가 그대로 최종 내보내기 순서가 됩니다.',
  },
  thumbnailPreview: {
    title: '썸네일 미리보기',
    body: '각 페이지를 작은 썸네일로 미리 보여 줍니다. 출처 파일마다 색 태그가 붙어 어떤 파일에서 온 페이지인지 한눈에 구분할 수 있습니다.',
  },
  localProcessing: {
    title: '로컬 전용 처리',
    body: '이 도구는 파일을 서버로 보내지 않고 브라우저 안에서만 처리합니다. 불러온 PDF는 사용자의 기기를 벗어나지 않으므로 민감한 문서도 안심하고 다룰 수 있습니다.',
  },
}
