# 백엔드 아키텍처

## 1. 기술 스택

- Next.js Route Handlers and Server Actions
- TypeScript
- Zod
- Supabase REST API and PostgreSQL functions
- Supabase PostgreSQL
- Supabase Storage
- 관리자 인증: Supabase Auth 또는 단일 관리자 계정
- Vercel Functions 배포

## 2. 원칙

- Next.js 서버 코드는 짧은 API 요청과 form action만 처리
- 크롤링·Playwright는 로컬에서 실행
- 비즈니스 로직은 Route Handler와 Server Action에서 분리
- 모든 입력은 Zod 검증
- 공개 데이터와 관리자 데이터 분리
- Service Role 키는 서버에서만 사용

## 3. 권장 구조

```text
apps/web/src/
├─ app/api/v1/        # 공개 JSON API
├─ app/admin/        # 관리자 화면·Server Actions
├─ app/[locale]/     # 공개 form actions
└─ lib/              # 검증·비즈니스·Supabase 접근

supabase/migrations/          # 스키마, RLS, transaction RPC
crawler/src/                 # 로컬 수집 파이프라인
```

## 4. 요청 처리 구조

```text
Route Handler / Server Action
→ Zod validation
→ lib data function
→ Supabase REST / PostgreSQL function
```

## 5. 도메인

### Places

- 장소 기본 정보
- 공개 상태
- 위치·주소
- 공식 링크

### Services

- 헤어·네일·헤드스파·퍼스널컬러
- 서비스별 가격과 소요 시간

### Attributes

- 영어 지원
- 해외 카드
- 한국 번호 필요 여부
- 워크인
- 당일 예약

### Sources

- 근거 URL
- 근거 문장
- 확인일
- 출처 유형

### Candidates

- 로컬 크롤러 결과
- 관리자 검수 상태

### Reports

- 사용자 변경 제보

## 6. 인증·권한

### 공개 API

읽기 전용:

- 장소 목록
- 장소 상세
- 가이드
- 변경 제보 생성

### 관리자 API

인증 필요:

- 장소 생성·수정·삭제
- 후보 승인·반려
- 속성 검증
- 제보 처리

## 7. 서버리스 주의사항

- DB 연결은 Supabase Pooler 사용
- 함수 내부에서 무거운 처리 금지
- 파일은 로컬에 영구 저장하지 않음
- 업로드는 Supabase Storage 사용
- 대량 import는 10~20건 단위로 나눔
- 타임아웃이 긴 작업은 로컬 스크립트로 분리

## 8. 에러 응답 형식

```json
{
  "error": {
    "code": "PLACE_NOT_FOUND",
    "message": "The requested place was not found.",
    "details": null
  }
}
```

## 9. 로깅

필수 로그:

- 요청 ID
- 관리자 변경 이력
- 후보 승인·반려
- API 오류
- 데이터 import 결과

민감한 키·토큰·사용자 IP 전체는 로그에 남기지 않습니다.
