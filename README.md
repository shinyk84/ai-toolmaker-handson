# AI 툴메이커 핸즈온

생성형 AI로 **나만의 업무·학업·사업 자동화 도구**를 만드는 4주 핸즈온 교육용 웹앱입니다.

- **수업 PT** — 1~4주차 슬라이드(웹 발표 모드 + PowerPoint 파일 생성)
- **워크스페이스 6단계** — 아이디어(As-is/To-be) → 워크플로우 → 우선순위·MVP → AI 명령서 → 제작 기록 → 발표 PT
- **기수별 로그인** — 기수 입장 코드 + 개인 아이디/비밀번호
- **자료실** — 이미지·동영상·PDF 업로드(최대 200MB)
- **진도공유 + 강사 피드백**, **발표 갤러리**
- **관리자 대시보드** — 모든 기수 누적 관리, 단계별 완료율, CSV 내보내기

---

## 1. 로컬에서 실행

```bash
npm install
npm run dev        # http://localhost:3000
```

환경변수 없이도 바로 동작합니다.

| 항목 | 로컬 기본값 |
|---|---|
| DB | 내장 Postgres(PGlite) → `.data/pglite` 폴더 |
| 파일 | `.data/uploads` 폴더 |
| 관리자 로그인 | 기수 `강사(관리자)` / 아이디 `admin` / 비밀번호 `admin1234` |
| AI 버튼 | API 키가 없으면 '프롬프트 복사' 모드 |

처음 로그인 → **새 기수 만들기** → 입장 코드를 수강생에게 안내 → 수강생은 로그인 화면의 **처음이에요(가입)** 로 계정을 만듭니다.

## 2. GitHub + Vercel 배포

1. **GitHub 업로드**: 새 레포지토리(Private 권장)를 만들고 이 폴더를 푸시합니다.
2. **Vercel 프로젝트 생성**: vercel.com → Add New → Project → 레포 Import (설정은 기본값 그대로).
3. **저장소 연결** (Vercel 프로젝트 → Storage 탭):
   - **Neon (Postgres)** 생성 후 Connect → `DATABASE_URL` 이 자동으로 들어갑니다.
   - **Blob** 생성 후 Connect → `BLOB_READ_WRITE_TOKEN` 이 자동으로 들어갑니다. (접근 방식: Public)
4. **환경변수 추가** (Settings → Environment Variables):

   | 이름 | 값 |
   |---|---|
   | `SESSION_SECRET` | 32자 이상 랜덤 문자열 (예: `openssl rand -base64 32`) |
   | `ADMIN_PASSWORD` | 강사 로그인 비밀번호 |
   | `ANTHROPIC_API_KEY` | (선택) AI 평가·초안 버튼을 직접 동작시키려면 |
   | `AI_MODEL` | (선택) 기본 `claude-opus-5-5` |

5. **Redeploy** → 배포 주소에서 강사 계정으로 로그인해 기수를 만듭니다.

테이블은 첫 접속 때 자동으로 만들어집니다(별도 SQL 실행 불필요).

### 데이터 보존
- 기수를 **종료(보관)** 해도 데이터는 삭제되지 않습니다. 종료된 기수는 신규 가입만 막히고, 수강생은 계속 로그인해 자기 기록을 볼 수 있습니다.
- 관리자 → 기수 → **엑셀(CSV) 내보내기** 로 아이디어·워크플로우·명령서·성과·주차별 진도/피드백을 한 파일로 받을 수 있습니다. 기수 종료 시 백업용으로 받아두기를 권장합니다.
- 무료 플랜 용량: Neon 0.5GB, Vercel Blob 1GB(Hobby). 동영상이 많아지면 Blob 용량을 확인하세요.

## 3. 수업 PT

- 웹: `/class` → 주차 선택 → 전체화면 발표 (← → 이동, F 전체화면, G 목록, N 강사 노트 — 강사 로그인 시)
- PowerPoint 파일:
  ```bash
  pip install python-pptx
  npm run deck:pptx          # dist/1주차_….pptx ~ 4주차_….pptx
  ```
- 내용 수정: `src/content/week1.json` ~ `week4.json` 만 고치면 웹과 PPT에 모두 반영됩니다.
  슬라이드 형식은 `src/lib/slides.ts` 참고 (cover, section, bullets, cols, steps, prompt, table, checklist, grid, agenda, metric, flow, quote).

## 4. AI 기능

`ANTHROPIC_API_KEY` 를 넣으면 다음 버튼이 Claude API로 바로 동작합니다. 키가 없으면 같은 프롬프트를 보여주고 복사하게 해서, 수강생이 자기 챗봇(ChatGPT·Claude·Gemini)에 붙여넣도록 합니다.

| 단계 | 버튼 | 결과 |
|---|---|---|
| 1 | AI 주제 평가 | ICE 점수 + 개선 조언 |
| 2 | AI 초안 생성 | 워크플로우 6~10단계 |
| 4 | AI로 다듬기 | 명령서 칸 채우기 |
| 6 | AI 문구 초안 | 발표 슬라이드 문구 |

- 한 사람당 1분에 6회로 제한되어 있습니다. Anthropic Console에서 월 사용 한도를 꼭 설정하세요.
- 프롬프트는 `src/lib/prompts.ts` 에서 수정합니다.

## 5. 구조

```
src/
  app/
    page.tsx              랜딩
    login/                기수 선택 로그인 · 가입
    app/                  수강생: 홈 · 워크스페이스(workflow) · 진도공유 · 자료실 · 갤러리
    admin/                강사: 기수 대시보드 · 기수 상세 · 수강생 상세
    class/                수업 PT
    present/[userId]      수강생 발표 (me = 나)
    api/                  auth · workspace · ai · progress · assets · upload · admin/*
  components/
    workflow/             6단계 화면 (Step*.tsx, Workbench.tsx)
    slides/               슬라이드 렌더러 · 발표 플레이어
  content/week1~4.json    수업 PT 원본
  lib/                    db · auth · ai · prompts · workspace · learner-deck · storage
tools/build_pptx.py       수업 PT → PPTX
docs/커리큘럼_보완안.md      레퍼런스 PPT 대비 보완 내용
```

기술 스택: Next.js 15 (App Router) · Tailwind CSS 4 · Neon Postgres / PGlite · Vercel Blob · Claude API
