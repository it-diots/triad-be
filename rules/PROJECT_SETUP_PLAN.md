# 웹 개발 협업 툴 프로젝트 설정 계획

## 프로젝트 개요
피그마와 같은 실시간 협업 기능을 제공하는 웹 개발 협업 툴. 웹페이지 위에 오버레이로 다른 사용자들의 커서 위치를 표시하고, 특정 요소나 좌표에 코멘트를 달 수 있는 시스템.

## 기술 스택
- **Backend**: NestJS (TypeScript)
- **Real-time Communication**: Socket.io
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT + Passport
- **Validation**: class-validator, class-transformer

## 프로젝트 구조

```
triad-be/
├── src/
│   ├── auth/                    # 인증 관련 모듈
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── strategies/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── users/                   # 사용자 관리 모듈
│   │   ├── entities/
│   │   ├── dto/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   ├── collaboration/           # 협업 기능 모듈
│   │   ├── gateways/           # Socket.io 게이트웨이
│   │   ├── dto/
│   │   ├── services/
│   │   └── collaboration.module.ts
│   ├── comments/                # 코멘트 기능 모듈
│   │   ├── entities/
│   │   ├── dto/
│   │   ├── comments.controller.ts
│   │   ├── comments.service.ts
│   │   └── comments.module.ts
│   ├── projects/                # 프로젝트 관리 모듈
│   │   ├── entities/
│   │   ├── dto/
│   │   ├── projects.controller.ts
│   │   ├── projects.service.ts
│   │   └── projects.module.ts
│   ├── common/                  # 공통 유틸리티
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   └── pipes/
│   ├── config/                  # 설정 파일
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   └── socket.config.ts
│   ├── app.module.ts
│   └── main.ts
├── test/                        # 테스트 파일
├── .env.example
├── .gitignore
├── nest-cli.json
├── package.json
├── tsconfig.json
└── README.md
```

## 단계별 구현 계획

### Phase 1: 프로젝트 초기 설정 (Day 1)

#### 1.1 NestJS 프로젝트 생성
```bash
npm i -g @nestjs/cli
nest new triad-be
cd triad-be
```

#### 1.2 필수 패키지 설치
```bash
# Database & ORM
npm install @nestjs/typeorm typeorm pg

# Authentication
npm install @nestjs/passport passport passport-jwt @nestjs/jwt
npm install bcrypt
npm install -D @types/bcrypt

# Socket.io
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io

# Validation
npm install class-validator class-transformer

# Configuration
npm install @nestjs/config joi

# Dev dependencies
npm install -D @types/passport-jwt
```

#### 1.3 환경 변수 설정
`.env` 파일 생성:
```env
# Application
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=triad_db

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=7d

# Socket.io
SOCKET_PORT=3001
```

### Phase 2: 데이터베이스 설정 (Day 1-2)

#### 2.1 TypeORM 설정
```typescript
// src/config/database.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
});
```

#### 2.2 기본 엔티티 설계
```typescript
// User Entity
- id: UUID
- email: string (unique)
- password: string (hashed)
- username: string
- avatar?: string
- createdAt: Date
- updatedAt: Date

// Project Entity
- id: UUID
- name: string
- description?: string
- url: string
- ownerId: UUID (User)
- createdAt: Date
- updatedAt: Date

// Comment Entity
- id: UUID
- content: string
- x: number
- y: number
- elementSelector?: string
- projectId: UUID
- userId: UUID
- createdAt: Date
- updatedAt: Date
```

### Phase 3: 인증 시스템 구현 (Day 2-3)

#### 3.1 Auth 모듈 구조
- **회원가입** (`POST /auth/register`)
  - 이메일 중복 체크
  - 비밀번호 해싱 (bcrypt)
  - 사용자 생성

- **로그인** (`POST /auth/login`)
  - 이메일/비밀번호 검증
  - JWT 토큰 발급
  - Refresh Token 구현 (선택사항)

