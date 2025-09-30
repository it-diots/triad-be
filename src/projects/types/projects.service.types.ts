/**
 * ProjectsService에서 사용하는 타입 정의
 */

/**
 * 프로젝트 설정
 */
export interface ProjectSettings {
  allowComments: boolean;
  allowGuests: boolean;
  isPublic: boolean;
}

/**
 * 프로젝트 목록 검색 결과
 */
export interface ProjectListResult {
  projects: unknown[];
  total: number;
  page: number;
  limit: number;
}
