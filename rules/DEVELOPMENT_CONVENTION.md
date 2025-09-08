# 개발 컨벤션 가이드

## 개요
NestJS TypeScript 프로젝트의 일관된 개발 패턴과 코드 작성 규칙을 정의합니다.

## ⚠️ 핵심 원칙

### TypeScript 엄격 모드
- **`any` 타입 절대 사용 금지** - 모든 타입은 명시적으로 정의
- `tsconfig.json`의 `strict: true` 항상 유지
- 타입 추론이 불가능한 경우 명시적 타입 선언 필수
- `unknown` 또는 `Record<string, unknown>` 사용 권장

### 주석 작성 규칙
- **모든 주석은 한글로 작성**
- 복잡한 비즈니스 로직에 설명 추가
- TODO/FIXME 주석 형식 준수
```typescript
// ✅ 올바른 예시
// 사용자 인증 토큰 검증
const validateToken = (token: string): boolean => {
  // JWT 토큰 형식 확인
  return token.startsWith('Bearer ');
};

// ❌ 잘못된 예시
// Validate user authentication token (영어 사용 금지)
const validateToken = (token: any): any => { // any 타입 사용 금지
  return token.startsWith('Bearer ');
};
```

### 코드 품질 검증 프로세스
작업 완료 후 반드시 다음 명령어를 순차적으로 실행하여 에러 확인:

1. **린트 검사**: `npm run lint`
2. **타입 체크**: `npm run typecheck`
3. **빌드 실행**: `npm run build`
4. **테스트 실행**: `npm test`
5. **개발 서버 실행**: `npm run start:dev`

**하나라도 실패 시 반드시 수정 후 재검증**

## Import 구조 및 순서

### Import 정렬 규칙 (ESLint 자동 정렬)
```typescript
// 1. Node.js 내장 모듈
import { readFile } from 'fs/promises';
import { join } from 'path';

// 2. 외부 라이브러리
import { Injectable, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

// 3. 내부 공통 모듈 (절대 경로)
import { CommonService } from '@/common/common.service';
import { DatabaseService } from '@/database/database.service';

// 4. 같은 모듈 스코프 (상대 경로)
import { AuthService } from '../auth.service';
import { UserEntity } from './entities/user.entity';

// 5. 타입 정의
import type { JwtPayload } from './types';
import type { UserProfile } from './interfaces';
```

**각 그룹 사이에 빈 줄 추가 필수**

## 프로젝트 구조

### 모듈 구조
```
src/
└── [module-name]/
    ├── dto/                    # Data Transfer Objects
    │   ├── create-[name].dto.ts
    │   ├── update-[name].dto.ts
    │   └── [name]-response.dto.ts
    ├── entities/               # TypeORM Entities
    │   └── [name].entity.ts
    ├── interfaces/            # TypeScript Interfaces
    │   └── [name].interface.ts
    ├── guards/                # Guards (인증/인가)
    │   └── [name].guard.ts
    ├── decorators/            # Custom Decorators
    │   └── [name].decorator.ts
    ├── pipes/                 # Pipes (변환/검증)
    │   └── [name].pipe.ts
    ├── filters/               # Exception Filters
    │   └── [name].filter.ts
    ├── [name].controller.ts   # Controller
    ├── [name].service.ts      # Business Logic
    ├── [name].repository.ts   # Data Access Layer (선택)
    ├── [name].module.ts       # Module Definition
    └── tests/                 # Test Files
        ├── [name].service.spec.ts
        ├── [name].controller.spec.ts
        └── [name].e2e-spec.ts
```

## 네이밍 컨벤션

### 파일 네이밍

| 타입 | 규칙 | 예시 |
|------|------|------|
| **Class** | PascalCase + 접미사 | `UserController`, `AuthService` |
| **Interface** | PascalCase + I 접두사 없음 | `UserProfile`, `AuthToken` |
| **Type** | PascalCase | `UserRole`, `TokenPayload` |
| **Enum** | PascalCase | `UserStatus`, `ErrorCode` |
| **File** | kebab-case | `user-profile.dto.ts`, `auth.service.ts` |
| **Folder** | kebab-case | `user-management`, `auth` |
| **Test** | *.spec.ts 또는 *.e2e-spec.ts | `user.service.spec.ts` |

### 변수 네이밍

