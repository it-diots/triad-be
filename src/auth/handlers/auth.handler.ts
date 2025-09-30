import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { UserResponseDto } from '../../users/dto/user-response.dto';
import { User } from '../../users/entities/user.entity';
import { TokenResponse } from '../types/auth.handler.types';

/**
 * 인증 관련 순수 비즈니스 로직을 처리하는 핸들러
 */
@Injectable()
export class AuthHandler {
  private readonly logger = new Logger(AuthHandler.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 토큰 페이로드 생성
   * @param user - 사용자 엔티티
   * @returns JWT 페이로드
   */
  generateTokenPayload(user: User): Record<string, unknown> {
    try {
      const payload = {
        sub: user.id,
        email: user.email,
        username: user.username,
        iat: Math.floor(Date.now() / 1000),
      };

      this.logger.debug(`토큰 페이로드 생성: ${user.id} (${user.email})`);
      return payload;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `토큰 페이로드 생성 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw error;
    }
  }

  /**
   * User 엔티티를 UserResponseDto로 변환
   * @param user - 사용자 엔티티
   * @returns 사용자 응답 DTO
   */
  transformUserToDto(user: User): UserResponseDto {
    try {
      const { password: _password, refreshToken: _refreshToken, ...result } = user;

      this.logger.debug(`사용자 DTO 변환: ${user.id}`);
      return result as UserResponseDto;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `사용자 DTO 변환 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw error;
    }
  }

  /**
   * 토큰 만료 시간 검증
   * @param exp - 토큰 만료 시간 (Unix timestamp)
   * @returns 토큰 유효성 여부
   */
  validateTokenExpiry(exp: number): boolean {
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      const isValid = exp > currentTime;

      if (!isValid) {
        this.logger.warn(`토큰 만료됨: exp=${exp}, current=${currentTime}`);
      } else {
        this.logger.debug(`토큰 유효: exp=${exp}, current=${currentTime}`);
      }

      return isValid;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `토큰 만료 검증 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      return false;
    }
  }

  /**
   * JWT 토큰 생성 (인프라 유틸리티)
   * @param payload - 토큰 페이로드
   * @returns 생성된 JWT 토큰
   */
  async createAccessToken(payload: Record<string, unknown>): Promise<string> {
    try {
      const token = await this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiresIn', '15m'),
      });

      this.logger.debug(`액세스 토큰 생성 완료: sub=${String(payload.sub)}`);
      return token;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `액세스 토큰 생성 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw error;
    }
  }

  /**
   * JWT 리프레시 토큰 생성 (인프라 유틸리티)
   * @param payload - 토큰 페이로드
   * @returns 생성된 JWT 리프레시 토큰
   */
  async createRefreshToken(payload: Record<string, unknown>): Promise<string> {
    try {
      const token = await this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn', '7d'),
      });

      this.logger.debug(`리프레시 토큰 생성 완료: sub=${String(payload.sub)}`);
      return token;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `리프레시 토큰 생성 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw error;
    }
  }

  /**
   * 토큰 응답 데이터 준비
   * @param accessToken - 액세스 토큰
   * @param refreshToken - 리프레시 토큰
   * @param user - 사용자 정보
   * @returns 토큰 응답 데이터
   */
  prepareTokenResponse(accessToken: string, refreshToken: string, user: User): TokenResponse {
    try {
      const response: TokenResponse = {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: 900, // 15분 (초 단위)
        user: this.transformUserToDto(user),
      };

      this.logger.debug(`토큰 응답 데이터 준비 완료: ${user.id}`);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `토큰 응답 데이터 준비 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw error;
    }
  }

  /**
   * 리프레시 토큰 일치 검증
   * @param storedToken - 저장된 토큰
   * @param providedToken - 제공된 토큰
   * @returns 토큰 일치 여부
   */
  validateRefreshTokenMatch(storedToken: string | null, providedToken: string): boolean {
    try {
      if (!storedToken) {
        this.logger.warn('저장된 리프레시 토큰이 없음');
        return false;
      }

      const isMatch = storedToken === providedToken;

      if (!isMatch) {
        this.logger.warn('리프레시 토큰 불일치');
      } else {
        this.logger.debug('리프레시 토큰 일치 확인');
      }

      return isMatch;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `리프레시 토큰 검증 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      return false;
    }
  }

  /**
   * JWT 토큰 디코드 (검증 없이) - 디버깅용
   * @param token - JWT 토큰
   * @returns 디코드된 페이로드
   */
  decodeTokenPayload(token: string): Record<string, unknown> | null {
    try {
      const decoded = this.jwtService.decode(token);

      if (decoded && typeof decoded === 'object' && decoded !== null) {
        const decodedObj = decoded as Record<string, unknown>;
        this.logger.debug(`토큰 디코드 성공: sub=${String(decodedObj.sub)}`);
        return decodedObj;
      } else {
        this.logger.warn('토큰 디코드 실패: 유효하지 않은 토큰');
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `토큰 디코드 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      return null;
    }
  }
}
