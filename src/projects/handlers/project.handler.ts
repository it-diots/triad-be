import { createHash } from 'crypto';

import { Injectable, Logger } from '@nestjs/common';

import {
  ProjectAccessCheckResult,
  ProjectAccessInfo,
  ProjectDataValidationInput,
  ProjectDataValidationResult,
  UrlValidationResult,
} from '../types/project.handler.types';

/**
 * 프로젝트 관련 순수 비즈니스 로직을 처리하는 핸들러
 */
@Injectable()
export class ProjectHandler {
  private readonly logger = new Logger(ProjectHandler.name);

  /**
   * URL을 프로젝트 ID로 변환
   * @param url - 대상 URL
   * @returns 프로젝트 ID (UUID v5 형식)
   */
  generateProjectIdFromUrl(url: string): string {
    try {
      // URL 정규화
      const normalizedUrl = this.normalizeUrl(url);

      // SHA-256 해시 생성
      const hash = createHash('sha256').update(normalizedUrl).digest();
      const bytes = Buffer.from(hash.subarray(0, 16));

      // UUID v5 레이아웃으로 변환 (결정적 프로젝트 ID)
      bytes[6] = (bytes[6] & 0x0f) | 0x50; // version을 5로 설정
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant를 RFC 4122로 설정

      const hex = bytes.toString('hex');
      const projectId = `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;

      this.logger.debug(`URL을 프로젝트 ID로 변환: ${normalizedUrl} -> ${projectId}`);
      return projectId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `URL을 프로젝트 ID로 변환 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw error;
    }
  }

  /**
   * 프로젝트 기본 설정 생성
   * @param customSettings - 커스텀 설정 (선택사항)
   * @returns 기본 설정 객체
   */
  createDefaultSettings(customSettings?: Record<string, unknown>): Record<string, unknown> {
    try {
      const defaultSettings = {
        allowComments: true,
        allowGuests: true,
        isPublic: true,
        maxCollaborators: 50,
        enableRealTimeSync: true,
        enableMouseTracking: true,
        enableNotifications: true,
        language: 'ko',
        theme: 'light',
        autoSave: true,
        version: '1.0.0',
      };

      const mergedSettings = { ...defaultSettings, ...customSettings };

      this.logger.debug(`프로젝트 기본 설정 생성: ${Object.keys(mergedSettings).length}개 설정`);
      return mergedSettings;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `프로젝트 기본 설정 생성 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      // 오류 시 최소한의 기본 설정 반환
      return {
        allowComments: true,
        isPublic: true,
        enableRealTimeSync: true,
      };
    }
  }

  /**
   * 프로젝트 데이터 검증
   * @param data - 프로젝트 데이터
   * @returns 검증 결과
   */
  validateProjectData(data: ProjectDataValidationInput): ProjectDataValidationResult {
    const errors: string[] = [];

    try {
      // 프로젝트명 검증
      this.validateProjectName(data.name, errors);

      // URL 검증 (선택사항)
      this.validateProjectUrl(data.url, errors);

      // 설명 검증 (선택사항)
      this.validateProjectDescription(data.description, errors);

      const isValid = errors.length === 0;

      this.logger.debug(
        `프로젝트 데이터 검증: 이름=${data.name}, 유효성=${isValid}, 오류수=${errors.length}`,
      );

      return { isValid, errors };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `프로젝트 데이터 검증 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      return { isValid: false, errors: ['데이터 검증 중 오류가 발생했습니다'] };
    }
  }

  /**
   * 프로젝트 소유권 확인
   * @param projectOwnerId - 프로젝트 소유자 ID
   * @param userId - 확인 대상 사용자 ID
   * @returns 소유권 여부
   */
  checkOwnership(projectOwnerId: string, userId: string): boolean {
    try {
      const isOwner = projectOwnerId === userId;

      if (isOwner) {
        this.logger.debug(`프로젝트 소유권 확인: 소유자 일치 (${userId})`);
      } else {
        this.logger.debug(
          `프로젝트 소유권 확인: 소유자 불일치 (소유자: ${projectOwnerId}, 요청자: ${userId})`,
        );
      }

      return isOwner;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `프로젝트 소유권 확인 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      return false;
    }
  }

  /**
   * 프로젝트 접근 권한 확인
   * @param project - 프로젝트 정보
   * @param userId - 사용자 ID (선택사항)
   * @returns 접근 권한 여부 및 이유
   */
  checkProjectAccess(project: ProjectAccessInfo, userId?: string): ProjectAccessCheckResult {
    try {
      // 소유자 확인
      if (userId && project.ownerId === userId) {
        this.logger.debug(`프로젝트 접근 허용: 소유자 (${userId})`);
        return { hasAccess: true, reason: 'owner' };
      }

      // 공개 프로젝트 확인
      const isPublic = project.settings?.isPublic === true;
      if (isPublic) {
        this.logger.debug(`프로젝트 접근 허용: 공개 프로젝트 (사용자: ${userId || 'anonymous'})`);
        return { hasAccess: true, reason: 'public' };
      }

      // 게스트 허용 확인
      const allowGuests = project.settings?.allowGuests === true;
      if (!userId && allowGuests) {
        this.logger.debug('프로젝트 접근 허용: 게스트 허용');
        return { hasAccess: true, reason: 'guest_allowed' };
      }

      this.logger.debug(
        `프로젝트 접근 거부: 사용자=${userId}, 공개=${isPublic}, 게스트허용=${allowGuests}`,
      );
      return { hasAccess: false, reason: 'access_denied' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `프로젝트 접근 권한 확인 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      return { hasAccess: false, reason: 'validation_error' };
    }
  }

