# CLAUDE.md - AI 어시스턴트 참고 문서

## 프로젝트 개요
- **프로젝트명**: Triad (웹 개발 협업 툴)
- **설명**: 피그마와 유사한 실시간 웹 협업 도구. 웹페이지 위에 오버레이로 커서 공유 및 코멘트 기능 제공
- **개발자**: 김형주 (kim62210@gmail.com)
- **주요 기술**: NestJS, TypeScript, Socket.io, PostgreSQL, TypeORM

## 프로젝트 구조
```
triad-be/
├── src/
│   ├── auth/          # 인증 관련 모듈
│   ├── users/         # 사용자 관리 모듈  
│   ├── collaboration/ # 실시간 협업 기능 (Socket.io)
│   ├── comments/      # 코멘트 기능
│   ├── projects/      # 프로젝트 관리
│   ├── common/        # 공통 유틸리티
│   └── config/        # 설정 파일
```

## 개발 환경
- **Node.js**: v18+ 권장
- **Package Manager**: npm
- **Database**: PostgreSQL (Docker로 실행)
- **Port**: 3000 (API), 3001 (Socket.io)

## 필수 확인 사항

### 개발 작업 시작 전 - 필수 체크리스트
1. **rules/ 폴더 모든 문서 검토**
   - `rules/GIT_CONVENTION.md` - Git 커밋 규칙 확인
   - `rules/DEVELOPMENT_CONVENTION.md` - 개발 컨벤션 확인
   - `rules/ESLINT_CONVENTION.md` - ESLint 설정 확인
   - `rules/CODE_REVIEW_GUIDELINES.md` - 코드 리뷰 가이드 확인
   - `rules/PROJECT_SETUP_PLAN.md` - 프로젝트 설정 계획 확인

### 코드 작성 전
1. 기존 코드 패턴 확인 필수
2. 관련 모듈의 기존 구조 파악
3. TypeScript 타입 명시적 정의 (any 타입 절대 금지)
4. 에러 처리 및 로깅 구현
5. 모든 주석은 한글로 작성

### 코드 작성 후 - 필수 검증 프로세스
1. **린트 검사**: `npm run lint` - 에러가 있으면 반드시 수정
2. **타입 체크**: `npm run typecheck` - TypeScript 타입 에러 확인
3. **빌드 실행**: `npm run build` - 빌드 성공 여부 확인
4. **테스트 실행**: `npm test` - 모든 테스트 통과 확인
5. **개발 서버 실행**: `npm run start:dev` - 런타임 에러 확인

**⚠️ 중요**: 위 5가지 검증 중 하나라도 실패하면 반드시 수정 후 다시 검증

## 코딩 컨벤션

### 파일 네이밍
- 파일명: `kebab-case.ts`
- 클래스: `PascalCase`
- 함수/변수: `camelCase`
- 상수: `UPPER_SNAKE_CASE`

### NestJS 모듈 구조
```typescript
// 모든 모듈은 다음 구조를 따름
module-name/
├── dto/
│   ├── create-[name].dto.ts
│   └── update-[name].dto.ts
├── entities/
│   └── [name].entity.ts
├── [name].controller.ts
├── [name].service.ts
└── [name].module.ts
```

### TypeScript 규칙
- **`any` 타입 절대 사용 금지** - 모든 타입 명시적 정의 필수
- 모든 함수에 반환 타입 명시
- `tsconfig.json`의 `strict: true` 항상 유지
- null/undefined 명시적 체크
- `Record<string, unknown>` 사용 권장 (any 대신)

### 주석 작성 규칙
- **모든 주석은 한글로 작성**
- 복잡한 비즈니스 로직에 설명 추가
- TODO 주석: `// TODO: 작업 내용`
- FIXME 주석: `// FIXME: 수정 필요 사항`
- 예시:
```typescript
// 사용자 인증 토큰 검증
const validateToken = (token: string): boolean => {
  // JWT 토큰 형식 확인
  if (!token.startsWith('Bearer ')) {
    return false;
  }
  // 토큰 만료 시간 검증
  return !isTokenExpired(token);
};
```

