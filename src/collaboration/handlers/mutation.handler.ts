import { Injectable, Logger } from '@nestjs/common';

import { CreateCommentThreadDto } from '../dto/create-comment-thread.dto';
import { CreateMutationDto } from '../dto/create-mutation.dto';
import {
  BatchProcessResult,
  CommentThreadValidationResult,
  MutationEntityData,
  MutationProcessResult,
  MutationValidationResult,
  SingleMutationData,
} from '../types/mutation.handler.types';

/**
 * 뮤테이션 처리 관련 순수 비즈니스 로직을 처리하는 핸들러
 */
@Injectable()
export class MutationHandler {
  private readonly logger = new Logger(MutationHandler.name);

  /**
   * 뮤테이션 데이터 준비
   * @param projectId - 프로젝트 ID
   * @param mutationData - 뮤테이션 배치 데이터
   * @param mutation - 개별 뮤테이션
   * @returns 엔티티 생성용 데이터
   */
  prepareMutationData(
    projectId: string,
    mutationData: CreateMutationDto,
    mutation: SingleMutationData,
  ): MutationEntityData {
    try {
      const entityData: MutationEntityData = {
        projectId,
        userId: mutationData.profileID, // profileId를 userId로 매핑
        type: this.determineMutationType(mutation.name),
        metadata: {
          clientId: mutationData.clientID,
          mutationId: mutation.id,
          mutationName: mutation.name,
          args: mutation.args,
          pushVersion: mutationData.pushVersion || 0,
          schemaVersion: mutationData.schemaVersion || '',
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
        timestamp: new Date(mutation.timestamp),
      };

      this.logger.debug(
        `뮤테이션 데이터 준비: 프로젝트=${projectId}, 타입=${mutation.name} (${entityData.type})`,
      );

      return entityData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `뮤테이션 데이터 준비 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw error;
    }
  }

  /**
   * 뮤테이션 데이터 검증
   * @param mutationData - 뮤테이션 데이터
   * @returns 검증 결과
   */
  validateMutationData(mutationData: CreateMutationDto): MutationValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 필수 필드 검증
      this.validateRequiredFields(mutationData, errors);

      // 뮤테이션 배열 검증
      this.validateMutationsArray(mutationData, errors, warnings);

      // 버전 정보 검증
      this.validateVersionInfo(mutationData, errors);

      const isValid = errors.length === 0;

      this.logger.debug(
        `뮤테이션 데이터 검증: 유효성=${isValid}, 오류=${errors.length}, 경고=${warnings.length}`,
      );

      return { isValid, errors, warnings };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `뮤테이션 데이터 검증 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      return {
        isValid: false,
        errors: ['데이터 검증 중 오류가 발생했습니다'],
        warnings: [],
      };
    }
  }

  /**
   * 뮤테이션 타입 결정
   * @param mutationName - 뮤테이션 이름
   * @returns 뮤테이션 타입
   */
  determineMutationType(mutationName: string): string {
    try {
      const typeMap: Record<string, string> = {
        createCommentThread: 'comment_created',
        updateComment: 'comment_updated',
        deleteComment: 'comment_deleted',
        resolveThread: 'thread_resolved',
        unresolveThread: 'thread_unresolved',
        addReaction: 'reaction_added',
        removeReaction: 'reaction_removed',
        updateCursor: 'cursor_updated',
        joinSession: 'session_joined',
        leaveSession: 'session_left',
      };

      const type = typeMap[mutationName] || 'unknown';

      this.logger.debug(`뮤테이션 타입 결정: ${mutationName} -> ${type}`);
      return type;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `뮤테이션 타입 결정 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      return 'unknown';
    }
  }

  /**
   * 뮤테이션을 엔티티로 변환 준비
   * @param mutationData - 뮤테이션 데이터
   * @returns 변환된 엔티티 데이터
   */
  transformMutationToEntity(mutationData: MutationEntityData): Record<string, unknown> {
    try {
      const entityData = {
        ...mutationData,
        // 메타데이터 정규화
        metadata: {
          ...mutationData.metadata,
          transformedAt: new Date().toISOString(),
        },
        // 타임스탬프 검증
        timestamp: this.validateTimestamp(mutationData.timestamp),
      };

      this.logger.debug(
        `뮤테이션 엔티티 변환: 프로젝트=${entityData.projectId}, 타입=${entityData.type}`,
      );

      return entityData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `뮤테이션 엔티티 변환 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw error;
    }
  }

  /**
   * 코멘트 스레드 데이터 검증
   * @param threadData - 코멘트 스레드 데이터
   * @returns 검증 결과
   */
  validateCommentThreadData(threadData: CreateCommentThreadDto): CommentThreadValidationResult {
    const errors: string[] = [];

    try {
      // 좌표 검증
      this.validateCoordinates(threadData, errors);

      // 페이지 정보 검증
      this.validatePageInfo(threadData, errors);

      // 첫 번째 코멘트 검증
      this.validateFirstComment(threadData, errors);

      const isValid = errors.length === 0;

      this.logger.debug(
        `코멘트 스레드 데이터 검증: 좌표=(${threadData.x}, ${threadData.y}), 유효성=${isValid}`,
      );

      return { isValid, errors };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `코멘트 스레드 데이터 검증 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      return {
        isValid: false,
        errors: ['데이터 검증 중 오류가 발생했습니다'],
      };
    }
  }

  /**
   * 뮤테이션 처리 결과 생성
   * @param results - 개별 처리 결과 목록
   * @returns 배치 처리 결과
   */
  createBatchProcessResult(results: MutationProcessResult[]): BatchProcessResult {
    try {
      const totalMutations = results.length;
      const processedMutations = this.countSuccessfulMutations(results);
      const failedMutations = this.countFailedMutations(results);
      const successRate = this.calculateSuccessRate(processedMutations, totalMutations);
      const commonErrors = this.extractCommonErrors(results);

      const result: BatchProcessResult = {
        success: failedMutations === 0,
        processedMutations,
        failedMutations,
        results,
        summary: {
          successRate,
          totalMutations,
          commonErrors,
        },
      };

      this.logger.debug(
        `배치 처리 결과 생성: 성공=${processedMutations}, 실패=${failedMutations}, 성공률=${result.summary.successRate}%`,
      );

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `배치 처리 결과 생성 실패: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      return this.createErrorResult(results);
    }
  }

  /**
   * 뮤테이션 우선순위 계산
   * @param mutationName - 뮤테이션 이름
   * @returns 우선순위 (낮을수록 높은 우선순위)
   */
  calculateMutationPriority(mutationName: string): number {
    try {
      const priorityMap: Record<string, number> = {
        joinSession: 1,
        updateCursor: 2,
        createCommentThread: 3,
        updateComment: 4,
        addReaction: 5,
        resolveThread: 6,
        deleteComment: 7,
        removeReaction: 8,
        leaveSession: 9,
        unresolveThread: 10,
      };

      const priority = priorityMap[mutationName] || 99;

      this.logger.debug(`뮤테이션 우선순위 계산: ${mutationName} -> ${priority}`);
      return priority;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`뮤테이션 우선순위 계산 실패: ${errorMessage}`);
      return 99; // 최하위 우선순위
    }
  }