  /**
   * URL 유효성 검증
   * @param url - 검증할 URL
   * @returns 검증 결과
   */
  validateUrl(url: string): UrlValidationResult {
    try {
      const urlObj = new URL(url);

      // HTTP/HTTPS 프로토콜만 허용
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return {
          isValid: false,
          error: 'HTTP 또는 HTTPS 프로토콜만 지원됩니다',
        };
      }

      // localhost 및 개발 환경 허용
      const hostname = urlObj.hostname;
      const isLocalhost =
        hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local');
      const isValidDomain = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(
        hostname,
      );

      if (!isLocalhost && !isValidDomain) {
        return {
          isValid: false,
          error: '유효하지 않은 도메인입니다',
        };
      }

      return {
        isValid: true,
        normalizedUrl: this.normalizeUrl(url),
      };
    } catch {
      return {
        isValid: false,
        error: '유효하지 않은 URL 형식입니다',
      };
    }
  }

  /**
   * URL을 정규화
   * @param url - 대상 URL
   * @returns 정규화된 URL
   */
  normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);

      // 프로토콜은 https로 통일 (localhost는 http 유지)
      const protocol =
        urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1' ? 'http:' : 'https:';

      // 쿼리 파라미터와 fragment 제거, trailing slash 제거
      let pathname = urlObj.pathname;
      if (pathname.endsWith('/') && pathname.length > 1) {
        pathname = pathname.slice(0, -1);
      }

      const normalizedUrl = `${protocol}//${urlObj.hostname}${urlObj.port ? `:${urlObj.port}` : ''}${pathname}`;

      this.logger.debug(`URL 정규화: ${url} -> ${normalizedUrl}`);
      return normalizedUrl;
    } catch {
      // URL 파싱 실패 시 원본 반환
      this.logger.warn(`URL 정규화 실패, 원본 반환: ${url}`);
      return url;
    }
  }

  /**
   * URL에서 프로젝트명 생성
   * @param url - 대상 URL
   * @returns 생성된 프로젝트명
   */
  generateProjectNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      let hostname = urlObj.hostname;

      // www. 접두사 제거
      hostname = hostname.replace(/^www\./, '');

      // 경로가 있으면 포함
      const pathname = urlObj.pathname;
      if (pathname && pathname !== '/') {
        const pathSegments = pathname.split('/').filter((segment) => segment.length > 0);
        if (pathSegments.length > 0) {
          const mainPath = pathSegments[0];
          const projectName = `${hostname}/${mainPath}`;
          this.logger.debug(`URL에서 프로젝트명 생성 (경로 포함): ${url} -> ${projectName}`);
          return projectName;
        }
      }

      this.logger.debug(`URL에서 프로젝트명 생성: ${url} -> ${hostname}`);
      return hostname;
    } catch {
      // URL 파싱 실패 시 기본 이름 반환
      const defaultName = '웹사이트 프로젝트';
      this.logger.warn(`URL에서 프로젝트명 생성 실패, 기본명 사용: ${url} -> ${defaultName}`);
      return defaultName;
    }
  }

  /**
   * 프로젝트 설정 병합
   * @param defaultSettings - 기본 설정
   * @param userSettings - 사용자 설정
   * @returns 병합된 설정
   */
  mergeProjectSettings(
    defaultSettings: Record<string, unknown>,
    userSettings: Record<string, unknown>,
  ): Record<string, unknown> {
    try {
      // 깊은 복사를 통한 안전한 병합
      const merged = {
        ...defaultSettings,
        ...userSettings,
      };

      // 중요한 설정 값 검증
      if (typeof merged.maxCollaborators === 'number') {
        merged.maxCollaborators = Math.min(Math.max(merged.maxCollaborators, 1), 1000);
      }

      this.logger.debug(
        `프로젝트 설정 병합: 기본=${Object.keys(defaultSettings).length}, 사용자=${Object.keys(userSettings).length}, 결과=${Object.keys(merged).length}`,
      );

      return merged;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `프로젝트 설정 병합 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      // 오류 시 기본 설정만 반환
      return { ...defaultSettings };
    }
  }

  /**
   * 프로젝트명 검증
   */
  private validateProjectName(name: string, errors: string[]): void {
    if (!name || name.trim().length === 0) {
      errors.push('프로젝트명은 필수입니다');
      return;
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      errors.push('프로젝트명은 2자 이상이어야 합니다');
    }
    if (trimmedName.length > 100) {
      errors.push('프로젝트명은 100자 이하여야 합니다');
    }
  }

  /**
   * 프로젝트 URL 검증
   */
  private validateProjectUrl(url: string | undefined, errors: string[]): void {
    if (!url) {
      return;
    }

    const urlValidation = this.validateUrl(url);
    if (!urlValidation.isValid) {
      errors.push(`URL 형식이 올바르지 않습니다: ${urlValidation.error}`);
    }
  }

  /**
   * 프로젝트 설명 검증
   */
  private validateProjectDescription(description: string | undefined, errors: string[]): void {
    if (description && description.length > 500) {
      errors.push('프로젝트 설명은 500자 이하여야 합니다');
    }
  }
}
