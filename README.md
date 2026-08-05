# s00011-pdftool — PDF 워크스페이스

브라우저에서 PDF를 합치고 나누는 정적 웹앱입니다. 모든 처리는 클라이언트에서
수행되며 파일은 서버로 전송되지 않습니다. UI 언어는 한국어입니다.

- 스택: Vite + React + TypeScript (정적 빌드, 서버 없음)
- 빌드 산출물: `dist/` (정적 호스팅으로 서빙)

## 로컬 실행 (green-field)

데이터베이스·시드·마이그레이션 없음 — 순수 정적 프런트엔드입니다.

```bash
npm install      # 의존성 설치
npm run dev      # 개발 서버 (Vite, http://localhost:5173)
```

## 프로덕션 빌드 / 미리보기

```bash
npm run build    # 타입체크 + 정적 빌드 → dist/
npm run preview  # 빌드 산출물 로컬 미리보기
```

빌드 산출물은 Vite 기본 경로인 `dist/`에 생성되며, 프리뷰 런타임이 이를 자동으로
감지해 서빙합니다.
