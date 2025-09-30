# Swagger API 문서 - 시퀀스 다이어그램 모음

이 문서는 Swagger API 문서에 표시될 모든 시퀀스 다이어그램을 포함합니다.

---

## 협업 시스템 시퀀스 다이어그램

### 1. 초기 연결 및 세션 참가 흐름

```mermaid
sequenceDiagram
    participant CE as Chrome Extension<br/>(Client)
    participant GW as CollaborationGateway<br/>(WebSocket)
    participant CC as CollaborationController<br/>(REST API)
    participant CS as CollaborationService<br/>(Business Logic)
    participant DB as MySQL Database

    Note over CE,DB: 1. 초기 연결 및 인증
    CE->>GW: WebSocket 연결 + JWT 토큰
    GW->>GW: JWT 토큰 검증
    GW->>CE: 'connected' 이벤트

    Note over CE,DB: 2. 프로젝트 세션 참가 (REST)
    CE->>CC: POST /collaboration/projects/{projectId}/join
    CC->>CS: joinProject(projectId, userId, userInfo)
    CS->>DB: Project 테이블에서 프로젝트 조회/생성
    CS->>DB: ProjectSession 테이블에 세션 생성
    CS-->>CC: JoinProjectResponseDto
    CC-->>CE: 200 OK + 세션 정보

    Note over CE,DB: 3. WebSocket 페이지 참가
    CE->>GW: 'page:join' { url, title }
    GW->>CS: urlToProjectId(url) - URL을 프로젝트ID로 변환
    GW->>GW: 세션 Map에 사용자 추가
    GW->>CE: 'page:joined' { users, cursors, comments }
    GW->>CE: 다른 사용자들에게 'user-joined' 브로드캐스트
```

### 2. 실시간 커서 동기화 흐름

```mermaid
sequenceDiagram
    participant CE1 as User1<br/>(Chrome Extension)
    participant GW as CollaborationGateway<br/>(WebSocket)
    participant CC as CollaborationController<br/>(REST API)
    participant CS as CollaborationService<br/>(Business Logic)
    participant MT as MouseTrackingService<br/>(Optimization)
    participant CE2 as User2<br/>(Chrome Extension)
    participant DB as MySQL Database

    Note over CE1,DB: Option A: WebSocket을 통한 실시간 전송 (주로 사용)
    CE1->>GW: 'cursor:move' { url, x, y, viewport }
    GW->>CS: updateCursorPosition()
    CS->>MT: updateMousePosition() - 쓰로틀링 적용
    MT->>MT: 50ms 쓰로틀링 체크
    MT->>GW: EventEmitter 'cursor.move' 이벤트
    GW->>CE2: 'cursor:update' { userId, x, y, color }
    CE2->>CE2: 화면에 다른 사용자 커서 렌더링

    Note over CE1,DB: Option B: REST API를 통한 전송 (필요시)
    CE1->>CC: POST /collaboration/projects/{projectId}/cursor
    CC->>CS: updateCursorPosition()
    CS->>DB: ProjectSession 테이블 업데이트
    CS->>MT: updateMousePosition()
    MT->>GW: EventEmitter로 WebSocket 브로드캐스트
    CC-->>CE1: 204 No Content

    Note over CE1,DB: 배치 처리 (성능 최적화)
    CE1->>CC: POST /collaboration/projects/{projectId}/cursor/batch
    CC->>CS: updateMouseBatch() - 여러 좌표 한번에
    CS->>MT: 배치 처리
    MT->>GW: 'cursor.trail' 이벤트
    GW->>CE2: 'cursor:trail' 마우스 궤적 데이터
```

### 3. 코멘트 생성 및 실시간 동기화 흐름

```mermaid
sequenceDiagram
    participant CE1 as User1<br/>(Chrome Extension)
    participant GW as CollaborationGateway<br/>(WebSocket)
    participant CC as CollaborationController<br/>(REST API)
    participant CS as CollaborationService<br/>(Business Logic)
    participant CmS as CommentService<br/>(Comment Logic)
    participant CE2 as User2<br/>(Chrome Extension)
    participant DB as MySQL Database

    Note over CE1,DB: Option A: WebSocket을 통한 코멘트 생성 (실시간)
    CE1->>GW: 'comment:create' { url, content, position, xpath }
    GW->>CS: createCommentThread()
    CS->>DB: CommentThread 테이블에 스레드 생성
    CS->>CmS: createComment()
    CmS->>DB: Comment 테이블에 코멘트 저장
    CS-->>GW: 생성된 코멘트 데이터
    GW->>CE1: 'comment:created' (본인 확인용)
    GW->>CE2: 'comment:created' (다른 사용자들에게 브로드캐스트)
    CE2->>CE2: 코멘트 UI 렌더링

    Note over CE1,DB: Option B: REST API를 통한 코멘트 생성
    CE1->>CC: POST /collaboration/projects/{projectId}/comments
    CC->>CS: createComment()
    CS->>DB: CommentThread + Comment 생성
    CS->>GW: EventEmitter로 실시간 브로드캐스트
    GW->>CE2: 'comment:created' WebSocket 이벤트
    CC-->>CE1: 201 Created + CommentResponseDto

    Note over CE1,DB: 코멘트 목록 조회 (초기 로딩)
    CE1->>CC: GET /collaboration/projects/{projectId}/comments
    CC->>CS: getProjectComments()
    CS->>DB: Comment 테이블 조회 (JOIN CommentThread)
    CS-->>CC: Comment[] 배열
    CC-->>CE1: 200 OK + 코멘트 목록
```

