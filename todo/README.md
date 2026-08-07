# K-Beauty Now 작업 인수인계

작성 기준일: 2026-08-07

## 현재 완료된 범위

- pnpm 모노레포와 Next.js 관리자 앱
- Supabase 스키마 및 후보 승인 RPC
- 공공데이터 CSV 수집·인코딩 처리
- 지역·업종 분류
- Kakao·Naver 장소 매칭
- 홈페이지 탐색 및 기본 근거 추출
- 후보 중복 제거 및 Supabase 업로드
- 관리자 로그인
- 후보 목록·상세·수정·승인·재조사·거절
- 승인된 장소 목록·검색·필터와 공개 상태 변경
- 장소 공개 시각 자동 기록 및 상태 변경 감사 로그
- 공개 장소 목록 API
- 공개 장소 상세 API
- 영문 사용자 메인 화면과 4단계 검색 Wizard
- URL 파라미터 기반 검색 결과·장소 카드·빈 결과·페이지네이션
- 사용자 장소 상세 페이지와 모바일 고정 예약 CTA
- 서비스·가격·검증 조건·출처·관련 장소 표시
- 영어·한국어 예약 문의 메시지 생성 및 복사
- Kakao 정적 지도, 장소 마커와 Kakao Map 크게 보기 링크
- 한국어 메인·검색·상세 페이지와 언어 전환
- 언어별 canonical·hreflang, robots.txt와 다국어 sitemap
- 관리자 장소 기본 정보·가격·검증 속성 편집
- 오래된 속성 목록과 관리자 작업 이력
- 사용자 변경 제보와 관리자 처리 화면 (`0003_change_reports.sql` 적용 필요)
- 검색 로딩 Skeleton과 오류 복구 화면
- 영문 장소 상세 JSON-LD 구조화 데이터
- 개인정보처리방침·이용약관·데이터 출처 안내
- 외부 수집 요청 지수 백오프 자동 재시도

## 공개 장소 API

로컬 기본 주소:

```text
http://localhost:3000/api/v1
```

### 목록

```http
GET /api/v1/places
```

지원 Query:

- `area`: `hongdae`, `myeongdong`, `gangnam`, `seongsu`
- `category`: `hair`, `nails`, `head_spa`, `personal_color`
- `english_support`: `confirmed`, `available`, `unknown`
- `same_day_booking`: `true`, `false`
- `no_korean_phone`: `true`, `false`
- `foreign_card`: `confirmed`, `available`, `unknown`
- `sort`: `recommended`, `recent`, `name`
- `page`: 1 이상의 정수
- `limit`: 1~100, 기본 20

예시:

```text
/api/v1/places?area=hongdae&category=hair&sort=recommended&page=1&limit=20
```

응답은 `items`, `page`, `limit`, `total`을 반환한다.

### 상세

```http
GET /api/v1/places/:slug
```

기본 정보, 서비스·가격, 검증 속성, 예약 채널, 출처, 관련 장소를 반환한다.

### 중요한 공개 조건

공개 API는 `places.status = 'published'`인 장소만 반환한다. 후보 승인 RPC는 장소를 `draft`로 생성하므로 승인만 하고 공개 상태로 바꾸지 않으면 목록이 0건일 수 있다.

관리자 장소 CRUD와 공개 상태 변경 화면을 구현하기 전에는 Supabase Table Editor의 `places` 테이블에서 검수 완료 장소의 `status`를 `published`로 변경하고 `published_at`을 설정해야 한다.

## 다음 작업 우선순위

### P0 — 사용자 MVP

1. 공개 장소를 사용한 데스크톱·모바일 실제 브라우저 시각 검수
2. 검색 필터를 결과 화면에서 바로 수정하는 모바일 Bottom Sheet

### P0 — 관리자 보완

1. 출처 추가·수정·삭제 폼 (현재는 조회만 가능)
2. 장소 신규 생성·삭제 (현재는 승인 생성과 편집 지원)

### P1 — 데이터 파이프라인

1. 실패 원인 영속 저장
2. 중단 후 이어서 실행하는 체크포인트
3. 오래된 정보 정기 재수집
4. Playwright 기반 동적 페이지 수집
5. 페이지 스크린샷 저장
6. 모델 독립적인 AI 구조화 Adapter
7. 가격·소요시간·예약 조건 추출 강화
8. 정기 실행 스케줄러
9. 대량 실행 시 메모리·복구 테스트

### P1 — 사용자 기능

1. 변경 제보 스팸 방지와 제출 완료 안내

### P1 — SEO·출시

1. 지역·업종별 랜딩 페이지
2. 지역·업종 랜딩 metadata와 noindex 세부 정책
3. 한국어 상세 JSON-LD 구조화 데이터
5. 가이드 콘텐츠
6. Vercel 배포와 운영 환경변수
7. Analytics와 오류 모니터링
8. 모바일 E2E 테스트
9. Search Console 등록

### P2 이후

- 인터랙티브 지도 전환(확대·이동이 필요할 때 Kakao JavaScript 키 추가)
- 즐겨찾기
- 업체용 정보 관리 페이지
- 일반 사용자 회원가입
- 예약 제휴
- 추가 언어

## 다른 컴퓨터에서 시작하기

```bash
git clone https://github.com/eun-hak/forigen.git
cd forigen
corepack enable
pnpm install
pnpm test
pnpm typecheck
pnpm dev:web
```

프로젝트 루트에 별도로 전달받은 `.env`가 필요하다. 공공데이터를 처음부터 다시 처리하려면 Git에서 제외된 `crawler/input/beauty_salons.csv`도 별도로 복사한다.

## 검증 명령

```bash
pnpm test
pnpm typecheck
pnpm build
```

공개 API 스모크 테스트:

```bash
curl 'http://localhost:3000/api/v1/places?page=1&limit=20'
curl 'http://localhost:3000/api/v1/places?area=hongdae&category=hair'
curl 'http://localhost:3000/api/v1/places/<published-place-slug>'
```

## 주의사항

- `.env`와 Supabase secret key를 Git에 커밋하지 않는다.
- 브라우저 코드에서 `SUPABASE_SECRET_KEY`를 참조하지 않는다.
- 공개 API에는 `draft`, `hidden`, `closed` 데이터를 노출하지 않는다.
- 원본 CSV와 `crawler/output`은 Git에서 제외되어 있다.
- 현재 공개 목록 구현은 초기 데이터 최대 1,000곳을 서버에서 읽어 속성 필터와 추천 정렬을 적용한다. 데이터가 크게 증가하면 SQL RPC 또는 DB View 기반 페이지네이션으로 교체한다.
- 상세 지도는 `KAKAO_REST_API_KEY`를 서버에서만 사용해 `/api/v1/map`으로 정적 PNG를 제공한다. 브라우저에 키가 노출되지 않으며 30일 캐시한다.
- 확대·드래그 가능한 Kakao Web SDK 지도는 REST 키가 아니라 별도의 JavaScript 키와 JavaScript SDK 도메인 등록이 필요하다.
- 2026-08-07 기준 266개 장소가 공개 상태다. 자동 브라우저가 연결되지 않아 실제 데이터 기반 데스크톱·모바일 시각 검수는 남아 있다.
