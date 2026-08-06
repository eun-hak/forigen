# 정보 구조 및 사용자 흐름

## 1. 공개 URL 구조

```text
/en
/en/search
/en/seoul/hongdae/hair
/en/seoul/myeongdong/nails
/en/seoul/gangnam/head-spa
/en/seoul/seongsu/personal-color
/en/places/{slug}
/en/guides/{slug}
/en/about
/en/contact
/en/submit-update
```

## 2. 관리자 URL 구조

```text
/admin
/admin/places
/admin/places/new
/admin/places/{id}
/admin/candidates
/admin/candidates/{id}
/admin/reports
/admin/sources
/admin/stale-data
```

## 3. 메인 사용자 흐름

```text
메인
→ 날짜 또는 이용 시점 선택
→ 업종 선택
→ 지역 선택
→ 필수 조건 선택
→ 검색 결과
→ 장소 상세
→ 예약 경로 이동 또는 메시지 복사
```

## 4. 메인 화면 구성

### Hero

```text
What do you want to do today?
Find verified K-beauty spots in Seoul.
```

### 검색 단계

1. When?
   - Today
   - Tomorrow
   - Choose a date
2. What?
   - Hair
   - Nails
   - Head Spa
   - Personal Color
3. Where?
   - Near me
   - Hongdae
   - Myeongdong
   - Gangnam
   - Seongsu
4. Conditions
   - English available
   - No Korean phone required
   - Foreign cards confirmed
   - Walk-in supported
   - Price confirmed

## 5. 검색 결과 카드

필수 표시 항목:

- 업체명
- 업종
- 지역 및 역과의 거리
- 대표 가격
- 소요 시간
- 영어 지원
- 한국 전화번호 필요 여부
- 당일 예약 또는 워크인 정책
- 해외 카드 검증 여부
- 마지막 확인 날짜
- 상세 보기
- 예약 확인

## 6. 장소 상세 페이지 구성

1. 장소명·카테고리·지역
2. 핵심 이용 가능성 요약
3. 서비스 및 가격
4. 예약 방법
5. 영어 응대 수준
6. 결제 정보
7. 방문 전 알아둘 점
8. 근거 및 확인 날짜
9. 지도·주소·공식 링크
10. 예약 메시지 생성기
11. 정보 변경 제보
12. 관련 장소

## 7. 가이드 흐름

```text
가이드 글
→ 관련 조건형 목록 페이지
→ 장소 상세
→ 예약 링크 또는 문의 메시지
```

## 8. 필터 URL 원칙

검색 상태는 URL Search Params로 관리합니다.

```text
/en/search?area=hongdae&category=head-spa&english=true&noKoreanPhone=true
```

장점:

- 공유 가능
- 브라우저 뒤로 가기 지원
- 서버 렌더링과 캐싱 용이
- 필터 상태 관리 단순화

## 9. 색인 원칙

색인 대상:

- 장소 상세
- 직접 만든 지역·업종 목록
- 조건형 랜딩 페이지
- 가이드

색인 제외:

- 장소 0~4개인 필터 조합
- 중복 조합 URL
- 내부 검색 결과 대부분
- 관리자 페이지
