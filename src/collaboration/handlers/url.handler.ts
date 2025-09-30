import { createHash } from 'crypto';

import { Injectable, Logger } from '@nestjs/common';

import {
  UrlAnalysisResult,
  UrlBatchConversionResult,
  UrlConversionResult,
  UrlSecurityValidationResult,
  UrlValidationResult,
} from '../types/url.handler.types';

/**
 * URL 기반 프로젝트 처리 순수 비즈니스 로직 핸들러
 */
@Injectable()
export class UrlHandler {
  private readonly logger = new Logger(UrlHandler.name);

  /**
   * URL을 프로젝트 ID로 변환
   * @param url - 대상 URL
   * @returns 프로젝트 ID (UUID v5 형식)
   */
  urlToProjectId(url: string): string {
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
   * URL 유효성 검증
   * @param url - 검증할 URL
   * @returns 유효성 검증 결과
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
   * URL에서 도메인 추출
   * @param url - 대상 URL
   * @returns 추출된 도메인
   */
  extractDomainFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      let hostname = urlObj.hostname;

      // www. 접두사 제거
      hostname = hostname.replace(/^www\./, '');

      this.logger.debug(`URL에서 도메인 추출: ${url} -> ${hostname}`);
      return hostname;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `URL에서 도메인 추출 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      // 오류 시 URL을 그대로 반환 (기본값)
      return url;
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
   * 프로젝트 기본 설정 생성
   * @param isUrlBased - URL 기반 프로젝트 여부
   * @returns 기본 설정 객체
   */
  createDefaultSettings(isUrlBased: boolean = true): Record<string, unknown> {
    try {
      const baseSettings = {
        allowComments: true,
        allowGuests: true,
        isPublic: true,
        maxCollaborators: 50,
        enableRealTimeSync: true,
        enableMouseTracking: true,
        enableNotifications: true,
      };

      const urlBasedSettings = isUrlBased
        ? {
            autoCreateFromUrl: true, // URL 기반 자동 생성 플래그
            urlBasedProject: true,
            autoSync: true,
          }
        : {};

      const settings = { ...baseSettings, ...urlBasedSettings };

      this.logger.debug(
        `프로젝트 기본 설정 생성: URL기반=${isUrlBased}, 설정수=${Object.keys(settings).length}`,
      );

      return settings;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `프로젝트 기본 설정 생성 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      // 오류 시 최소한의 설정 반환
      return {
        allowComments: true,
        isPublic: true,
        enableRealTimeSync: true,
      };
    }
  }

  /**
   * 채널명 생성
   * @param projectId - 프로젝트 ID
   * @param channelType - 채널 타입 (기본값: 'project')
   * @returns 생성된 채널명
   */
  generateChannelName(projectId: string, channelType: string = 'project'): string {
    try {
      // 프로젝트 ID 검증
      if (!projectId || projectId.length === 0) {
        throw new Error('프로젝트 ID는 필수입니다');
      }

      // 채널 타입 검증
      const validChannelTypes = ['project', 'session', 'comments', 'cursor', 'mutations'];
      if (!validChannelTypes.includes(channelType)) {
        this.logger.warn(`알 수 없는 채널 타입: ${channelType}, 기본값 사용`);
        channelType = 'project';
      }

      const channelName = `${channelType}:${projectId}`;

      this.logger.debug(
        `채널명 생성: 프로젝트=${projectId}, 타입=${channelType} -> ${channelName}`,
      );
      return channelName;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `채널명 생성 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      // 오류 시 기본 채널명 반환
      return `project:${projectId || 'unknown'}`;
    }
  }

  /**
   * URL 목록을 프로젝트 ID 목록으로 변환
   * @param urls - URL 목록
   * @returns 프로젝트 ID 목록과 변환 결과
   */
  convertUrlsToProjectIds(urls: string[]): UrlBatchConversionResult {
    const projectIds: string[] = [];
    const results: UrlConversionResult[] = [];

    try {
      for (const url of urls) {
        const result = this.convertSingleUrl(url);
        results.push(result);

        if (result.success && result.projectId) {
          projectIds.push(result.projectId);
        }
      }

      this.logger.debug(
        `URL 목록 변환: 입력=${urls.length}, 성공=${projectIds.length}, 실패=${results.filter((r) => !r.success).length}`,
      );

      return { projectIds, results };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `URL 목록 변환 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      return this.createFailedConversionResult(urls);
    }
  }

  /**
   * URL 패턴 분석
   * @param url - 분석할 URL
   * @returns URL 패턴 분석 결과
   */
  analyzeUrlPattern(url: string): UrlAnalysisResult {
    try {
      const urlObj = new URL(url);

      const isLocalhost = this.checkIsLocalhost(urlObj.hostname);
      const isDevelopment = this.checkIsDevelopment(urlObj.hostname, isLocalhost);
      const hasPath = !!(urlObj.pathname && urlObj.pathname !== '/');
      const hasQuery = !!(urlObj.search && urlObj.search.length > 0);
      const hasFragment = !!(urlObj.hash && urlObj.hash.length > 0);
      const pathSegments = urlObj.pathname.split('/').filter((segment) => segment.length > 0);
      const estimatedProjectType = this.estimateProjectType(urlObj.hostname, isDevelopment);

      const analysis: UrlAnalysisResult = {
        isLocalhost,
        isDevelopment,
        hasPath,
        hasQuery,
        hasFragment,
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        pathSegments,
        estimatedProjectType,
      };

      this.logger.debug(
        `URL 패턴 분석: ${url} -> 타입=${estimatedProjectType}, 개발환경=${isDevelopment}`,
      );
      return analysis;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `URL 패턴 분석 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      return this.createDefaultUrlAnalysis();
    }
  }

  /**
   * URL 시큐리티 검증
   * @param url - 검증할 URL
   * @returns 시큐리티 검증 결과
   */
  validateUrlSecurity(url: string): UrlSecurityValidationResult {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    try {
      const urlObj = new URL(url);

      // HTTP 프로토콜 경고
      this.checkProtocolSecurity(urlObj, warnings, recommendations);

      // 의심스러운 도메인 패턴 검사
      this.checkSuspiciousDomainPatterns(urlObj.hostname, warnings, recommendations);

      // 포트 번호 검사
      this.checkPortSecurity(urlObj.port, warnings, recommendations);

      const isSafe = warnings.length === 0;

      this.logger.debug(`URL 시큐리티 검증: ${url} -> 안전=${isSafe}, 경고=${warnings.length}`);

      return { isSafe, warnings, recommendations };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `URL 시큐리티 검증 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      return {
        isSafe: false,
        warnings: ['URL 형식 오류'],
        recommendations: ['올바른 URL 형식 사용'],
      };
    }
  }

  /**
   * 프로토콜 보안 검증
   */
  private checkProtocolSecurity(urlObj: URL, warnings: string[], recommendations: string[]): void {
    if (
      urlObj.protocol === 'http:' &&
      urlObj.hostname !== 'localhost' &&
      urlObj.hostname !== '127.0.0.1'
    ) {
      warnings.push('비보안 HTTP 프로토콜 사용');
      recommendations.push('HTTPS 프로토콜 사용 권장');
    }
  }

  /**
   * 의심스러운 도메인 패턴 검사
   */
  private checkSuspiciousDomainPatterns(
    hostname: string,
    warnings: string[],
    recommendations: string[],
  ): void {
    const suspiciousPatterns = [
      /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/, // IP 주소
      /[a-zA-Z0-9]+-[a-zA-Z0-9]+-[a-zA-Z0-9]+\./, // 무작위 서브도메인
      /bit\.ly|tinyurl|t\.co/, // URL 단축 서비스
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(hostname)) {
        warnings.push(`의심스러운 도메인 패턴: ${hostname}`);
        recommendations.push('도메인 신뢰성 확인 필요');
        break;
      }
    }
  }

  /**
   * 포트 번호 보안 검증
   */
  private checkPortSecurity(port: string, warnings: string[], recommendations: string[]): void {
    if (port && !['80', '443', '3000', '3001', '8000', '8080'].includes(port)) {
      warnings.push(`비표준 포트 사용: ${port}`);
      recommendations.push('표준 포트 사용 권장');
    }
  }

  /**
   * 단일 URL 변환
   */
  private convertSingleUrl(url: string): UrlConversionResult {
    try {
      const projectId = this.urlToProjectId(url);
      return {
        url,
        projectId,
        success: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        url,
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 변환 실패 시 기본 결과 생성
   */
  private createFailedConversionResult(urls: string[]): UrlBatchConversionResult {
    return {
      projectIds: [],
      results: urls.map((url) => ({
        url,
        success: false,
        error: '일괄 변환 중 오류 발생',
      })),
    };
  }

  /**
   * 로컬호스트 여부 확인
   */
  private checkIsLocalhost(hostname: string): boolean {
    return hostname === 'localhost' || hostname === '127.0.0.1';
  }

  /**
   * 개발 환경 여부 확인
   */
  private checkIsDevelopment(hostname: string, isLocalhost: boolean): boolean {
    return (
      isLocalhost ||
      hostname.endsWith('.local') ||
      hostname.includes('dev') ||
      hostname.includes('test')
    );
  }

  /**
   * 프로젝트 타입 추정
   */
  private estimateProjectType(
    hostname: string,
    isDevelopment: boolean,
  ): 'development' | 'staging' | 'production' {
    if (isDevelopment) {
      return 'development';
    }
    if (hostname.includes('staging') || hostname.includes('stg')) {
      return 'staging';
    }
    return 'production';
  }

  /**
   * 기본 URL 분석 결과 생성
   */
  private createDefaultUrlAnalysis(): UrlAnalysisResult {
    return {
      isLocalhost: false,
      isDevelopment: false,
      hasPath: false,
      hasQuery: false,
      hasFragment: false,
      protocol: 'https:',
      hostname: 'unknown',
      pathSegments: [],
      estimatedProjectType: 'production',
    };
  }
}
