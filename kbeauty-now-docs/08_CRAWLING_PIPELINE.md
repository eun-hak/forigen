# 로컬 크롤링 파이프라인

## 1. 운영 방식

크롤러는 서버에서 상시 실행하지 않습니다.

```text
로컬 Mac
→ 필요할 때 실행
→ 결과 검수
→ Supabase crawl_candidates 업로드
```

## 2. 수집 대상

### 자동 수집 우선

- 업체 공식 홈페이지
- 공식 예약 페이지
- 공개 가격 페이지
- 공공데이터
- 공개된 업체 정보

### 수동 확인 우선

- 인스타그램
- 해외 카드 실제 승인 여부
- 영어 가능한 직원의 상시 여부
- 워크인 시간대
- 당일 예약 가능 정책

## 3. 크롤러 구조

```text
crawler/
├─ src/
│  ├─ collectors/
│  │  ├─ website.collector.ts
│  │  ├─ booking.collector.ts
│  │  └─ public-data.collector.ts
│  ├─ extractors/
│  │  ├─ text.extractor.ts
│  │  ├─ price.extractor.ts
│  │  └─ attribute.extractor.ts
│  ├─ validators/
│  ├─ uploaders/
│  └─ cli.ts
├─ input/
├─ output/
└─ screenshots/
```

## 4. 처리 단계

```text
후보 CSV
→ URL 확인
→ Playwright 접근
→ 본문·가격·예약 문구 추출
→ AI 구조화
→ JSON Schema 검증
→ 로컬 결과 저장
→ 수동 검수
→ Supabase 업로드
```

## 5. 추출 결과 형식

```json
{
  "externalKey": "source:123",
  "placeName": "Example Salon",
  "sourceUrl": "https://example.com",
  "extractedData": {
    "category": "hair",
    "area": "hongdae",
    "services": [],
    "attributes": [
      {
        "type": "english_support",
        "value": true,
        "status": "official_source",
        "evidence": "English consultation is available.",
        "checkedAt": "2026-08-06"
      }
    ]
  },
  "confidence": 0.89
}
```

## 6. CLI 명령

```bash
# 신규 장소 20개 조사
npm run crawl:new -- --limit=20

# 특정 CSV 조사
npm run crawl:file -- --input=./input/places.csv

# 오래된 장소 재조사
npm run crawl:expired -- --limit=20

# 특정 장소 조사
npm run crawl:place -- --id=PLACE_ID

# 검수 완료 결과 업로드
npm run upload:candidates -- --input=./output/approved.json
```

## 7. Playwright 운영 원칙

- Chromium 동시 실행 1개
- 장소마다 새 Context 생성
- Context는 반드시 종료
- 10개 처리 후 Browser 재시작
- 페이지 타임아웃 설정
- 다운로드 차단
- 사설 IP·localhost 접근 차단
- robots.txt와 서비스 약관 확인
- 로그인 우회 및 캡차 우회 금지

## 8. 데이터 갱신 주기

| 데이터 | 권장 재확인 |
|---|---:|
| 가격 | 30일 |
| 예약 방법 | 30일 |
| 당일 예약 정책 | 30일 |
| 워크인 정책 | 30일 |
| 영어 응대 | 60~90일 |
| 업체 직접 확인 | 90일 |
| 주소·폐업 여부 | 30일 |

## 9. 공개 원칙

다음 상태만 공개 가능:

- business_confirmed
- official_source
- visitor_confirmed
- 관리자가 승인한 likely

자동 추출 원본은 공개하지 않습니다.
