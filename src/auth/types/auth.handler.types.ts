import { UserResponseDto } from '../../users/dto/user-response.dto';

/**
 * AuthHandler 관련 타입 정의
 */

/**
 * 토큰 응답 데이터
 */
export interface TokenResponse {
  /** 액세스 토큰 */
  accessToken: string;
  /** 리프레시 토큰 */
  refreshToken: string;
  /** 토큰 타입 (Bearer) */
  tokenType: string;
  /** 만료 시간 (초) */
  expiresIn: number;
  /** 사용자 정보 */
  user: UserResponseDto;
}