```typescript
// 상수: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';

// 변수: camelCase
const userProfile = await this.userService.findOne(id);
const isAuthenticated = false;

// 불린: is/has/can 접두사
const isActive = true;
const hasPermission = false;
const canEdit = true;

// 배열: 복수형
const users = [];
const permissions = [];

// 함수/메서드: 동사로 시작
function getUserById(id: string) {}
function calculateTotal(items: Item[]) {}
function validateEmail(email: string) {}

// Private 멤버: _ 접두사 (선택적)
private _cache: Map<string, any>;
private _isInitialized: boolean;
```

## TypeScript 규칙

### 타입 정의

```typescript
// 좋은 예: 명시적 타입 정의
interface CreateUserDto {
  email: string;
  password: string;
  username: string;
  role?: UserRole;
}

function processUser(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
  };
}

// 나쁜 예: any 타입 사용
function processData(data: any): any {
  return data;
}
```

### 엄격한 타입 체크

```typescript
// Null/Undefined 체크
function getUser(id: string): User | null {
  const user = this.users.find(u => u.id === id);
  return user ?? null;
}

// Optional Chaining
const userName = user?.profile?.name ?? 'Unknown';

// Type Guards
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj
  );
}

// Discriminated Unions
type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

function handleResult<T>(result: Result<T>): T {
  if (result.success) {
    return result.data;
  }
  throw new Error(result.error);
}
```

### Enum vs Union Types

```typescript
// Enum 사용: 관련된 상수 집합
enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

// Union Type 사용: 간단한 문자열 리터럴
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
type Environment = 'development' | 'staging' | 'production';
```

## NestJS 패턴

### Controller

```typescript
@Controller('users')
@ApiTags('Users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: Logger,
  ) {}

  @Get()
  @ApiOperation({ summary: '모든 사용자 조회' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  async findAll(
    @Query() query: PaginationDto,
  ): Promise<PaginatedResponse<UserResponseDto>> {
    this.logger.log('Finding all users', { query });
    return this.userService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '사용자 조회' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    const user = await this.userService.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @Post()
  @ApiOperation({ summary: '사용자 생성' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.create(createUserDto);
  }
}
```

### Service

```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
    private readonly cacheManager: Cache,
  ) {}

  async findAll(
    query: PaginationDto,
  ): Promise<PaginatedResponse<UserResponseDto>> {
    const cacheKey = `users:${JSON.stringify(query)}`;
    const cached = await this.cacheManager.get<PaginatedResponse<UserResponseDto>>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const [users, total] = await this.userRepository.findAndCount({
      skip: query.offset,
      take: query.limit,
      order: { createdAt: 'DESC' },
    });

    const response = {
      data: users.map(user => this.toResponseDto(user)),
      total,
      offset: query.offset,
      limit: query.limit,
    };

    await this.cacheManager.set(cacheKey, response, 300);
    
    return response;
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const user = this.userRepository.create(dto);
    
    try {
      const savedUser = await this.userRepository.save(user);
      
      this.eventEmitter.emit('user.created', {
        userId: savedUser.id,
        email: savedUser.email,
      });
      
      return this.toResponseDto(savedUser);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  private toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
```

### DTO (Data Transfer Object)

```typescript
// create-user.dto.ts
export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(50)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'Password must contain uppercase, lowercase, number and special character',
    },
  )
  password: string;

  @ApiProperty({ example: 'JohnDoe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username can only contain letters, numbers, underscores and hyphens',
  })
  username: string;

  @ApiProperty({ enum: UserRole, required: false })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}

// update-user.dto.ts
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {}

// user-response.dto.ts
export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
```

### Entity

```typescript
@Entity('users')
@Index(['email'], { unique: true })
@Index(['username'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude()
  password: string;

  @Column({ type: 'varchar', length: 50 })
  username: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @ManyToMany(() => Project, (project) => project.users)
  @JoinTable()
  projects: Project[];

  @BeforeInsert()
  async hashPassword(): Promise<void> {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
```

## 에러 처리

### Custom Exception

```typescript
export class BusinessException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly code?: string,
  ) {
    super(
      {
        statusCode,
        message,
        code,
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
  }
}

// 사용
throw new BusinessException(
  'Insufficient balance',
  HttpStatus.BAD_REQUEST,
  'INSUFFICIENT_BALANCE',
);
```

