import { AuthProvider } from '../../users/entities/user.entity';

/**
 * OAuth 프로필 입력 데이터
 */
export interface OAuthProfileInput {
  /** 이메일 주소 */
  email: string;
  /** OAuth 제공자 */
  provider: AuthProvider;
  /** 제공자별 고유 ID */
  providerId: string;
  /** 사용자명 (선택) */
  username?: string;
  /** 이름 (선택) */
  firstName?: string;
  /** 성 (선택) */
  lastName?: string;
  /** 아바타 URL (선택) */
  avatar?: string;
  /** 제공자별 추가 데이터 (선택) */
  providerData?: Record<string, unknown>;
}

/**
 * OAuth 콜백 응답
 */
export interface OAuthCallbackResponse {
  /** 액세스 토큰 */
  accessToken: string;
  /** 리프레시 토큰 */
  refreshToken: string;
  /** OAuth 제공자 */
  provider: string;
}

/**
 * OAuth Provider 설정 상태
 */
export interface OAuthProviderStatus {
  /** Google OAuth 활성화 여부 */
  googleEnabled: boolean;
  /** GitHub OAuth 활성화 여부 */
  githubEnabled: boolean;
  /** 활성화된 provider 목록 */
  enabledProviders: string[];
}
