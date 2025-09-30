import { Injectable, Logger } from '@nestjs/common';

import { AuthProvider, User } from '../entities/user.entity';
import {
  OAuthProfileInput,
  PreparedOAuthProfile,
  UserConflictCheckResult,
  UserDataValidationInput,
  UserDataValidationResult,
  UserEntityInput,
} from '../types/user.handler.types';

/**
 * 사용자 관련 순수 비즈니스 로직을 처리하는 핸들러
 */
@Injectable()
export class UserHandler {
  private readonly logger = new Logger(UserHandler.name);

  /**
   * 사용자명 변형 생성
   * @param baseUsername - 기본 사용자명
   * @param counter - 카운터 번호
   * @returns 변형된 사용자명
   */
  generateUsernameVariant(baseUsername: string, counter: number): string {
    try {
      const variant = counter === 0 ? baseUsername : `${baseUsername}_${counter}`;

      this.logger.debug(`사용자명 변형 생성: ${baseUsername} -> ${variant} (카운터: ${counter})`);
      return variant;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `사용자명 변형 생성 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw error;
    }
  }

  /**
   * 사용자 데이터 유효성 검증
   * @param userData - 사용자 데이터
   * @returns 검증 결과
   */
  validateUserData(userData: UserDataValidationInput): UserDataValidationResult {
    const errors: string[] = [];

    try {
      // 이메일 형식 검증
      this.validateEmail(userData.email, errors);

      // 사용자명 검증 (선택사항)
      this.validateUsername(userData.username, errors);

      // 비밀번호 검증 (선택사항)
      this.validatePassword(userData.password, errors);

      const isValid = errors.length === 0;

      this.logger.debug(
        `사용자 데이터 검증: 이메일=${userData.email}, 유효성=${isValid}, 오류수=${errors.length}`,
      );

      return { isValid, errors };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `사용자 데이터 검증 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      return { isValid: false, errors: ['데이터 검증 중 오류가 발생했습니다'] };
    }
  }

  /**
   * OAuth 프로필 데이터 준비
   * @param profile - 원본 OAuth 프로필
   * @returns 정규화된 프로필 데이터
   */
  prepareOAuthProfile(profile: OAuthProfileInput): PreparedOAuthProfile {
    try {
      const defaultUsername = this.createDefaultUsername(profile);
      const normalizedEmail = this.normalizeEmail(profile.email);

      const preparedProfile: PreparedOAuthProfile = {
        email: normalizedEmail,
        provider: profile.provider,
        providerId: profile.providerId,
        username: defaultUsername,
        firstName: profile.firstName?.trim(),
        lastName: profile.lastName?.trim(),
        avatar: profile.avatar,
        providerData: profile.providerData || {},
        isEmailVerified: true, // OAuth 제공자를 통한 이메일은 검증된 것으로 간주
      };

      this.logger.debug(
        `OAuth 프로필 준비 완료: ${profile.provider} - ${normalizedEmail} (${defaultUsername})`,
      );

      return preparedProfile;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `OAuth 프로필 준비 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw error;
    }
  }

  /**
   * 이메일 형식 검증
   * @param email - 검증할 이메일
   * @returns 이메일 유효성 여부
   */
  checkEmailFormat(email: string): boolean {
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(email);

      if (!isValid) {
        this.logger.debug(`이메일 형식 검증 실패: ${email}`);
      } else {
        this.logger.debug(`이메일 형식 검증 성공: ${email}`);
      }

      return isValid;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `이메일 형식 검증 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      return false;
    }
  }