### Import 순서 (ESLint 자동 정렬)
1. Node.js 내장 모듈 (fs, path 등)
2. 외부 라이브러리 (@nestjs/*, express, passport 등)
3. 내부 공통 모듈 (src/common/*)
4. 같은 모듈 스코프 (../*, ./*)
5. 타입 정의

**각 그룹 사이에 빈 줄 추가**

예시:
```typescript
import { readFile } from 'fs/promises';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CommonService } from '@/common/common.service';

import { AuthService } from '../auth.service';
import { User } from './entities/user.entity';

import type { JwtPayload } from './types';
```

## Git 워크플로우

### 브랜치 전략
- `main`: 프로덕션 브랜치
- `develop`: 개발 통합 브랜치
- `feature/*`: 기능 개발
- `bugfix/*`: 버그 수정
- `hotfix/*`: 긴급 수정

### 커밋 메시지 형식 (rules/GIT_CONVENTION.md 준수)
```
<type>: <subject>

<body>

<footer>
```

**⚠️ 중요**: scope는 사용하지 않음 (괄호 없음)

**Types** (영어 유지 필수):
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `refactor`: 리팩토링
- `docs`: 문서 수정
- `test`: 테스트 추가/수정
- `chore`: 빌드, 설정 등
- `style`: 코드 포맷팅
- `perf`: 성능 개선
- `ci`: CI 설정 수정
- `build`: 빌드 시스템 수정
- `revert`: 커밋 되돌리기

**올바른 예시**:
```bash
feat: JWT 인증 시스템 구현

- Passport.js JWT 전략 구현
- 액세스 토큰 및 리프레시 토큰 로직 추가
- 토큰 검증 미들웨어 구현

Closes #123
```

**잘못된 예시**:
```bash
feat(auth): JWT 인증 시스템 구현  # ❌ scope 사용 금지
기능: JWT 인증 시스템 구현         # ❌ 한글 type 사용 금지
```

## API 설계 원칙

### RESTful 엔드포인트
- GET `/resources` - 목록 조회
- GET `/resources/:id` - 단일 조회
- POST `/resources` - 생성
- PUT `/resources/:id` - 전체 수정
- PATCH `/resources/:id` - 부분 수정
- DELETE `/resources/:id` - 삭제

### 응답 형식
```typescript
// 성공 응답
{
  "success": true,
  "data": { ... },
  "message": "Success"
}

// 에러 응답
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}

// 페이지네이션
{
  "data": [...],
  "total": 100,
  "offset": 0,
  "limit": 20
}
```

### 상태 코드
- 200: 성공
- 201: 생성 성공
- 400: 잘못된 요청
- 401: 인증 실패
- 403: 권한 없음
- 404: 리소스 없음
- 500: 서버 에러

## Socket.io 이벤트 규칙

### 이벤트 네이밍
- 클라이언트 → 서버: `kebab-case`
- 서버 → 클라이언트: `kebab-case`
- 에러 이벤트: `error:*`

### 주요 이벤트
```typescript
// 연결 관련
'connection'
'disconnect'

// 프로젝트 관련
'join-project'
'leave-project'

// 협업 기능
'cursor-move'
'cursor-update'
'comment-create'
'comment-created'

// 사용자 상태
'user-joined'
'user-left'
```

## 데이터베이스 규칙

### 엔티티 설계
- 모든 엔티티에 `id` (UUID), `createdAt`, `updatedAt` 포함
- Soft delete 사용 시 `deletedAt` 추가
- 관계 설정 시 명확한 cascade 옵션 정의

### 네이밍 컨벤션
- 테이블명: 복수형 snake_case (예: `users`, `project_members`)
- 컬럼명: snake_case
- 인덱스명: `idx_테이블명_컬럼명`

## 보안 체크리스트
- [ ] 환경 변수로 민감 정보 관리
- [ ] SQL Injection 방지 (파라미터 바인딩)
- [ ] XSS 방지 (입력값 검증 및 이스케이프)
- [ ] JWT Secret 충분히 복잡하게 설정
- [ ] CORS 설정 확인
- [ ] Rate Limiting 적용
- [ ] 입력값 검증 (class-validator)

## 성능 고려사항
- 필요한 데이터만 조회 (select 옵션 활용)
- 관계 로딩 최적화 (lazy/eager loading 적절히 사용)
- 캐싱 전략 구현 (Redis 추후 도입 예정)
- 페이지네이션 필수 적용
- 인덱스 적절히 활용

## 테스트 전략
- Unit Test: 서비스 로직 중심
- Integration Test: API 엔드포인트
- E2E Test: 주요 사용자 시나리오

### 테스트 파일 위치
- `*.spec.ts`: 유닛 테스트
- `*.e2e-spec.ts`: E2E 테스트

## 문서화
- API 문서: Swagger 자동 생성 (`/api/docs`)
- 코드 주석: 복잡한 로직에만 작성
- README 업데이트: 주요 변경사항 발생 시

## 자주 사용하는 명령어
```bash
# 개발 서버 실행
npm run start:dev

# 데이터베이스 실행 (Docker)
npm run db:up
docker-compose up -d

# 데이터베이스 종료
npm run db:down

# 데이터베이스 초기화
npm run db:reset

# 린트 검사
npm run lint

# 린트 자동 수정
npm run lint:fix

# 포맷팅
npm run format

# 포맷팅 체크
npm run format:check

# 타입 체크
npm run typecheck

# 테스트 실행
npm test

# 빌드
npm run build

# 프로덕션 실행
npm run start:prod

# Pre-commit 체크
npm run pre-commit
```

## 주의사항
1. **절대 커밋하지 말 것**:
   - `.env` 파일
   - 개인 인증 정보
   - `node_modules/`
   - `dist/`

2. **코드 리뷰 필수 확인**:
   - 타입 안정성
   - 에러 처리
   - 보안 취약점
   - 성능 이슈

3. **배포 전 체크리스트**:
   - [ ] 모든 테스트 통과
   - [ ] 린트 에러 없음
   - [ ] 빌드 성공
   - [ ] 환경 변수 확인
   - [ ] 데이터베이스 마이그레이션

## 참고 문서
- [PROJECT_SETUP_PLAN.md](./rules/PROJECT_SETUP_PLAN.md) - 프로젝트 설정 계획
- [DEVELOPMENT_CONVENTION.md](./rules/DEVELOPMENT_CONVENTION.md) - 개발 컨벤션
- [GIT_CONVENTION.md](./rules/GIT_CONVENTION.md) - Git 사용 규칙
- [CODE_REVIEW_GUIDELINES.md](./rules/CODE_REVIEW_GUIDELINES.md) - 코드 리뷰 가이드
- [ESLINT_CONVENTION.md](./rules/ESLINT_CONVENTION.md) - ESLint 설정

## 개발자 정보
- **이름**: 김형주
- **이메일**: kim62210@gmail.com (개인)
- **회사 이메일**: kim62210@ship-da.com

---

**Note**: 이 문서는 AI 어시스턴트가 프로젝트 컨텍스트를 빠르게 파악하고 일관된 코드를 생성할 수 있도록 돕기 위한 참고 문서입니다. 프로젝트 진행에 따라 지속적으로 업데이트가 필요합니다.