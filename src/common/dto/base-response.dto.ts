import { ApiProperty } from '@nestjs/swagger';

export class BaseResponseDto<T = unknown> {
  @ApiProperty({
    description: '응답 성공 여부',
    type: Boolean,
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: '응답 데이터',
    required: false,
    nullable: true,
  })
  data?: T;

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

export class ErrorResponseDto {
  @ApiProperty({
    description: '응답 성공 여부',
    type: Boolean,
    example: false,
  })
  success: boolean;

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

export class PaginationDto {
  @ApiProperty({
    description: '페이지당 항목 수',
    type: Number,
    minimum: 1,
    maximum: 100,
    default: 20,
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: '시작 위치 (0부터 시작)',
    type: Number,
    minimum: 0,
    default: 0,
    example: 0,
  })
  offset: number;

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

export class PaginatedResponseDto<T> extends PaginationDto {
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
