# Triad 협업 시스템 - 전체 시퀀스 다이어그램

## 개요

이 문서는 Triad 실시간 웹 협업 도구의 전체 데이터 흐름을 시퀀스 다이어그램으로 설명합니다.
Chrome Extension 클라이언트부터 MySQL 데이터베이스까지의 완전한 통신 흐름을 포함합니다.

## 시스템 구성 요소

- **Chrome Extension (Client)**: 웹페이지에 주입되는 클라이언트
- **CollaborationGateway (WebSocket)**: Socket.io 기반 실시간 통신
- **CollaborationController (REST API)**: HTTP 기반 API 엔드포인트
- **CollaborationService (Business Logic)**: 비즈니스 로직 처리
- **MouseTrackingService**: 마우스 추적 및 성능 최적화
- **CommentService**: 코멘트 관련 로직
- **MySQL Database**: 데이터 영속성

---

## 1️⃣ 초기 연결 및 세션 참가 흐름

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

---

## 2️⃣ 실시간 커서 동기화 흐름

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

---

## 3️⃣ 코멘트 생성 및 실시간 동기화 흐름

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

## 4️⃣ 클릭 이벤트 및 활동 추적 흐름

```mermaid
sequenceDiagram
    participant CE1 as User1<br/>(Chrome Extension)
    participant GW as CollaborationGateway<br/>(WebSocket)
    participant CC as CollaborationController<br/>(REST API)
    participant CS as CollaborationService<br/>(Business Logic)
    participant CE2 as User2<br/>(Chrome Extension)
    participant DB as MySQL Database

    Note over CE1,DB: 클릭 이벤트 실시간 공유
    CE1->>GW: 'cursor:click' { url, x, y, clickType, targetElement }
    GW->>GW: 같은 URL 세션의 다른 사용자들 찾기
    GW->>CE2: 'cursor:clicked' { userId, x, y, clickType, color }
    CE2->>CE2: 클릭 위치에 리플 애니메이션 표시

    Note over CE1,DB: 마우스 클릭 데이터 저장 (분석용)
    CE1->>CC: POST /collaboration/projects/{projectId}/mouse-click
    CC->>CS: recordMouseClick()
    CS->>DB: Mutation 테이블에 클릭 이벤트 저장
    CC-->>CE1: 204 No Content

    Note over CE1,DB: 사용자 활동 상태 업데이트
    CE1->>CC: PATCH /collaboration/projects/{projectId}/activity
    CC->>CS: updateUserActivity()
    CS->>DB: ProjectSession.lastActivity 업데이트
    CS->>GW: EventEmitter로 활동 상태 브로드캐스트
    GW->>CE2: 'user:activity' { userId, status: 'active' }
```

---

## 5️⃣ 세션 종료 흐름

```mermaid
sequenceDiagram
    participant CE as Chrome Extension<br/>(Client)
    participant GW as CollaborationGateway<br/>(WebSocket)
    participant CC as CollaborationController<br/>(REST API)
    participant CS as CollaborationService<br/>(Business Logic)
    participant DB as MySQL Database

    Note over CE,DB: WebSocket을 통한 페이지 퇴장
    CE->>GW: 'page:leave' { url }
    GW->>GW: 세션 Map에서 사용자 제거
    GW->>CE: 다른 사용자들에게 'user-left' 브로드캐스트

    Note over CE,DB: REST API를 통한 프로젝트 퇴장
    CE->>CC: DELETE /collaboration/projects/{projectId}/leave
    CC->>CS: leaveProject()
    CS->>DB: ProjectSession.isActive = false 업데이트
    CC-->>CE: 204 No Content

    Note over CE,DB: WebSocket 연결 종료
    CE->>GW: WebSocket 연결 해제
    GW->>GW: handleDisconnect() - 모든 세션에서 사용자 정리
    GW->>CE: 다른 사용자들에게 'user-disconnected' 브로드캐스트
```

---

## 🔑 핵심 아키텍처 특징

### 이중 통신 구조

- **WebSocket (실시간)**: 커서 이동, 클릭, 코멘트 등 즉시 동기화가 필요한 이벤트
- **REST API (안정성)**: 데이터 저장, 조회, 세션 관리 등 신뢰성이 중요한 작업

