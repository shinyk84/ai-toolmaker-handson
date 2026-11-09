# AI 툴메이커 핸즈온 — 개발 메모

## 개요
- 비개발자 대상 '나만의 AI 도구 만들기' 4주 핸즈온 교육 웹앱. 수강생·강사 모두 한국어 UI.
- Next.js 15 App Router + Tailwind 4. 미들웨어 없음 — 인증은 각 layout/page(`requireLearner`, `requireAdmin`)와 API(`apiLearner`, `apiAdmin`)에서 확인.

## 데이터
- DB 접근은 `src/lib/db.ts`의 `query`/`one`만 사용 ($1 파라미터). `DATABASE_URL` 있으면 Neon, 없으면 PGlite(.data/).
- 스키마는 `db.ts`의 `SCHEMA` 배열(CREATE IF NOT EXISTS)로 자동 생성. 컬럼 추가 시 `ALTER TABLE … ADD COLUMN IF NOT EXISTS`를 배열 끝에 추가 — 기존 기수 데이터가 있으므로 파괴적 변경 금지.
- 수강생 워크스페이스는 `workspaces.data` JSONB 하나. 형태는 `src/lib/workspace.ts`. 필드 추가 시 `defaultWorkspace`와 `normalizeWorkspace`를 함께 수정(옛 데이터 호환).
- 파일: `BLOB_READ_WRITE_TOKEN` 있으면 Vercel Blob(브라우저 직접 업로드, 경로 `u{userId}/`), 없으면 `.data/uploads`.

## 콘텐츠
- 수업 PT 원본은 `src/content/week{1-4}.json`. 슬라이드 타입은 `src/lib/slides.ts`, 렌더러는 `components/slides/SlideView.tsx`, PPTX는 `tools/build_pptx.py` — 타입 추가 시 세 곳 모두 수정.
- AI 프롬프트는 `src/lib/prompts.ts` (서버 호출과 '프롬프트 복사' 모드가 같은 문장 사용).

## 규칙
- 배포·push는 사용자 확인 후에만.
- `npm run typecheck` 와 `npm run build` 통과 확인.
