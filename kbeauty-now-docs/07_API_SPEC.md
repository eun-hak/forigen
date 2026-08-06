# API 명세

기본 URL:

```text
https://api.example.com/v1
```

## 1. 공개 API

### GET /places

장소 목록 조회

Query:

```text
area=hongdae
category=head_spa
english_support=confirmed
same_day_booking=true
no_korean_phone=true
foreign_card=confirmed
sort=recommended
page=1
limit=20
```

Response:

```json
{
  "items": [
    {
      "id": "uuid",
      "slug": "example-head-spa-hongdae",
      "name": "Example Head Spa",
      "category": "head_spa",
      "area": "hongdae",
      "price": { "min": 70000, "max": 120000 },
      "duration": { "min": 60, "max": 90 },
      "attributes": {
        "englishSupport": "business_confirmed",
        "sameDayBooking": "official_source",
        "koreanPhoneRequired": false,
        "foreignCard": "visitor_confirmed"
      },
      "lastVerifiedAt": "2026-08-01T00:00:00Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 12
}
```

### GET /places/:slug

장소 상세 조회

포함 데이터:

- 기본 정보
- 서비스·가격
- 속성
- 출처
- 예약 채널
- 관련 장소

### GET /guides

가이드 목록

### GET /guides/:slug

가이드 상세

### POST /places/:id/reports

정보 변경 제보

Body:

```json
{
  "reportType": "wrong_information",
  "message": "The salon no longer accepts walk-ins.",
  "reporterEmail": "optional@example.com",
  "evidenceUrl": "https://..."
}
```

## 2. 관리자 API

모든 관리자 API는 인증 필수입니다.

### GET /admin/candidates

검수 후보 목록

### GET /admin/candidates/:id

후보 상세

### POST /admin/candidates/:id/approve

후보 승인

Body:

```json
{
  "place": {},
  "services": [],
  "attributes": [],
  "sources": []
}
```

처리:

1. transaction 시작
2. places upsert
3. services upsert
4. attributes upsert
5. sources insert
6. candidate approved 변경
7. transaction commit

### POST /admin/candidates/:id/reject

후보 반려

### POST /admin/places

장소 생성

### PATCH /admin/places/:id

장소 수정

### PATCH /admin/places/:id/status

공개 상태 변경

### GET /admin/reports

변경 제보 목록

### PATCH /admin/reports/:id

제보 처리

### POST /admin/import/candidates

로컬 크롤러 결과 업로드

권장 제한:

- 요청당 최대 20건
- 각 항목 Zod 검증
- 중복 external_key 방지

## 3. 정렬 방식

`recommended` 기본 점수 예시:

```text
검증 신뢰도 35
최근 확인 20
당일 예약 정책 20
정보 완성도 15
가격 명확성 10
```

## 4. HTTP 상태 코드

```text
200 성공
201 생성
400 입력 오류
401 인증 필요
403 권한 없음
404 없음
409 중복 또는 상태 충돌
422 검증 실패
500 서버 오류
```