  /**
   * 사용자 충돌 검증 결과 생성
   * @param existingUser - 기존 사용자 정보 (있을 경우)
   * @param checkEmail - 확인 대상 이메일
   * @param checkUsername - 확인 대상 사용자명
   * @returns 충돌 검증 결과
   */
  checkUserConflict(
    existingUser: User | null,
    checkEmail: string,
    checkUsername?: string,
  ): UserConflictCheckResult {
    try {
      if (!existingUser) {
        this.logger.debug(`사용자 충돌 없음: 이메일=${checkEmail}, 사용자명=${checkUsername}`);
        return { hasConflict: false };
      }

      // 이메일 충돌 확인
      if (existingUser.email === checkEmail) {
        this.logger.warn(`이메일 충돌 감지: ${checkEmail}`);
        return {
          hasConflict: true,
          conflictType: 'email',
          message: '이미 사용 중인 이메일입니다',
        };
      }

      // 사용자명 충돌 확인
      if (checkUsername && existingUser.username === checkUsername) {
        this.logger.warn(`사용자명 충돌 감지: ${checkUsername}`);
        return {
          hasConflict: true,
          conflictType: 'username',
          message: '이미 사용 중인 사용자명입니다',
        };
      }

      this.logger.debug(`사용자 충돌 없음: 이메일=${checkEmail}, 사용자명=${checkUsername}`);
      return { hasConflict: false };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `사용자 충돌 검증 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      return {
        hasConflict: true,
        message: '사용자 충돌 검증 중 오류가 발생했습니다',
      };
    }
  }

  /**
   * OAuth 제공자별 사용자명 생성 규칙
   * @param provider - OAuth 제공자
   * @param providerId - 제공자 사용자 ID
   * @param profileUsername - 프로필 사용자명 (선택사항)
   * @returns 생성된 사용자명
   */
  generateOAuthUsername(
    provider: AuthProvider,
    providerId: string,
    profileUsername?: string,
  ): string {
    try {
      let baseUsername: string;

      if (profileUsername && profileUsername.trim()) {
        // 제공자 프로필에 사용자명이 있는 경우
        baseUsername = profileUsername
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_');
      } else {
        // 제공자와 ID를 조합하여 생성
        baseUsername = `${provider.toLowerCase()}_${providerId}`;
      }

      // 사용자명 길이 제한 (최대 20자)
      if (baseUsername.length > 20) {
        baseUsername = baseUsername.substring(0, 20);
      }

      // 끝에 언더스코어가 있으면 제거
      baseUsername = baseUsername.replace(/_+$/, '');

      this.logger.debug(
        `OAuth 사용자명 생성: ${provider} - ${providerId} -> ${baseUsername} (원본: ${profileUsername})`,
      );

      return baseUsername;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `OAuth 사용자명 생성 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      // 오류 시 기본 패턴 사용
      return `${provider.toLowerCase()}_${providerId}`;
    }
  }

  /**
   * 사용자 엔티티 생성 데이터 준비
   * @param userData - 사용자 데이터
   * @returns 엔티티 생성용 데이터
   */
  prepareUserEntityData(userData: UserEntityInput): Partial<User> {
    try {
      const entityData: Partial<User> = {
        email: userData.email.toLowerCase().trim(),
        username: userData.username.trim(),
        provider: userData.provider || AuthProvider.LOCAL,
        providerId: userData.providerId,
        firstName: userData.firstName?.trim(),
        lastName: userData.lastName?.trim(),
        avatar: userData.avatar,
        password: userData.password, // 실제 저장 시 해시화 필요
        providerData: userData.providerData,
        emailVerifiedAt: userData.isEmailVerified ? new Date() : undefined,
      };

      this.logger.debug(`사용자 엔티티 데이터 준비: ${entityData.email} (${entityData.username})`);

      return entityData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `사용자 엔티티 데이터 준비 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw error;
    }
  }

  /**
   * 이메일 검증
   */
  private validateEmail(email: string, errors: string[]): void {
    if (!this.checkEmailFormat(email)) {
      errors.push('이메일 형식이 올바르지 않습니다');
    }
  }

  /**
   * 사용자명 검증
   */
  private validateUsername(username: string | undefined, errors: string[]): void {
    if (!username) {
      return;
    }

    if (username.length < 3) {
      errors.push('사용자명은 3자 이상이어야 합니다');
    }
    if (username.length > 20) {
      errors.push('사용자명은 20자 이하여야 합니다');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push('사용자명은 영문, 숫자, 언더스코어만 사용 가능합니다');
    }
  }

  /**
   * 비밀번호 검증
   */
  private validatePassword(password: string | undefined, errors: string[]): void {
    if (!password) {
      return;
    }

    if (password.length < 8) {
      errors.push('비밀번호는 8자 이상이어야 합니다');
    }
    if (password.length > 100) {
      errors.push('비밀번호는 100자 이하여야 합니다');
    }
  }

  /**
   * 기본 사용자명 생성
   */
  private createDefaultUsername(profile: {
    username?: string;
    provider: AuthProvider;
    providerId: string;
  }): string {
    return profile.username || `${profile.provider.toLowerCase()}_${profile.providerId}`;
  }

  /**
   * 이메일 정규화
   */
  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }
}
