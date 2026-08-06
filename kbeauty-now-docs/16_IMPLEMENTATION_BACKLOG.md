# 구현 백로그

Cursor에는 한 번에 전체 구현을 맡기기보다 아래 티켓 단위로 요청합니다.

## Epic 1. 모노레포 기반

### KB-001 모노레포 초기화

- pnpm workspace
- apps/web
- apps/api
- packages/database
- packages/schemas
- packages/shared-types
- 공통 ESLint·Prettier·tsconfig

완료 기준:

- `pnpm lint`
- `pnpm typecheck`
- 두 앱 로컬 실행

### KB-002 환경변수 검증

- Web env schema
- API env schema
- 누락 시 명확한 오류

## Epic 2. 데이터베이스

### KB-101 Migration 생성

- places
- services
- place_services
- place_attributes
- sources
- crawl_candidates
- change_reports
- guides

### KB-102 Seed 데이터

- 지역 4개
- 업종 4개
- 장소 10개
- 다양한 검증 상태

### KB-103 Repository 계층

- PlaceRepository
- CandidateRepository
- ReportRepository

## Epic 3. 공개 API

### KB-201 장소 목록 API

- 지역
- 업종
- 속성 필터
- 페이지네이션
- 정렬

### KB-202 장소 상세 API

- 서비스
- 가격
- 속성
- 출처
- 관련 장소

### KB-203 변경 제보 API

- 입력 검증
- spam 최소 방어
- 성공 메시지

## Epic 4. 사용자 Web

### KB-301 메인 검색 Wizard

- When
- What
- Where
- Conditions
- URL Params 이동

### KB-302 검색 결과

- PlaceCard
- 필터
- 정렬
- 빈 결과
- 페이지네이션

### KB-303 장소 상세

- 핵심 속성
- 가격
- 예약 경로
- 근거
- 관련 장소

### KB-304 예약 메시지 생성기

- 영어
- 한국어
- 복사
- 입력 검증

### KB-305 변경 제보 모달

## Epic 5. 관리자

### KB-401 관리자 인증

### KB-402 후보 목록·상세

### KB-403 후보 승인 Transaction

### KB-404 장소 CRUD

### KB-405 오래된 속성 목록

### KB-406 변경 제보 처리

## Epic 6. 크롤러

### KB-501 CLI 기반 구조

### KB-502 홈페이지 수집기

### KB-503 가격·예약 문구 추출

### KB-504 AI 구조화 Adapter

특정 모델에 종속되지 않도록 interface 사용:

```ts
interface StructuredExtractor {
  extract(input: ExtractionInput): Promise<ExtractionResult>;
}
```

### KB-505 Candidate 업로드

### KB-506 메모리·실패 복구 테스트

## Epic 7. SEO

### KB-601 Metadata Builder

### KB-602 Sitemap·Robots

### KB-603 목록 랜딩 페이지

### KB-604 Guide Renderer

### KB-605 JSON-LD

## Epic 8. 출시 준비

### KB-701 Analytics

### KB-702 오류 모니터링

### KB-703 개인정보 처리방침·이용약관

### KB-704 모바일 E2E 테스트

### KB-705 초기 데이터 100곳 업로드

## 추천 구현 순서

```text
KB-001 → KB-002
→ KB-101 → KB-102 → KB-103
→ KB-201 → KB-202
→ KB-301 → KB-302 → KB-303
→ KB-401 → KB-402 → KB-403
→ KB-501~505
→ KB-203 → KB-304 → KB-305
→ KB-601~605
→ KB-701~705
```

## Cursor 요청 템플릿

```text
문서 00_README.md, 04_FRONTEND_ARCHITECTURE.md,
05_BACKEND_ARCHITECTURE.md, 06_DATABASE_SCHEMA.md를 먼저 읽어라.

이번 작업은 KB-201 장소 목록 API 구현이다.
다른 티켓의 기능은 구현하지 마라.

먼저 수정할 파일과 데이터 흐름을 설명한 뒤 구현하라.
구현 후 lint, typecheck, 관련 테스트를 실행하고 결과를 정리하라.
```
