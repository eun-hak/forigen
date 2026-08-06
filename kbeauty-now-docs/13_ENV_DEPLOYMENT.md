# 환경변수 및 배포

## 1. Vercel 프로젝트

### Web

```text
Root Directory: apps/web
Domain: kbeautynow.com
```

### API

```text
Root Directory: apps/api
Domain: api.kbeautynow.com
```

## 2. Web 환경변수

```env
NEXT_PUBLIC_APP_URL=https://kbeautynow.com
API_BASE_URL=https://api.kbeautynow.com/v1
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

브라우저에서 Supabase를 직접 사용하지 않는 초기 구조라면 공개 키 사용을 최소화합니다.

## 3. API 환경변수

```env
NODE_ENV=production
DATABASE_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=source-screenshots
ADMIN_ALLOWED_EMAIL=
CORS_ALLOWED_ORIGIN=https://kbeautynow.com
```

## 4. 로컬 크롤러 환경변수

```env
DATABASE_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
AI_API_KEY=
CRAWLER_OUTPUT_DIR=./output
```

`.env`는 저장소에 커밋하지 않습니다.

## 5. DB 연결

Vercel Express에서 ORM으로 직접 연결할 때 Supabase transaction pooler 사용을 권장합니다.

연결 수는 초기 1~2개로 제한합니다.

## 6. CORS

허용 대상:

```text
http://localhost:3000
https://kbeautynow.com
https://www.kbeautynow.com
```

## 7. 배포 흐름

```text
Git push
→ Vercel Preview
→ 테스트
→ main merge
→ Production 배포
```

DB migration:

```text
로컬에서 migration 생성
→ Preview DB 또는 개발 DB 적용
→ 확인
→ 운영 DB 적용
```

## 8. Storage

Bucket:

```text
source-screenshots
place-images
```

정책:

- 관리자만 업로드
- 공개 이미지는 public 또는 signed URL 정책 결정
- 원본 근거 스크린샷은 공개 노출 여부를 별도 제어

## 9. 모니터링

초기 권장:

- Vercel Logs
- Supabase Logs
- Sentry 선택
- Uptime 모니터
- Search Console
- GA4 또는 Plausible