  /**
   * 필수 필드 검증
   */
  private validateRequiredFields(mutationData: CreateMutationDto, errors: string[]): void {
    if (!mutationData.profileID) {
      errors.push('profileID는 필수입니다');
    }

    if (!mutationData.clientID) {
      errors.push('clientID는 필수입니다');
    }
  }

  /**
   * 뮤테이션 배열 검증
   */
  private validateMutationsArray(
    mutationData: CreateMutationDto,
    errors: string[],
    warnings: string[],
  ): void {
    if (!mutationData.mutations || !Array.isArray(mutationData.mutations)) {
      errors.push('mutations 배열은 필수입니다');
      return;
    }

    // 개별 뮤테이션 검증
    mutationData.mutations.forEach((mutation, index) => {
      this.validateSingleMutation(mutation, index, errors, warnings);
    });

    // 뮤테이션 개수 제한
    if (mutationData.mutations.length > 100) {
      warnings.push(`뮤테이션 개수가 많음: ${mutationData.mutations.length}개 (권장: 100개 이하)`);
    }
  }

  /**
   * 개별 뮤테이션 검증
   */
  private validateSingleMutation(
    mutation: SingleMutationData,
    index: number,
    errors: string[],
    warnings: string[],
  ): void {
    if (!mutation.id && mutation.id !== 0) {
      errors.push(`뮤테이션 ${index}: id는 필수입니다`);
    }

    if (!mutation.name || typeof mutation.name !== 'string') {
      errors.push(`뮤테이션 ${index}: name은 필수 문자열입니다`);
    }

    if (!mutation.args || typeof mutation.args !== 'object') {
      errors.push(`뮤테이션 ${index}: args는 필수 객체입니다`);
    }

    this.validateMutationTimestamp(mutation, index, errors, warnings);
  }

  /**
   * 뮤테이션 타임스탬프 검증
   */
  private validateMutationTimestamp(
    mutation: { timestamp: number },
    index: number,
    errors: string[],
    warnings: string[],
  ): void {
    if (!mutation.timestamp || typeof mutation.timestamp !== 'number') {
      errors.push(`뮤테이션 ${index}: timestamp는 필수 숫자입니다`);
      return;
    }

    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneHourLater = now + 60 * 60 * 1000;

    if (mutation.timestamp < oneHourAgo) {
      warnings.push(`뮤테이션 ${index}: 타임스탬프가 너무 오래됨`);
    } else if (mutation.timestamp > oneHourLater) {
      warnings.push(`뮤테이션 ${index}: 타임스탬프가 미래 시간`);
    }
  }

