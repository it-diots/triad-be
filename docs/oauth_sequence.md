# OAuth 인증 시퀀스 다이어그램

## Google OAuth 로그인 흐름

```mermaid
sequenceDiagram
    actor User as 사용자
    participant Frontend as 프론트엔드
    participant Backend as NestJS 백엔드
    participant Google as Google OAuth
    participant DB as 데이터베이스

    User->>Frontend: 1. "Google 로그인" 버튼 클릭
    Frontend->>Backend: 2. GET /auth/google
    Note over Backend: GoogleAuthGuard 실행
    Backend->>Google: 3. OAuth 인증 페이지로 리다이렉트
    Google->>User: 4. Google 로그인 화면 표시
    User->>Google: 5. 계정 선택 및 권한 승인
    Google->>Backend: 6. GET /auth/google/callback?code=xxx
    Note over Backend: GoogleAuthGuard가 code 검증
    Backend->>Google: 7. Access Token 요청
    Google->>Backend: 8. Access Token + 사용자 프로필 반환
    Note over Backend: GoogleStrategy.validate() 실행
    Backend->>DB: 9. 사용자 조회/생성 (UsersService.createOAuthUser)

    alt 신규 사용자
        DB->>Backend: 10a. 새 사용자 생성
    else 기존 사용자
        DB->>Backend: 10b. 기존 사용자 프로필 업데이트
    end

    Backend->>Backend: 11. JWT 토큰 생성 (generateTokens)
    Backend->>Frontend: 12. 리다이렉트: /auth/callback?accessToken=xxx&refreshToken=yyy&provider=google
    Frontend->>Frontend: 13. 토큰 저장 (localStorage/cookie)
    Frontend->>User: 14. 로그인 완료 화면 표시
```

## GitHub OAuth 로그인 흐름

```mermaid
sequenceDiagram
    actor User as 사용자
    participant Frontend as 프론트엔드
    participant Backend as NestJS 백엔드
    participant GitHub as GitHub OAuth
    participant DB as 데이터베이스

    User->>Frontend: 1. "GitHub 로그인" 버튼 클릭
    Frontend->>Backend: 2. GET /auth/github
    Note over Backend: GitHubAuthGuard 실행
    Backend->>GitHub: 3. OAuth 인증 페이지로 리다이렉트
    GitHub->>User: 4. GitHub 로그인 화면 표시
    User->>GitHub: 5. 계정 선택 및 권한 승인
    GitHub->>Backend: 6. GET /auth/github/callback?code=xxx
    Note over Backend: GitHubAuthGuard가 code 검증
    Backend->>GitHub: 7. Access Token 요청
    GitHub->>Backend: 8. Access Token + 사용자 프로필 반환
    Note over Backend: GitHubStrategy.validate() 실행
    Backend->>DB: 9. 사용자 조회/생성 (UsersService.createOAuthUser)

    alt 신규 사용자
        DB->>Backend: 10a. 새 사용자 생성
    else 기존 사용자 (이메일 일치)
        DB->>Backend: 10b. OAuth Provider 연동
    else 기존 OAuth 사용자
        DB->>Backend: 10c. 프로필 정보 업데이트
    end

    Backend->>Backend: 11. JWT 토큰 생성 (generateTokens)
    Backend->>Frontend: 12. 리다이렉트: /auth/callback?accessToken=xxx&refreshToken=yyy&provider=github
    Frontend->>Frontend: 13. 토큰 저장 (localStorage/cookie)
    Frontend->>User: 14. 로그인 완료 화면 표시
```

## 에러 처리 흐름

```mermaid
sequenceDiagram
    actor User as 사용자
    participant Frontend as 프론트엔드
    participant Backend as NestJS 백엔드
    participant OAuth as OAuth Provider

    User->>Frontend: 1. OAuth 로그인 시도
    Frontend->>Backend: 2. GET /auth/{provider}
    Backend->>OAuth: 3. OAuth 인증 페이지로 리다이렉트
    OAuth->>User: 4. 로그인 화면 표시

    alt 사용자가 거부
        User->>OAuth: 5a. 권한 승인 거부
        OAuth->>Backend: 6a. 에러 코드와 함께 콜백
        Backend->>Backend: 7a. 에러 로깅
        Backend->>Frontend: 8a. 리다이렉트: /auth/callback?error=access_denied
        Frontend->>User: 9a. 에러 메시지 표시
    else OAuth Provider 에러
        OAuth->>Backend: 5b. 인증 실패 응답
        Backend->>Backend: 6b. 에러 로깅
        Backend->>Frontend: 7b. 리다이렉트: /auth/callback?error=authentication_failed
        Frontend->>User: 8b. 에러 메시지 표시
    else 서버 내부 에러
        Backend->>Backend: 5c. 예외 발생 (DB 연결 실패 등)
        Backend->>Backend: 6c. 에러 로깅
        Backend->>Frontend: 7c. 리다이렉트: /auth/callback?error=internal_server_error
        Frontend->>User: 8c. 에러 메시지 표시
    end
```