### Global Exception Filter

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object') {
        message = exceptionResponse['message'] || message;
        code = exceptionResponse['code'] || code;
      } else {
        message = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      
      this.logger.error(
        `Unhandled exception: ${message}`,
        exception.stack,
        'ExceptionFilter',
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      code,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    });
  }
}
```

## 테스트 규칙

### Unit Test

```typescript
describe('UserService', () => {
  let service: UserService;
  let repository: MockRepository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get(getRepositoryToken(User));
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      const userId = 'test-id';
      const expectedUser = createMockUser({ id: userId });
      
      repository.findOne.mockResolvedValue(expectedUser);
      
      const result = await service.findOne(userId);
      
      expect(result).toEqual(expectedUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should return null if user not found', async () => {
      repository.findOne.mockResolvedValue(null);
      
      const result = await service.findOne('non-existent');
      
      expect(result).toBeNull();
    });
  });
});
```

### E2E Test

```typescript
describe('UserController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users (GET)', () => {
    it('should return an array of users', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('/users (POST)', () => {
    it('should create a new user', () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'Password123!',
        username: 'testuser',
      };

      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', 'Bearer valid-token')
        .send(createUserDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe(createUserDto.email);
        });
    });

    it('should return 400 for invalid email', () => {
      const invalidDto = {
        email: 'invalid-email',
        password: 'Password123!',
        username: 'testuser',
      };

      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidDto)
        .expect(400);
    });
  });
});
```

## 보안 규칙

### 환경 변수

```typescript
// config/app.config.ts
import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  environment: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api',
}));

// Validation Schema
export const configValidationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required().min(32),
  JWT_EXPIRATION: Joi.string().default('7d'),
});
```

### 입력 검증

```typescript
// 항상 ValidationPipe 사용
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // DTO에 없는 속성 제거
    forbidNonWhitelisted: true, // DTO에 없는 속성 있으면 에러
    transform: true,            // 타입 자동 변환
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);

// SQL Injection 방지
const users = await this.userRepository
  .createQueryBuilder('user')
  .where('user.email = :email', { email: userEmail })
  .getMany();

// XSS 방지
import * as sanitizeHtml from 'sanitize-html';

const cleanContent = sanitizeHtml(userInput, {
  allowedTags: ['b', 'i', 'em', 'strong'],
  allowedAttributes: {},
});
```

## 로깅

```typescript
// 로깅 레벨
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  VERBOSE = 4,
}

// Logger 사용
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  async createUser(dto: CreateUserDto): Promise<User> {
    this.logger.debug('Creating user', { email: dto.email });
    
    try {
      const user = await this.userRepository.save(dto);
      this.logger.log('User created successfully', { userId: user.id });
      return user;
    } catch (error) {
      this.logger.error('Failed to create user', error.stack, { dto });
      throw error;
    }
  }
}

// 구조화된 로깅
this.logger.log({
  message: 'User action performed',
  userId: user.id,
  action: 'LOGIN',
  timestamp: new Date().toISOString(),
  metadata: {
    ip: request.ip,
    userAgent: request.headers['user-agent'],
  },
});
```

## 성능 최적화

### 데이터베이스 쿼리

```typescript
// 좋은 예: 필요한 관계만 로드
const user = await this.userRepository.findOne({
  where: { id },
  relations: ['profile'],
  select: ['id', 'email', 'username'],
});

// 나쁜 예: 모든 관계 로드
const user = await this.userRepository.findOne({
  where: { id },
  relations: ['profile', 'posts', 'comments', 'likes'],
});

// QueryBuilder 사용
const users = await this.userRepository
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.profile', 'profile')
  .where('user.isActive = :isActive', { isActive: true })
  .orderBy('user.createdAt', 'DESC')
  .limit(10)
  .cache(60000) // 1분 캐싱
  .getMany();
```

### 캐싱

```typescript
@Injectable()
export class UserService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getUser(id: string): Promise<User> {
    const cacheKey = `user:${id}`;
    
    // 캐시 확인
    const cached = await this.cacheManager.get<User>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // DB 조회
    const user = await this.userRepository.findOne({ where: { id } });
    
    // 캐시 저장 (TTL: 5분)
    if (user) {
      await this.cacheManager.set(cacheKey, user, 300);
    }
    
    return user;
  }

  // 캐시 무효화
  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.save({ id, ...dto });
    await this.cacheManager.del(`user:${id}`);
    return user;
  }
}
```

## 문서화

### API 문서 (Swagger)

```typescript
// main.ts
const config = new DocumentBuilder()
  .setTitle('Triad API')
  .setDescription('Web collaboration tool API')
  .setVersion('1.0')
  .addBearerAuth()
  .addTag('Auth', 'Authentication endpoints')
  .addTag('Users', 'User management endpoints')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);