- **프로필 조회** (`GET /auth/profile`)
  - JWT 검증
  - 사용자 정보 반환

#### 3.2 JWT Strategy 구현
```typescript
// src/auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}
```

### Phase 4: Socket.io 기초 설정 (Day 3-4)

#### 4.1 Gateway 구현
```typescript
// src/collaboration/gateways/collaboration.gateway.ts
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class CollaborationGateway {
  @WebSocketServer()
  server: Server;

  // 연결 처리
  handleConnection(client: Socket)
  
  // 연결 해제 처리
  handleDisconnect(client: Socket)
  
  // 방 참가 (프로젝트별)
  @SubscribeMessage('join-project')
  handleJoinProject(client: Socket, projectId: string)
  
  // 커서 위치 업데이트
  @SubscribeMessage('cursor-move')
  handleCursorMove(client: Socket, data: CursorPosition)
  
  // 코멘트 생성
  @SubscribeMessage('comment-create')
  handleCommentCreate(client: Socket, data: CommentData)
}
```

#### 4.2 Socket 인증 미들웨어
- JWT 토큰 검증
- 사용자 정보를 Socket 객체에 추가
- 권한 검증

## 개발 환경 설정

### Docker Compose (개발용)
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: triad_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 개발 스크립트
```json
// package.json scripts
{
  "scripts": {
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "db:up": "docker-compose up -d",
    "db:down": "docker-compose down"
  }
}
```

## API 엔드포인트 명세

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /auth/register | 회원가입 | No |
| POST | /auth/login | 로그인 | No |
| GET | /auth/profile | 프로필 조회 | Yes |
| POST | /auth/refresh | 토큰 갱신 | Yes |
| POST | /auth/logout | 로그아웃 | Yes |

### Socket Events
| Event Name | Direction | Description | Data |
|------------|-----------|-------------|------|
| connection | Server→Client | 연결 성공 | userId, socketId |
| join-project | Client→Server | 프로젝트 참가 | projectId |
| leave-project | Client→Server | 프로젝트 나가기 | projectId |
| cursor-move | Client↔Server | 커서 이동 | x, y, userId |
| comment-create | Client↔Server | 코멘트 생성 | content, x, y, elementSelector |
| user-joined | Server→Client | 사용자 참가 알림 | userId, username |
| user-left | Server→Client | 사용자 나감 알림 | userId |

## 테스트 전략

### Unit Tests
- Service 레이어 비즈니스 로직
- Guards와 Strategies
- DTO validation

### E2E Tests
- Authentication flow
- Socket.io connection과 이벤트
- API 엔드포인트 통합 테스트

## 성공 지표

### Phase 1-4 완료 체크리스트
- [ ] NestJS 프로젝트 생성 및 구조 설정
- [ ] PostgreSQL 데이터베이스 연결
- [ ] User, Project, Comment 엔티티 생성
- [ ] JWT 기반 인증 시스템 구현
- [ ] 회원가입/로그인 API 동작
- [ ] Socket.io 연결 설정
- [ ] 기본 실시간 이벤트 처리 (연결/해제)
- [ ] 프로젝트별 Room 관리
- [ ] 커서 위치 실시간 공유
- [ ] 코멘트 생성 이벤트 처리

## 다음 단계 (Phase 5+)

1. **고급 협업 기능**
   - 실시간 선택 영역 하이라이트
   - 음성/비디오 채팅
   - 화면 녹화 및 재생

2. **성능 최적화**
   - Redis를 이용한 세션 관리
   - WebSocket 클러스터링
   - 메시지 큐 (Bull)

3. **보안 강화**
   - Rate limiting
   - CORS 세밀한 설정
   - SQL Injection 방지

4. **모니터링**
   - 로깅 시스템 (Winston)
   - APM (Application Performance Monitoring)
   - 에러 트래킹 (Sentry)