## 사용자 생성/연동 상세 흐름

```mermaid
sequenceDiagram
    participant Strategy as OAuth Strategy
    participant UsersService as UsersService
    participant DB as 데이터베이스

    Strategy->>UsersService: createOAuthUser(profile)
    Note over UsersService: profile = {email, provider, providerId, ...}

    UsersService->>DB: 1. findByProviderAndId(provider, providerId)

    alt 동일 Provider + ProviderId 존재
        DB->>UsersService: 기존 사용자 반환
        UsersService->>UsersService: updateOAuthUserProfile()
        Note over UsersService: 아바타, 이름 등 프로필 업데이트
        UsersService->>DB: save(updatedUser)
        DB->>UsersService: 업데이트된 사용자 반환
    else Provider + ProviderId 없음
        DB->>UsersService: null 반환
        UsersService->>DB: 2. findByEmail(email)

        alt 동일 이메일 존재
            DB->>UsersService: 기존 사용자 반환
            UsersService->>UsersService: linkOAuthProviderToExistingUser()
            Note over UsersService: OAuth Provider 정보 연동<br/>provider, providerId 업데이트
            UsersService->>DB: save(linkedUser)
            DB->>UsersService: 연동된 사용자 반환
        else 완전히 새로운 사용자
            DB->>UsersService: null 반환
            UsersService->>UsersService: createNewOAuthUser()
            Note over UsersService: 신규 사용자 생성<br/>username 중복 체크 후 생성
            UsersService->>DB: generateUniqueUsername()
            DB->>UsersService: 사용 가능한 username 반환
            UsersService->>DB: save(newUser)
            DB->>UsersService: 생성된 사용자 반환
        end
    end

    UsersService->>Strategy: User 객체 반환
```

## 주요 엔드포인트 및 역할

### 1. 인증 시작 엔드포인트
- **GET /auth/google**: Google OAuth 인증 시작
- **GET /auth/github**: GitHub OAuth 인증 시작

이 엔드포인트들은 실제로 응답을 반환하지 않고, Guard가 자동으로 OAuth Provider로 리다이렉트합니다.

### 2. 콜백 엔드포인트
- **GET /auth/google/callback**: Google OAuth 콜백 처리
- **GET /auth/github/callback**: GitHub OAuth 콜백 처리

콜백 엔드포인트는 다음 작업을 수행합니다:
1. OAuth Provider로부터 받은 인증 코드 검증
2. 사용자 프로필 정보 가져오기
3. DB에서 사용자 조회/생성/업데이트
4. JWT 토큰 생성 (Access Token + Refresh Token)
5. 프론트엔드로 토큰과 함께 리다이렉트

### 3. 토큰 생성 (AuthService.generateTokens)
```typescript
{
  accessToken: "eyJhbGc...",  // 15분 유효
  refreshToken: "eyJhbGc...", // 7일 유효
  tokenType: "Bearer",
  expiresIn: 900,
  user: {
    id: "...",
    email: "...",
    username: "..."
  }
}
```

## 환경 변수 설정

OAuth 기능을 사용하려면 다음 환경 변수가 필요합니다:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Frontend URL (콜백 리다이렉트용)
FRONTEND_URL=http://localhost:3001

# JWT 설정
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-jwt-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

환경 변수가 설정되지 않은 Provider는 자동으로 비활성화됩니다.

## 프론트엔드 구현 예시

### 1. OAuth 로그인 버튼
```typescript
const handleGoogleLogin = () => {
  window.location.href = 'http://localhost:3000/auth/google';
};

const handleGitHubLogin = () => {
  window.location.href = 'http://localhost:3000/auth/github';
};
```

### 2. 콜백 페이지 처리
```typescript
// /auth/callback 페이지
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get('accessToken');
  const refreshToken = params.get('refreshToken');
  const error = params.get('error');
  const provider = params.get('provider');

  if (error) {
    // 에러 처리
    console.error('OAuth 로그인 실패:', error);
    navigate('/login?error=' + error);
    return;
  }

  if (accessToken && refreshToken) {
    // 토큰 저장
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    // 메인 페이지로 이동
    navigate('/');
  }
}, []);
```

## 보안 고려사항

1. **HTTPS 사용 필수**: 프로덕션 환경에서는 반드시 HTTPS를 사용해야 합니다.
2. **State 파라미터**: CSRF 공격 방지를 위해 OAuth state 파라미터를 사용합니다 (Passport가 자동 처리).
3. **토큰 저장**: Access Token은 메모리에, Refresh Token은 HttpOnly 쿠키에 저장하는 것을 권장합니다.
4. **CORS 설정**: 프론트엔드 도메인을 CORS 허용 목록에 추가해야 합니다.
5. **Callback URL 검증**: OAuth Provider 콘솔에 등록된 Callback URL만 허용됩니다.