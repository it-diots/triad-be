import { ApiProperty } from '@nestjs/swagger';

/**
 * 기본 응답 DTO
 * API 응답의 기본 구조를 정의하는 제네릭 클래스
 */
export class BaseResponseDto<T = unknown> {
  /**
   * 응답 성공 여부
   */
  @ApiProperty({
    description: '응답 성공 여부',
    type: Boolean,
    example: true,
  })
  success: boolean;

  /**
   * 응답 데이터
   */
  @ApiProperty({
    description: '응답 데이터',
    required: false,
    nullable: true,
  })
  data?: T;

  /**
   * 응답 메시지
   */
  @ApiProperty({
    description: '응답 메시지',
    type: String,
    required: false,
    nullable: true,
    example: 'Success',
  })
  message?: string;

  constructor(data?: T, message?: string, success = true) {
    this.success = success;
    this.data = data;
    this.message = message;
  }
}

/**
 * 에러 응답 DTO
 * API 에러 응답의 구조를 정의하는 클래스
 */
export class ErrorResponseDto {
  /**
   * 응답 성공 여부 (에러 시 항상 false)
   */
  @ApiProperty({
    description: '응답 성공 여부',
    type: Boolean,
    example: false,
  })
  success: boolean;

  /**
   * 에러 정보
   */
  @ApiProperty({
    description: '에러 정보',
    type: Object,
    example: {
      code: 'ERROR_CODE',
      message: 'Error description',
    },
  })
  error: {
    code: string;
    message: string;
  };

  constructor(code: string, message: string) {
    this.success = false;
    this.error = {
      code,
      message,
    };
  }
}

/**
 * 페이지네이션 DTO
 * 페이지네이션 정보를 정의하는 클래스
 */
export class PaginationDto {
  /**
   * 페이지당 항목 수
   */
  @ApiProperty({
    description: '페이지당 항목 수',
    type: Number,
    minimum: 1,
    maximum: 100,
    default: 20,
    example: 20,
  })
  limit: number;

  /**
   * 시작 위치 (0부터 시작)
   */
  @ApiProperty({
    description: '시작 위치 (0부터 시작)',
    type: Number,
    minimum: 0,
    default: 0,
    example: 0,
  })
  offset: number;

  /**
   * 전체 항목 수
   */
  @ApiProperty({
    description: '전체 항목 수',
    type: Number,
    example: 100,
  })
  total: number;

  constructor(limit = 20, offset = 0, total = 0) {
    this.limit = limit;
    this.offset = offset;
    this.total = total;
  }
}

/**
 * 페이지네이션 응답 DTO
 * 페이지네이션된 데이터 목록을 위한 제네릭 클래스
 */
export class PaginatedResponseDto<T> extends PaginationDto {
  /**
   * 데이터 목록
   */
  @ApiProperty({
    description: '데이터 목록',
    type: Array,
    isArray: true,
  })
  data: T[];

  constructor(data: T[], total: number, limit = 20, offset = 0) {
    super(limit, offset, total);
    this.data = data;
  }
}
