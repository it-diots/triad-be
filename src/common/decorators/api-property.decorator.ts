import { ApiPropertyOptions } from '@nestjs/swagger';

// 자주 사용하는 ApiProperty 옵션 프리셋
export const apiPropertyPresets = {
  // ID 필드
  id: (): ApiPropertyOptions => ({
    description: '고유 식별자 (UUID)',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),

  // 이메일 필드
  email: (required = true): ApiPropertyOptions => ({
    description: '사용자 이메일 주소',
    type: String,
    format: 'email',
    example: 'user@example.com',
    required,
  }),

  // 비밀번호 필드
  password: (): ApiPropertyOptions => ({
    description: '사용자 비밀번호 (8자 이상, 대소문자, 숫자, 특수문자 포함)',
    type: String,
    format: 'password',
    example: 'Password123!',
    minLength: 8,
    maxLength: 50,
  }),

  // 사용자명 필드
  username: (): ApiPropertyOptions => ({
    description: '사용자명 (3-20자, 영문자, 숫자, 언더스코어, 하이픈)',
    type: String,
    example: 'johndoe',
    minLength: 3,
    maxLength: 20,
    pattern: '^[a-zA-Z0-9_-]+$',
  }),

  // 이름 필드
  firstName: (): ApiPropertyOptions => ({
    description: '사용자 이름',
    type: String,
    example: 'John',
    required: false,
    nullable: true,
    maxLength: 100,
  }),

  lastName: (): ApiPropertyOptions => ({
    description: '사용자 성',
    type: String,
    example: 'Doe',
    required: false,
    nullable: true,
    maxLength: 100,
  }),

  // URL 필드
  url: (required = false): ApiPropertyOptions => ({
    description: 'URL 주소',
    type: String,
    format: 'url',
    example: 'https://example.com',
    required,
    nullable: !required,
  }),

  // 날짜 필드
  timestamp: (description: string): ApiPropertyOptions => ({
    description,
    type: Date,
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
  }),

  // 생성일
  createdAt: (): ApiPropertyOptions => ({
    description: '생성 일시',
    type: Date,
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
  }),

  // 수정일
  updatedAt: (): ApiPropertyOptions => ({
    description: '마지막 수정 일시',
    type: Date,
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
  }),

  // 삭제일
  deletedAt: (): ApiPropertyOptions => ({
    description: '삭제 일시 (soft delete)',
    type: Date,
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
    nullable: true,
  }),

  // 불리언 필드
  boolean: (description: string, defaultValue = false): ApiPropertyOptions => ({
    description,
    type: Boolean,
    example: defaultValue,
    default: defaultValue,
  }),

  // 문자열 필드
  string: (
    description: string,
    example: 'example',
    options?: Record<string, unknown>,
  ): ApiPropertyOptions => ({
    description,
    type: String,
    example,
    ...(options as ApiPropertyOptions),
  }),

  // 숫자 필드
  number: (
    description: string,
    example = 0,
    options?: Record<string, unknown>,
  ): ApiPropertyOptions => ({
    description,
    type: Number,
    example,
    ...(options as ApiPropertyOptions),
  }),

  // 배열 필드
  array: <T>(
    description: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    itemType: any,
    example: T[] = [],
  ): ApiPropertyOptions => ({
    description,
    type: itemType,
    isArray: true,
    example,
  }),

  // Enum 필드
  enum: <T>(description: string, enumType: Record<string, T>, example: T): ApiPropertyOptions => ({
    description,
    enum: enumType,
    enumName: enumType.constructor.name,
    example,
  }),

  // JSON 필드
  json: (description: string, example: Record<string, unknown> = {}): ApiPropertyOptions => ({
    description,
    type: Object,
    example,
  }),

  // 페이지네이션
  limit: (): ApiPropertyOptions => ({
    description: '한 페이지당 항목 수',
    type: Number,
    minimum: 1,
    maximum: 100,
    default: 20,
    example: 20,
  }),

  offset: (): ApiPropertyOptions => ({
    description: '시작 위치 (0부터 시작)',
    type: Number,
    minimum: 0,
    default: 0,
    example: 0,
  }),

  total: (): ApiPropertyOptions => ({
    description: '전체 항목 수',
    type: Number,
    example: 100,
  }),
};

// Swagger 응답 상태별 메시지 프리셋
export const apiResponseMessages = {
  // 성공 응답
  SUCCESS: 'Request processed successfully',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  FETCHED: 'Resource fetched successfully',

  // 클라이언트 에러
  BAD_REQUEST: 'Invalid request parameters',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  CONFLICT: 'Resource already exists',
  UNPROCESSABLE_ENTITY: 'Validation failed',

  // 서버 에러
  INTERNAL_SERVER_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
};

interface SwaggerResponse {
  status: number;
  description: string;
  type?: unknown;
}

// Swagger 응답 타입 헬퍼
export const swaggerResponseOptions = {
  success: (type: unknown, description = apiResponseMessages.SUCCESS): SwaggerResponse => ({
    status: 200,
    description,
    type,
  }),

  created: (type: unknown, description = apiResponseMessages.CREATED): SwaggerResponse => ({
    status: 201,
    description,
    type,
  }),

  noContent: (description = apiResponseMessages.DELETED): SwaggerResponse => ({
    status: 204,
    description,
  }),

  badRequest: (description = apiResponseMessages.BAD_REQUEST): SwaggerResponse => ({
    status: 400,
    description,
  }),

  unauthorized: (description = apiResponseMessages.UNAUTHORIZED): SwaggerResponse => ({
    status: 401,
    description,
  }),

  forbidden: (description = apiResponseMessages.FORBIDDEN): SwaggerResponse => ({
    status: 403,
    description,
  }),

  notFound: (description = apiResponseMessages.NOT_FOUND): SwaggerResponse => ({
    status: 404,
    description,
  }),

  conflict: (description = apiResponseMessages.CONFLICT): SwaggerResponse => ({
    status: 409,
    description,
  }),

  serverError: (description = apiResponseMessages.INTERNAL_SERVER_ERROR): SwaggerResponse => ({
    status: 500,
    description,
  }),
};
