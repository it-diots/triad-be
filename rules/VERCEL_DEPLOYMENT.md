# Vercel 배포 가이드

## 배포 준비사항

### 1. 데이터베이스 설정
Vercel은 서버리스 환경이므로 외부 PostgreSQL 서비스가 필요합니다.

**추천 서비스:**
- [Supabase](https://supabase.com/) - PostgreSQL + BaaS
- [Railway](https://railway.app/) - PostgreSQL 호스팅
- [Neon](https://neon.tech/) - 서버리스 PostgreSQL
- [PlanetScale](https://planetscale.com/) - MySQL (TypeORM 설정 변경 필요)

### 2. 환경 변수 설정
Vercel 대시보드에서 다음 환경 변수들을 설정하세요:

```bash
# 필수 환경 변수
NODE_ENV=production
VERCEL=1
API_PREFIX=api

# 데이터베이스
DB_HOST=your-postgres-host.com
DB_PORT=5432
DB_USERNAME=your-db-username
DB_PASSWORD=your-db-password
DB_DATABASE=your-db-name
DB_SSL=true

# JWT (강력한 시크릿 사용)
JWT_SECRET=your-production-jwt-secret-min-32-characters
JWT_EXPIRATION=7d
JWT_REFRESH_SECRET=your-production-refresh-secret-min-32-characters
JWT_REFRESH_EXPIRATION=30d

# CORS
CORS_ORIGIN=https://your-frontend-domain.vercel.app

# OAuth (선택사항)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-api-domain.vercel.app/auth/google/callback

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=https://your-api-domain.vercel.app/auth/github/callback

# Frontend URL
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

## 배포 방법

### 방법 1: Vercel CLI 사용

1. Vercel CLI 설치:
```bash
npm install -g vercel
```

2. 프로젝트 디렉토리에서 배포:
```bash
vercel
```

3. 환경 변수 설정:
```bash
vercel env add
```

### 방법 2: GitHub 연동

1. GitHub에 코드 푸시
2. [Vercel 대시보드](https://vercel.com/dashboard)에서 "Import Project"
3. GitHub 저장소 선택
4. Environment Variables 설정
5. Deploy 클릭

## 주의사항

### 1. 서버리스 제한사항
- 함수 실행 시간: 최대 30초 (Pro 플랜)
- 메모리: 최대 1024MB
- 임시 파일 저장: `/tmp` 디렉토리만 사용 가능

### 2. 데이터베이스 연결
- 연결 풀링 제한: 서버리스 환경에서는 연결 수 제한
- SSL 연결 필수: 대부분의 호스팅 서비스에서 SSL 연결 요구

### 3. Static Files
- `public/` 디렉토리의 정적 파일은 Vercel CDN으로 자동 제공
- 대용량 파일은 별도 CDN 사용 권장

### 4. 로깅
- `console.log`는 Vercel Functions 로그에 기록됨
- 프로덕션에서는 로그 레벨을 'warn' 이상으로 설정

## 모니터링

### Vercel Analytics
- 함수 실행 시간 모니터링
- 에러 로그 확인
- 트래픽 분석

### 추천 모니터링 도구
- [Sentry](https://sentry.io/) - 에러 추적
- [LogRocket](https://logrocket.com/) - 사용자 세션 기록
- [DataDog](https://www.datadoghq.com/) - 종합 모니터링

## 성능 최적화

### 1. Cold Start 최적화
```typescript
// 글로벌 변수로 앱 인스턴스 캐싱 (이미 적용됨)
let cachedApp: NestExpressApplication;
```

### 2. 데이터베이스 최적화
- 연결 풀 크기 최소화
- 쿼리 최적화
- 인덱스 적절히 활용

### 3. 응답 시간 개선
- API 응답 캐싱
- 페이지네이션 적용
- 불필요한 데이터 제거

## 트러블슈팅

### 일반적인 문제들

1. **모듈을 찾을 수 없음 에러**
   - `package.json`의 dependencies 확인
   - import 경로 확인 (절대 경로 vs 상대 경로)

2. **데이터베이스 연결 실패**
   - 환경 변수 확인
   - SSL 설정 확인
   - 방화벽 규칙 확인

3. **함수 타임아웃**
   - 쿼리 최적화
   - 비동기 처리 개선
   - 함수 실행 시간 모니터링

4. **CORS 에러**
   - `CORS_ORIGIN` 환경 변수 확인
   - 프리플라이트 요청 처리 확인

## 롤백 방법

1. Vercel 대시보드에서 이전 배포 선택
2. "Promote to Production" 클릭
3. 또는 CLI로 롤백:
```bash
vercel rollback [deployment-url]
```

## 비용 최적화

### Free 플랜 제한
- 함수 실행: 100GB-초/월
- 대역폭: 100GB/월
- 실행 시간: 10초

### 비용 절약 팁
1. 불필요한 API 호출 제거
2. 응답 캐싱 활용
3. 이미지 최적화
4. 함수 실행 시간 최소화

## 참고 링크

- [Vercel Documentation](https://vercel.com/docs)
- [NestJS Serverless FAQ](https://docs.nestjs.com/faq/serverless)
- [TypeORM Documentation](https://typeorm.io/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)