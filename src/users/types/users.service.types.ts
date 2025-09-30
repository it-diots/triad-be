import { AuthProvider } from '../entities/user.entity';

/**
 * UsersService에서 사용하는 타입 정의
 */

/**
 * OAuth 사용자 전체 프로필 (createOAuthUser용)
 */
export interface OAuthUserProfile {
  email: string;
  provider: AuthProvider;
  providerId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  providerData?: Record<string, unknown>;
}

/**
 * OAuth 프로필 업데이트 데이터 (updateOAuthUserProfile용)
 */
export interface OAuthProfileUpdate {
  avatar?: string;
  firstName?: string;
  lastName?: string;
  providerData?: Record<string, unknown>;
}

/**
 * OAuth provider 연동 데이터 (linkOAuthProviderToExistingUser용)
 */
export interface OAuthProviderLink {
  provider: AuthProvider;
  providerId: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  providerData?: Record<string, unknown>;
}

/**
 * 신규 OAuth 사용자 프로필 (createNewOAuthUser용)
 */
export interface NewOAuthUserProfile {
  email: string;
  provider: AuthProvider;
  providerId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  providerData?: Record<string, unknown>;
}
