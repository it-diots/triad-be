/**
 * 인증 관련 타입 정의
 * 인증 및 권한 관리에 사용되는 타입들
 */

/**
 * 인증된 요청 인터페이스
 * JWT 토큰으로 인증된 요청에 포함되는 사용자 정보
 */
export interface AuthRequest {
  /** 인증된 사용자 정보 */
  user: {
    /** 사용자 고유 식별자 */
    userId: string;
    /** 사용자명 */
    username: string;
    /** 사용자 이메일 */
    email: string;
  };
}

/**
 * JWT 토큰 페이로드 인터페이스
 * JWT 토큰에 포함되는 사용자 정보
 */
export interface JwtPayload {
  /** 토큰 주체 (사용자 ID) */
  sub: string;
  /** 사용자 이메일 */
  email: string;
  /** 사용자명 */
  username: string;
  /** 토큰 발행 시간 */
  iat?: number;
  /** 토큰 만료 시간 */
  exp?: number;
}

/**
 * OAuth 프로필 정보 인터페이스
 * OAuth 인증 제공자로부터 받은 사용자 프로필 정보
 */
export interface OAuthProfile {
  /** 이메일 주소 */
  email: string;
  /** OAuth 제공자 타입 */
  provider: 'LOCAL' | 'GOOGLE' | 'GITHUB';
  /** 제공자별 고유 ID */
  providerId: string;
  /** 사용자명 */
  username?: string;
  /** 이름 */
  firstName?: string;
  /** 성 */
  lastName?: string;
  /** 프로필 이미지 URL */
  avatar?: string;
  /** 제공자별 추가 데이터 */
  providerData?: Record<string, unknown>;
}

/**
 * 토큰 생성 옵션 인터페이스
 * JWT 토큰 생성 시 사용되는 옵션
 */
export interface TokenGenerationOptions {
  /** 액세스 토큰 만료 시간 */
  accessTokenExpiresIn?: string;
  /** 리프레시 토큰 만료 시간 */
  refreshTokenExpiresIn?: string;
  /** 추가 클레임 */
  additionalClaims?: Record<string, unknown>;
}