// Controller 문서화
@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  @Get(':id')
  @ApiOperation({ 
    summary: 'Get user by ID',
    description: 'Retrieves a single user by their unique identifier',
  })
  @ApiParam({ 
    name: 'id', 
    type: 'string', 
    format: 'uuid',
    description: 'User unique identifier',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User found',
    type: UserResponseDto,
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found',
  })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    // ...
  }
}
```

### 코드 주석

```typescript
/**
 * 사용자 인증 서비스
 * JWT 기반 인증 및 권한 관리를 담당
 */
@Injectable()
export class AuthService {
  /**
   * 사용자 로그인 처리
   * @param credentials - 로그인 자격 증명 (이메일, 비밀번호)
   * @returns JWT 액세스 토큰과 리프레시 토큰
   * @throws UnauthorizedException - 잘못된 자격 증명
   */
  async login(credentials: LoginDto): Promise<TokenResponse> {
    // 구현...
  }

  /**
   * 토큰 갱신
   * @param refreshToken - 리프레시 토큰
   * @returns 새로운 액세스 토큰
   * @throws UnauthorizedException - 유효하지 않은 리프레시 토큰
   */
  async refresh(refreshToken: string): Promise<AccessToken> {
    // 구현...
  }
}
```

## 비동기 패턴

### Promise vs Async/Await

```typescript
// 권장: async/await 사용
async function getUser(id: string): Promise<User> {
  try {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  } catch (error) {
    this.logger.error('Failed to get user', error);
    throw error;
  }
}

// 비권장: Promise chain
function getUser(id: string): Promise<User> {
  return this.userRepository
    .findOne({ where: { id } })
    .then(user => {
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    })
    .catch(error => {
      this.logger.error('Failed to get user', error);
      throw error;
    });
}
```

### 병렬 처리

```typescript
// 병렬 실행
async function processMultiple(ids: string[]): Promise<User[]> {
  const promises = ids.map(id => this.getUser(id));
  return Promise.all(promises);
}

// 순차 실행 (필요한 경우만)
async function processSequential(ids: string[]): Promise<User[]> {
  const results: User[] = [];
  for (const id of ids) {
    const user = await this.getUser(id);
    results.push(user);
  }
  return results;
}

// Promise.allSettled 사용 (일부 실패 허용)
async function processSafe(ids: string[]): Promise<PromiseSettledResult<User>[]> {
  const promises = ids.map(id => this.getUser(id));
  return Promise.allSettled(promises);
}
```

## 체크리스트

### 코드 작성 전
- [ ] 요구사항을 명확히 이해했는가?
- [ ] 기존 코드베이스의 패턴을 확인했는가?
- [ ] 필요한 의존성을 확인했는가?

### 코드 작성 중
- [ ] TypeScript 타입을 명시적으로 정의했는가?
- [ ] 에러 처리를 적절히 했는가?
- [ ] 로깅을 추가했는가?
- [ ] 보안 고려사항을 확인했는가?

### 코드 작성 후
- [ ] 테스트를 작성했는가?
- [ ] 문서를 업데이트했는가?
- [ ] 린트 검사를 통과했는가?
- [ ] 성능 영향을 고려했는가?

## 안티패턴

### 피해야 할 패턴들

```typescript
// God Service: 너무 많은 책임
@Injectable()
export class UserService {
  // 100개 이상의 메서드...
  createUser() {}
  updateUser() {}
  deleteUser() {}
  sendEmail() {}
  generateReport() {}
  processPayment() {}
  // ...
}

// 단일 책임 원칙
@Injectable()
export class UserService {
  create() {}
  update() {}
  delete() {}
}

@Injectable()
export class EmailService {
  send() {}
}

// 순환 의존성
@Injectable()
export class ServiceA {
  constructor(private serviceB: ServiceB) {}
}

@Injectable()
export class ServiceB {
  constructor(private serviceA: ServiceA) {}
}

// 의존성 역전
@Injectable()
export class ServiceA {
  constructor(private eventEmitter: EventEmitter2) {}
}

@Injectable()
export class ServiceB {
  constructor(private eventEmitter: EventEmitter2) {}
}
```

## 참고 자료

### 필독 문서
- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

### 유용한 도구
- [NestJS DevTools](https://devtools.nestjs.com/)
- [TypeORM CLI](https://typeorm.io/using-cli)
- [Compodoc](https://compodoc.app/) - 문서 생성
- [Madge](https://github.com/pahen/madge) - 순환 의존성 검사