### 성능 최적화

- **쓰로틀링**: MouseTrackingService에서 50ms 간격으로 커서 이벤트 제한
- **배치 처리**: 여러 마우스 좌표를 한번에 전송하여 네트워크 부하 감소
- **이벤트 기반**: EventEmitter로 서비스 간 느슨한 결합

### 상태 관리

- **다중 Map 구조**: URL, 사용자, 소켓, 프로젝트 간의 매핑 관계 효율적 관리
- **세션 동기화**: WebSocket과 REST API 모두에서 동일한 세션 상태 유지

### URL 기반 프로젝트 관리

- URL을 해시하여 고유한 프로젝트 ID 자동 생성
- 같은 URL에 접속한 사용자끼리 자동으로 협업 세션 형성

---

## 📡 주요 이벤트 목록

### 클라이언트 → 서버 이벤트

| 이벤트명                       | 전송 방식 | 설명                  | 페이로드                                  |
| ------------------------------ | --------- | --------------------- | ----------------------------------------- |
| `page:join`                    | WebSocket | 페이지 협업 세션 참가 | `{ url, title }`                          |
| `page:leave`                   | WebSocket | 페이지 협업 세션 퇴장 | `{ url }`                                 |
| `cursor:move`                  | WebSocket | 마우스 커서 이동      | `{ url, x, y, viewport }`                 |
| `cursor:click`                 | WebSocket | 마우스 클릭 이벤트    | `{ url, x, y, clickType, targetElement }` |
| `comment:create`               | WebSocket | 코멘트 생성           | `{ url, content, position, xpath }`       |
| `POST /projects/{id}/join`     | REST API  | 프로젝트 세션 참가    | `JoinProjectDto`                          |
| `POST /projects/{id}/cursor`   | REST API  | 커서 위치 업데이트    | `UpdateCursorDto`                         |
| `POST /projects/{id}/comments` | REST API  | 코멘트 생성           | `CreateCommentRequestDto`                 |

### 서버 → 클라이언트 이벤트

| 이벤트명          | 전송 방식 | 설명                      | 페이로드                            |
| ----------------- | --------- | ------------------------- | ----------------------------------- |
| `connected`       | WebSocket | 연결 성공                 | `{ userId, username, message }`     |
| `page:joined`     | WebSocket | 세션 참가 완료            | `{ url, users, cursors, comments }` |
| `user-joined`     | WebSocket | 새 사용자 참가            | `{ userId, username, avatar }`      |
| `user-left`       | WebSocket | 사용자 퇴장               | `{ userId, username }`              |
| `cursor:update`   | WebSocket | 다른 사용자 커서 업데이트 | `{ userId, username, x, y, color }` |
| `cursor:clicked`  | WebSocket | 다른 사용자 클릭          | `{ userId, x, y, clickType }`       |
| `comment:created` | WebSocket | 새 코멘트 생성됨          | `{ comment }`                       |
| `cursor:trail`    | WebSocket | 마우스 궤적 데이터        | `{ userId, trail }`                 |

---

## 🗄️ 데이터베이스 스키마

### 주요 테이블

- **projects**: URL 기반 프로젝트 정보
- **project_sessions**: 사용자별 세션 상태
- **comment_threads**: 코멘트 스레드 (위치 기반)
- **comments**: 개별 코멘트
- **mutations**: 실시간 변경 이벤트 로그

### 관계도

```
Project (1) ──── (N) ProjectSession ──── (1) User
   │
   └── (1) ──── (N) CommentThread ──── (N) Comment ──── (1) User
   │
   └── (1) ──── (N) Mutation
```

---

## 🚀 확장 가능성

이 시스템은 다음과 같은 기능들을 쉽게 추가할 수 있도록 설계되었습니다:

1. **선택 영역 공유**: 텍스트 선택 실시간 동기화
2. **스크롤 동기화**: 스크롤 위치 공유
3. **화면 공유**: 특정 영역 하이라이트
4. **음성 채팅**: WebRTC 통합
5. **화이트보드**: 드로잉 기능
6. **파일 공유**: 드래그 앤 드롭 파일 공유

---

_이 문서는 Triad 협업 시스템의 전체 아키텍처를 이해하기 위한 참고 자료입니다._
