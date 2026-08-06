# 서비스 컨셉 문서

## 1. 가칭

**K-Beauty Now**

## 2. 영문 핵심 문구

> Find a K-beauty spot you can actually book today.

보조 문구:

> No Korean phone number. No Korean required.

주의: 실시간 빈자리가 확인되지 않은 장소에는 `Available today`라고 단정하지 않습니다.

## 3. 서비스 정체성

일반적인 K-뷰티 추천 플랫폼이 아니라 **외국인의 실제 이용 가능성을 확인하는 검색 도구**입니다.

```text
기존 서비스: 어디가 유명한가?
K-Beauty Now: 내가 실제로 이용할 수 있는가?
```

## 4. 핵심 차별점

### 4.1 외국인 장벽 중심

- 한국 전화번호 필요 여부
- 영어 상담 가능 여부
- 해외 카드 가능 여부
- 국제 전화번호 입력 가능 여부
- 예약 채널
- 워크인 정책
- 당일 예약 정책

### 4.2 항목별 검증

업체 전체를 한 번에 `검증됨`으로 표시하지 않습니다.

```text
English consultation
- 업체 직접 확인
- 확인일: 2026-08-01

Foreign-issued Visa
- 방문자 확인
- 확인일: 2026-07-28
```

### 4.3 결정 지원

- 가격 범위
- 예상 소요 시간
- 예약 난이도
- 외국인에게 필요한 준비물
- 잠재적 주의사항

## 5. 데이터 상태 문구

| 내부 상태 | 사용자 표시 |
|---|---|
| `business_confirmed` | Confirmed by the business |
| `official_source` | Confirmed on the official website |
| `visitor_confirmed` | Confirmed by an international visitor |
| `likely` | Likely available — confirm before visiting |
| `unknown` | Not confirmed |
| `expired` | Information may be outdated |

## 6. 당일 예약 관련 문구

구분해야 하는 개념:

- `same_day_booking_supported`: 업체가 일반적으로 당일 예약을 받음
- `walk_in_supported`: 예약 없이 방문 가능
- `availability_confirmed_today`: 오늘 실제 가능 시간을 확인함

MVP에서는 첫 두 항목만 주로 사용합니다.

## 7. 디자인 방향

- 여행 도구처럼 빠르고 명확한 UI
- 밝고 중립적인 톤
- 과도한 핑크·여성 전용 이미지 지양
- 모바일 우선
- 사진보다 이용 조건과 가격을 먼저 표시
- 지도보다 리스트와 필터를 우선

## 8. 브랜드 확장 가능성

초기:

```text
Hair / Nails / Head Spa / Personal Color
```

확장:

```text
Makeup / Photo Studio / Spa / One-day Class
```

장기적으로는 `Korea Now` 또는 `Foreigner Ready Korea` 형태로 맛집·체험·짐 보관 등으로 확장할 수 있습니다.
