/**
 * 마우스 추적 관련 타입 정의
 * 실시간 마우스 추적 및 상태 관리에 사용되는 타입들
 */

import { MousePosition } from './collaboration.types';

/**
 * 마우스 추적 상태 인터페이스
 * 사용자별 마우스 추적 상태를 관리
 */
export interface MouseTrackingState {
  /** 마지막 마우스 위치 */
  lastPosition: MousePosition;
  /** 마지막 업데이트 시간 (타임스탬프) */
  lastUpdate: number;
  /** 마우스 이동 궤적 */
  trail: MousePosition[];
  /** 마우스 이동 속도 */
  velocity: {
    /** X축 속도 */
    dx: number;
    /** Y축 속도 */
    dy: number;
  };
  /** 유휴 상태 여부 */
  isIdle: boolean;
  /** 커서 색상 */
  color: string;
}

/**
 * 마우스 데이터 인터페이스
 * 마우스 위치 업데이트 시 전달되는 데이터
 */
export interface MouseData {
  /** 사용자 ID */
  userId: string;
  /** 사용자명 */
  username: string;
  /** 마우스 위치 */
  position: MousePosition;
  /** 커서 색상 (선택사항) */
  color?: string;
}

/**
 * 마우스 배치 데이터 인터페이스
 * 여러 마우스 위치를 한 번에 전달할 때 사용
 */
export interface MouseBatchData {
  /** 사용자 ID */
  userId: string;
  /** 사용자명 */
  username: string;
  /** 마우스 위치 배열 */
  positions: MousePosition[];
}

/**
 * 마우스 클릭 데이터 인터페이스
 * 마우스 클릭 이벤트 정보를 전달
 */
export interface MouseClickData {
  /** 사용자 ID */
  userId: string;
  /** 사용자명 */
  username: string;
  /** 클릭 위치 */
  position: MousePosition;
  /** 클릭 타입 (왼쪽/오른쪽/중간) */
  clickType: 'left' | 'right' | 'middle';
}

/**
 * 마우스 이벤트 페이로드 인터페이스
 * Socket.io를 통해 전달되는 마우스 이벤트 페이로드
 */
export interface MouseEventPayload {
  /** 프로젝트 ID */
  projectId: string;
  /** 사용자 ID */
  userId: string;
  /** 사용자명 */
  username: string;
  /** 이벤트 발생 시간 */
  timestamp: Date;
}

/**
 * 커서 이동 이벤트 페이로드
 */
export interface CursorMoveEventPayload extends MouseEventPayload {
  /** 마우스 위치 */
  position: MousePosition;
  /** 마우스 이동 속도 */
  velocity?: { dx: number; dy: number };
  /** 커서 색상 */
  color: string;
}

/**
 * 마우스 궤적 이벤트 페이로드
 */
export interface MouseTrailEventPayload extends MouseEventPayload {
  /** 마우스 위치 궤적 */
  trail: MousePosition[];
}

/**
 * 마우스 클릭 이벤트 페이로드
 */
export interface MouseClickEventPayload extends MouseEventPayload {
  /** 클릭 위치 */
  position: MousePosition;
  /** 클릭 타입 */
  clickType: 'left' | 'right' | 'middle';
}