---

## OAuth 인증 시퀀스 다이어그램

### 1. Google OAuth 로그인 흐름

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

### 2. GitHub OAuth 로그인 흐름

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

### 3. OAuth 사용자 생성/연동 상세 흐름

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

### 4. OAuth 에러 처리 흐름

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

---

## 주요 API 엔드포인트

### 협업 시스템 엔드포인트

| 메서드 | 엔드포인트                                      | 설명                  | 인증 필요 |
| ------ | ----------------------------------------------- | --------------------- | --------- |
| POST   | `/collaboration/projects/:projectId/join`       | 프로젝트 세션 참가    | ✅        |
| DELETE | `/collaboration/projects/:projectId/leave`      | 프로젝트 세션 퇴장    | ✅        |
| POST   | `/collaboration/projects/:projectId/cursor`     | 커서 위치 업데이트    | ✅        |
| POST   | `/collaboration/projects/:projectId/comments`   | 코멘트 생성           | ✅        |
| GET    | `/collaboration/projects/:projectId/comments`   | 코멘트 목록 조회      | ✅        |
| POST   | `/collaboration/projects/:projectId/mutations`  | Mutation 데이터 저장  | ✅        |
| GET    | `/collaboration/projects/:projectId/sessions`   | 활성 세션 목록 조회   | ✅        |
| PATCH  | `/collaboration/projects/:projectId/activity`   | 사용자 활동 상태 갱신 | ✅        |
| POST   | `/collaboration/projects/:projectId/mouse-click`| 마우스 클릭 이벤트    | ✅        |

### OAuth 인증 엔드포인트

| 메서드 | 엔드포인트              | 설명                       | 인증 필요 |
| ------ | ----------------------- | -------------------------- | --------- |
| GET    | `/auth/google`          | Google OAuth 로그인 시작   | ❌        |
| GET    | `/auth/google/callback` | Google OAuth 콜백 처리     | ❌        |
| GET    | `/auth/github`          | GitHub OAuth 로그인 시작   | ❌        |
| GET    | `/auth/github/callback` | GitHub OAuth 콜백 처리     | ❌        |
| POST   | `/auth/register`        | 일반 회원가입              | ❌        |
| POST   | `/auth/login`           | 일반 로그인                | ❌        |
| POST   | `/auth/logout`          | 로그아웃                   | ✅        |
| POST   | `/auth/refresh`         | Access Token 갱신          | ❌        |

---

## WebSocket 이벤트

### 클라이언트 → 서버

| 이벤트명         | 설명                  | 페이로드                                  |
| ---------------- | --------------------- | ----------------------------------------- |
| `page:join`      | 페이지 협업 세션 참가 | `{ url, title }`                          |
| `page:leave`     | 페이지 협업 세션 퇴장 | `{ url }`                                 |
| `cursor:move`    | 마우스 커서 이동      | `{ url, x, y, viewport }`                 |
| `cursor:click`   | 마우스 클릭 이벤트    | `{ url, x, y, clickType, targetElement }` |
| `comment:create` | 코멘트 생성           | `{ url, content, position, xpath }`       |

### 서버 → 클라이언트

| 이벤트명          | 설명                      | 페이로드                            |
| ----------------- | ------------------------- | ----------------------------------- |
| `connected`       | 연결 성공                 | `{ userId, username, message }`     |
| `page:joined`     | 세션 참가 완료            | `{ url, users, cursors, comments }` |
| `user-joined`     | 새 사용자 참가            | `{ userId, username, avatar }`      |
| `user-left`       | 사용자 퇴장               | `{ userId, username }`              |
| `cursor:update`   | 다른 사용자 커서 업데이트 | `{ userId, username, x, y, color }` |
| `cursor:clicked`  | 다른 사용자 클릭          | `{ userId, x, y, clickType }`       |
| `comment:created` | 새 코멘트 생성됨          | `{ comment }`                       |
| `cursor:trail`    | 마우스 궤적 데이터        | `{ userId, trail }`                 |

---

_이 다이어그램들은 Swagger API 문서에 자동으로 통합되어 표시됩니다._