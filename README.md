# s00011-pdftool — PDF 워크스페이스

결재·제출용 PDF를 합치고 쪼개는 반복 작업을 브라우저에서 해결하는 정적 웹앱입니다.
모든 처리는 **100% 클라이언트(브라우저)** 에서 수행되며, **파일은 어떤 서버로도
전송되지 않습니다.** UI 언어는 한국어입니다.

- 관리코드: S-00011 (문서·서식 유틸)
- 작업명: `s00011-pdftool` (브랜드명 확정 전까지 유지)
- 참고 서비스: iLovePDF (단, 도구별 페이지가 아닌 통합 워크스페이스 방식)

## 기술 스택

| 역할 | 선택 | 비고 |
|---|---|---|
| 빌드/프레임워크 | Vite + React + TypeScript | 정적 빌드 산출물만 배포 |
| PDF 조작 | pdf-lib | 병합/분할·회전 (예정) |
| 썸네일 렌더링 | pdfjs-dist | Web Worker 렌더 (예정) |
| 드래그 정렬 | dnd-kit | 페이지 카드 정렬 (예정) |
| zip 묶기 | client-zip | 분할 다중 파일용 (예정) |
| 테스트 | Vitest | 코어 로직 유닛 테스트 (예정) |

서버 컴포넌트가 없습니다. 정적 호스팅(로컬 프리뷰 또는 임의의 정적 호스트)만으로
동작하며, 빌드 산출물은 Vite 기본 경로인 `dist/`에 생성됩니다.

## 현재 상태

빈 워크스페이스 화면(앱 셸 + 드롭존 빈 상태)까지 구현되어 있습니다. 아래 MVP
기능은 설계가 확정된 후속 작업 범위입니다.

## MVP 범위

- **병합**: 여러 PDF를 로드해 현재 페이지 순서·회전 그대로 1개 PDF로 내보내기
- **분할/추출**: 선택 페이지 추출, N페이지 단위 분할, 범위 지정 분할(`1-3, 7, 10-12`),
  다중 결과는 zip 다운로드
- **페이지 편집**: 썸네일 그리드에서 드래그 정렬, 90° 회전, 삭제, 체크 선택

압축, 이미지↔PDF 변환, 서식 워크플로우 프리셋, PWA/오프라인은 2차 이후 범위입니다.

## 생성 파일명 규칙 (Generated file names)

내보내기·분할 시 생성되는 파일명은 순수 함수(`core/download.ts`)가 소스 파일명에서
결정합니다. 사용자가 다운로드 결과에서 직접 관찰하는 문자열이므로 규칙을 아래에
고지합니다. 모든 표기는 영어이며(템플릿 영어 통일), 정확한 값은 `src/strings.ts`의
`filenames` 그룹에서 한곳에서 관리합니다.

- **병합 / 전체 내보내기**
  - 소스 1개: 그 이름을 정규화한 `.pdf` (예: `report.pdf`).
  - 소스 여러 개: 첫 이름 뒤에 `+N more` 마커를 붙입니다. 여기서 `N`은 첫 번째를
    제외한 나머지 소스 개수입니다. 구성/구분자/순서는 `"{첫이름}-{마커}"`로 유지됩니다.
    - 예: `["a.pdf", "b.pdf", "c.pdf"]` → `a-+2 more.pdf`.
  - 사용 가능한 이름이 없으면 fallback `merged.pdf`.
- **선택 페이지 내보내기**: 병합과 동일한 규칙을 따르되, 사용 가능한 소스 이름이
  없을 때의 fallback은 `selected-pages.pdf` 입니다.
- **분할(N단위 / 범위)**: `"{base}-{n}.pdf"` 형식이며 `n`은 1부터 시작하는 파트
  번호로, 전체 개수 자리수에 맞춰 0으로 패딩됩니다(예: `report-01.pdf` …
  `report-12.pdf`). 사용 가능한 base가 없으면 fallback `split`.

> 규칙 변경 이력: 병합 마커는 과거 한국어 `-외N개` 표기였으며, 영어 템플릿 전환에
> 맞춰 `+N more`로 바뀌었습니다(구분자·순서는 동일). fallback `선택페이지`도
> `selected-pages`로 바뀌었습니다. 향후 마커를 바꿀 때도 `src/strings.ts`의
> `filenames`만 수정하면 됩니다.

## 로컬 실행 (green-field)

데이터베이스·시드·마이그레이션이 없습니다 — 순수 정적 프런트엔드입니다.
아무것도 설정되지 않은 상태에서 아래 절차만으로 빈 워크스페이스가 구동됩니다.

```bash
npm install      # 의존성 설치
npm run dev      # 개발 서버 (Vite, 기본 http://localhost:5173)
```

개발 서버가 뜨면 브라우저에서 안내된 주소로 접속해 빈 워크스페이스 화면을 확인합니다.

## 프로덕션 빌드 / 미리보기

```bash
npm run build    # 타입체크(tsc -b) + 정적 빌드 → dist/
npm run preview  # 빌드 산출물 로컬 미리보기
```

`npm run build`는 `dist/`에 정적 산출물을 만들고, `npm run preview`는 이를 로컬에서
서빙합니다. 프리뷰 런타임은 `dist/`를 자동으로 감지해 서빙합니다.

## Download file-name rules

Generated download names are derived deterministically from the source files
(`src/core/download.ts`). All user-observable markers are English (centralised in
`src/strings.ts`):

- **Merge export (Export All)** — named after the ordered source files:
  - one source → that file's name, e.g. `report.pdf`;
  - several sources → the first name plus an `and-N-more` suffix, where `N`
    counts the remaining sources, e.g. `["a.pdf","b.pdf","c.pdf"]` →
    `a-and-2-more.pdf`;
  - no usable source name → the `merged.pdf` fallback.
- **Export Selected Pages** — named after the source(s) the selection draws
  from; when none is usable it falls back to `selected-pages.pdf`.
- **Split parts** — `<base>-<n>.pdf` with the index zero-padded to the part
  count (e.g. `report-01.pdf … report-12.pdf`); unusable base → `split-*.pdf`.

Names are stripped of directory prefixes and characters reserved on common
platforms (`< > : " | ? *`).