  /**
   * 버전 정보 검증
   */
  private validateVersionInfo(mutationData: CreateMutationDto, errors: string[]): void {
    if (mutationData.pushVersion !== undefined && typeof mutationData.pushVersion !== 'number') {
      errors.push('pushVersion은 숫자여야 합니다');
    }

    if (
      mutationData.schemaVersion !== undefined &&
      typeof mutationData.schemaVersion !== 'string'
    ) {
      errors.push('schemaVersion은 문자열이어야 합니다');
    }
  }

  /**
   * 좌표 검증
   */
  private validateCoordinates(threadData: CreateCommentThreadDto, errors: string[]): void {
    if (typeof threadData.x !== 'number' || typeof threadData.y !== 'number') {
      errors.push('x, y 좌표는 숫자여야 합니다');
      return;
    }

    if (threadData.x < 0 || threadData.x > 10000) {
      errors.push('x 좌표는 0-10000 범위여야 합니다');
    }
    if (threadData.y < 0 || threadData.y > 10000) {
      errors.push('y 좌표는 0-10000 범위여야 합니다');
    }
  }

  /**
   * 페이지 정보 검증
   */
  private validatePageInfo(threadData: CreateCommentThreadDto, errors: string[]): void {
    if (!threadData.page && !threadData.deploymentUrl) {
      errors.push('page 또는 deploymentUrl 중 하나는 필수입니다');
    }
  }

  /**
   * 첫 번째 코멘트 검증
   */
  private validateFirstComment(threadData: CreateCommentThreadDto, errors: string[]): void {
    if (!threadData.firstComment) {
      errors.push('firstComment는 필수입니다');
      return;
    }

    if (!threadData.firstComment.body && !threadData.firstComment.text) {
      errors.push('첫 번째 코멘트의 내용(body 또는 text)은 필수입니다');
    }

    if (threadData.firstComment.body && threadData.firstComment.body.length > 5000) {
      errors.push('코멘트 본문은 5000자 이하여야 합니다');
    }

    if (threadData.firstComment.text && threadData.firstComment.text.length > 1000) {
      errors.push('코멘트 텍스트는 1000자 이하여야 합니다');
    }
  }

  /**
   * 성공한 뮤테이션 개수 계산
   */
  private countSuccessfulMutations(results: Array<{ status: 'success' | 'failed' }>): number {
    return results.filter((r) => r.status === 'success').length;
  }

  /**
   * 실패한 뮤테이션 개수 계산
   */
  private countFailedMutations(results: Array<{ status: 'success' | 'failed' }>): number {
    return results.filter((r) => r.status === 'failed').length;
  }

  /**
   * 성공률 계산
   */
  private calculateSuccessRate(processedMutations: number, totalMutations: number): number {
    if (totalMutations === 0) {
      return 0;
    }
    const successRate = (processedMutations / totalMutations) * 100;
    return Math.round(successRate * 100) / 100;
  }

  /**
   * 공통 오류 추출 및 분석
   */
  private extractCommonErrors(results: Array<{ error?: string }>): string[] {
    const errors = results.filter((r) => r.error).map((r) => r.error as string);
    const errorCounts = this.countErrorOccurrences(errors);

    return Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([error]) => error);
  }

  /**
   * 오류 발생 횟수 집계
   */
  private countErrorOccurrences(errors: string[]): Record<string, number> {
    return errors.reduce(
      (acc, error) => {
        acc[error] = (acc[error] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  /**
   * 에러 발생 시 기본 결과 생성
   */
  private createErrorResult(results: MutationProcessResult[]): BatchProcessResult {
    return {
      success: false,
      processedMutations: 0,
      failedMutations: results.length,
      results,
      summary: {
        successRate: 0,
        totalMutations: results.length,
        commonErrors: ['결과 생성 중 오류 발생'],
      },
    };
  }

  /**
   * 타임스탬프 검증 및 정규화
   * @param timestamp - 검증할 타임스탬프
   * @returns 정규화된 타임스탬프
   */
  private validateTimestamp(timestamp: Date): Date {
    try {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      // 타임스탬프가 너무 오래되었거나 미래인 경우 현재 시간으로 대체
      if (timestamp < oneWeekAgo || timestamp > oneHourLater) {
        this.logger.warn(`타임스탬프 정규화: ${timestamp.toISOString()} -> ${now.toISOString()}`);
        return now;
      }

      return timestamp;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`타임스탬프 검증 실패, 현재 시간 사용: ${errorMessage}`);
      return new Date();
    }
  }
}
