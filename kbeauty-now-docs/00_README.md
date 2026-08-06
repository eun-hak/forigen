# K-Beauty Now 프로젝트 문서

## 프로젝트 한 줄 정의

서울을 방문한 외국인이 **한국 전화번호 없이 예약할 수 있고, 영어 응대가 가능하며, 당일 예약 또는 워크인을 지원하는 K-뷰티 장소**를 빠르게 찾도록 돕는 검색 서비스입니다.

## MVP 범위

- 대상 언어: 영어
- 대상 지역: 홍대, 명동, 성수, 강남
- 대상 업종: 헤어, 네일, 헤드스파, 퍼스널컬러
- 초기 장소: 100곳
- 업체 직접 확인: 최소 30곳
- 목록형 SEO 페이지: 10~15개
- 이용 방법 가이드: 15개

## 확정 기술 스택

- 사용자 웹: Next.js + TypeScript + Tailwind CSS
- API: Express + TypeScript
- 배포: Vercel
- 데이터베이스: Supabase PostgreSQL
- 이미지·스크린샷: Supabase Storage
- 크롤링: 로컬 Mac에서 Node.js + Playwright
- 데이터 검수: Next.js 관리자 페이지
- 유효성 검사: Zod
- DB 접근: Drizzle ORM 권장

## 전체 구조

```text
로컬 Mac
├─ 후보 장소 수집
├─ Playwright 크롤링
├─ AI 구조화
└─ crawl_candidates 업로드
       ↓
Supabase
├─ PostgreSQL
└─ Storage
       ↑
Vercel
├─ Next.js 사용자 웹·관리자
└─ Express API
```

## 문서 목록

| 파일 | 내용 |
|---|---|
| `01_PRODUCT_BRIEF.md` | 문제, 고객, 가치 제안, MVP 범위 |
| `02_SERVICE_CONCEPT.md` | 서비스 컨셉, 브랜드, 차별화 |
| `03_INFORMATION_ARCHITECTURE.md` | 화면 구조, URL, 사용자 흐름 |
| `04_FRONTEND_ARCHITECTURE.md` | Next.js 프론트 설계 |
| `05_BACKEND_ARCHITECTURE.md` | Express 백엔드 설계 |
| `06_DATABASE_SCHEMA.md` | Supabase DB 구조 |
| `07_API_SPEC.md` | API 엔드포인트 명세 |
| `08_CRAWLING_PIPELINE.md` | 로컬 크롤링·검수 흐름 |
| `09_ADMIN_SPEC.md` | 관리자 기능 |
| `10_SEO_CONTENT_PLAN.md` | SEO 페이지·콘텐츠 전략 |
| `11_MVP_ROADMAP.md` | 구현 순서와 완료 기준 |
| `12_CURSOR_MASTER_PROMPT.md` | Cursor에 전달할 전체 지시문 |
| `13_ENV_DEPLOYMENT.md` | 환경변수·Vercel·Supabase 배포 |
| `14_ACCEPTANCE_CRITERIA.md` | 기능별 검수 기준 |

## 가장 중요한 원칙

1. `오늘 빈자리 있음`처럼 실시간 확인되지 않은 내용을 표시하지 않습니다.
2. 장소 속성은 단순 Boolean이 아니라 **출처·근거·확인일·신뢰도**와 함께 저장합니다.
3. AI가 추출한 데이터는 관리자 승인 전까지 사용자에게 공개하지 않습니다.
4. 외부 지도·리뷰 데이터를 무단 복제하지 않습니다.
5. 필터 조합 페이지를 무한 생성하지 않고, 검색 가치가 있는 페이지만 색인합니다.
