# 프론트엔드 아키텍처

## 1. 기술 스택

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- shadcn/ui 선택 사용
- React Hook Form
- Zod
- TanStack Query
- Zustand는 최소 사용
- next-intl 또는 자체 locale 구조

## 2. 권장 프로젝트 구조

```text
apps/web/
├─ app/
│  ├─ [locale]/
│  │  ├─ page.tsx
│  │  ├─ search/page.tsx
│  │  ├─ places/[slug]/page.tsx
│  │  ├─ guides/[slug]/page.tsx
│  │  └─ seoul/[area]/[category]/page.tsx
│  ├─ admin/
│  ├─ api/
│  ├─ sitemap.ts
│  └─ robots.ts
├─ components/
│  ├─ search/
│  ├─ place/
│  ├─ verification/
│  ├─ booking/
│  └─ admin/
├─ features/
│  ├─ places/
│  ├─ search/
│  ├─ guides/
│  └─ reports/
├─ lib/
│  ├─ api-client.ts
│  ├─ metadata.ts
│  └─ formatters.ts
└─ types/
```

## 3. 렌더링 전략

### Server Components

- 메인 페이지
- 장소 상세
- SEO 목록 페이지
- 가이드
- 초기 검색 결과

### Client Components

- 필터 패널
- 지도
- 현재 위치 요청
- 예약 메시지 생성기
- 제보 모달
- 관리자 폼

페이지 전체를 Client Component로 만들지 않습니다.

## 4. 데이터 요청 원칙

### 공개 페이지

Server Component에서 Express API 호출:

```ts
await fetch(`${API_URL}/v1/places/${slug}`, {
  next: { revalidate: 3600 },
});
```

### 상호작용 페이지

TanStack Query 사용:

- 필터 변경
- 페이지네이션
- 관리자 CRUD
- 후보 승인

## 5. 상태 관리

| 상태 | 관리 방식 |
|---|---|
| 검색 필터 | URL Search Params |
| 서버 데이터 | Server Fetch / TanStack Query |
| 로그인 관리자 상태 | Auth 세션 |
| 지도 모드·모달 | Local State 또는 Zustand |
| 폼 | React Hook Form |

## 6. 핵심 컴포넌트

```text
SearchWizard
SearchFilterBar
PlaceCard
PlaceAttributeBadge
VerificationSource
PriceRange
BookingChannelButtons
BookingMessageGenerator
StaleInformationNotice
ReportUpdateDialog
```

## 7. SEO 메타데이터

각 페이지에서 생성:

- title
- description
- canonical
- Open Graph
- Twitter Card
- hreflang 준비

장소 상세 title 예시:

```text
{Place Name} – English Booking, Price & Foreigner Guide | K-Beauty Now
```

## 8. 접근성

- 모든 필터 키보드 사용 가능
- 상태를 색상만으로 구분하지 않음
- 검증 아이콘에 텍스트 제공
- 이미지 alt 필수
- 모달 focus trap
- 충분한 터치 영역

## 9. 성능 목표

- 모바일 LCP 2.5초 이하 목표
- 장소 카드 이미지 최적화
- 지도는 사용자가 열 때 지연 로딩
- 목록 페이지 서버 렌더링
- 필터 변경 요청 debounce
