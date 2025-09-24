import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum MetricType {
  PROJECT_COUNT = 'PROJECT_COUNT',
  COLLABORATOR_COUNT = 'COLLABORATOR_COUNT',
  COMMENT_COUNT = 'COMMENT_COUNT',
  API_CALLS = 'API_CALLS',
  STORAGE_USAGE = 'STORAGE_USAGE',
  BANDWIDTH_USAGE = 'BANDWIDTH_USAGE',
  SESSION_TIME = 'SESSION_TIME',
  FILE_UPLOADS = 'FILE_UPLOADS',
  VIDEO_RECORDINGS = 'VIDEO_RECORDINGS',
  WEBHOOK_CALLS = 'WEBHOOK_CALLS',
  EXPORT_REQUESTS = 'EXPORT_REQUESTS',
}

export enum AggregationType {
  SUM = 'SUM', // 누적 합계 (API 호출 수, 댓글 수 등)
  MAX = 'MAX', // 최대값 (프로젝트 수, 협업자 수 등)
  AVERAGE = 'AVERAGE', // 평균 (세션 시간 등)
  COUNT = 'COUNT', // 개수 (로그인 횟수 등)
}

/**
 * 사용량 기록 엔티티
 *
 * 사용자별 각종 메트릭의 사용량을 추적합니다.
 * 일별 단위로 집계되며, 플랜 제한 확인에 사용됩니다.
 *
 * @example
 * ```typescript
 * const usage = new UsageRecord();
 * usage.userId = 'user-uuid';
 * usage.metricType = MetricType.API_CALLS;
 * usage.metricValue = 150;
 * usage.date = '2024-01-15';
 * ```
 */
@Entity('usage_records')
@Index(['userId', 'metricType', 'date'], { unique: true })
@Index(['userId', 'date'])
@Index(['metricType', 'date'])
export class UsageRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 사용자 ID
   */
  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  /**
   * 구독 ID (선택사항)
   */
  @Column({ name: 'subscription_id', type: 'uuid', nullable: true })
  subscriptionId?: string;

  /**
   * 기능 사용 타입
   */
  @Column({
    name: 'feature',
    type: 'varchar',
    length: 100,
  })
  @Index()
  feature: string;

  /**
   * 사용량
   */
  @Column({ name: 'quantity', type: 'integer', default: 1 })
  quantity: number;

  /**
   * 타임스탬프
   */
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Index()
  timestamp: Date;

  /**
   * 추가 메타데이터
   */
  @Column({ type: 'jsonb', default: '{}', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations would be added when implementing
  // @ManyToOne(() => User, user => user.usageRecords)
  // @JoinColumn({ name: 'user_id' })
  // user: User;

  /**
   * 오늘 날짜 문자열 생성
   */
  static getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * 특정 날짜 문자열 생성
   */
  static getDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * 날짜 범위 생성
   */
  static getDateRange(startDate: Date, endDate: Date): string[] {
    const dates: string[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      dates.push(this.getDateString(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  /**
   * 메트릭 값 증가
   */
  increment(value: number = 1): void {
    this.metricValue += value;
  }

  /**
   * 메트릭 값 설정 (MAX 타입에서 사용)
   */
  setMaxValue(value: number): void {
    if (this.aggregationType === AggregationType.MAX) {
      this.metricValue = Math.max(this.metricValue, value);
    } else {
      this.metricValue = value;
    }
  }

  /**
   * 평균 값 계산 (AVERAGE 타입에서 사용)
   */
  updateAverage(newValue: number, count: number): void {
    if (this.aggregationType === AggregationType.AVERAGE) {
      this.metricValue = Math.round((this.metricValue * (count - 1) + newValue) / count);
    }
  }

  /**
   * 메타데이터 업데이트
   */
  updateMetadata(key: string, value: any): void {
    if (!this.metadata) {
      this.metadata = {};
    }

    if (key === 'additionalInfo') {
      this.metadata.additionalInfo = { ...this.metadata.additionalInfo, ...value };
    } else {
      this.metadata[key] = value;
    }
  }

  /**
   * 주간 집계용 날짜 범위 확인
   */
  isInWeek(weekStart: Date): boolean {
    const recordDate = new Date(this.date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return recordDate >= weekStart && recordDate <= weekEnd;
  }

  /**
   * 월간 집계용 날짜 범위 확인
   */
  isInMonth(year: number, month: number): boolean {
    const recordDate = new Date(this.date);
    return recordDate.getFullYear() === year && recordDate.getMonth() === month - 1;
  }

  /**
   * 사용량 리셋 (새로운 주기 시작 시)
   */
  reset(): void {
    this.metricValue = 0;
    this.metadata = null;
  }

  /**
   * 제한 체크용 현재 주기 사용량 계산
   */
  static calculateCurrentPeriodUsage(
    records: UsageRecord[],
    metricType: MetricType,
    periodType: 'daily' | 'weekly' | 'monthly' = 'daily',
  ): number {
    const relevantRecords = records.filter((r) => r.metricType === metricType);

    if (relevantRecords.length === 0) return 0;

    const firstRecord = relevantRecords[0];

    switch (firstRecord.aggregationType) {
      case AggregationType.SUM:
      case AggregationType.COUNT:
        return relevantRecords.reduce((sum, record) => sum + record.metricValue, 0);

      case AggregationType.MAX:
        return Math.max(...relevantRecords.map((r) => r.metricValue));

      case AggregationType.AVERAGE:
        const total = relevantRecords.reduce((sum, record) => sum + record.metricValue, 0);
        return Math.round(total / relevantRecords.length);

      default:
        return relevantRecords[relevantRecords.length - 1]?.metricValue || 0;
    }
  }

  /**
   * 메트릭 타입별 기본 집계 타입 반환
   */
  static getDefaultAggregationType(metricType: MetricType): AggregationType {
    const aggregationMap: Record<MetricType, AggregationType> = {
      [MetricType.PROJECT_COUNT]: AggregationType.MAX,
      [MetricType.COLLABORATOR_COUNT]: AggregationType.MAX,
      [MetricType.COMMENT_COUNT]: AggregationType.SUM,
      [MetricType.API_CALLS]: AggregationType.SUM,
      [MetricType.STORAGE_USAGE]: AggregationType.MAX,
      [MetricType.BANDWIDTH_USAGE]: AggregationType.SUM,
      [MetricType.SESSION_TIME]: AggregationType.SUM,
      [MetricType.FILE_UPLOADS]: AggregationType.SUM,
      [MetricType.VIDEO_RECORDINGS]: AggregationType.SUM,
      [MetricType.WEBHOOK_CALLS]: AggregationType.SUM,
      [MetricType.EXPORT_REQUESTS]: AggregationType.SUM,
    };

    return aggregationMap[metricType] || AggregationType.SUM;
  }

  /**
   * 사용량 기록 생성 헬퍼
   */
  static create(
    userId: string,
    metricType: MetricType,
    value: number,
    date: string = UsageRecord.getTodayDateString(),
    metadata?: UsageRecord['metadata'],
  ): UsageRecord {
    const record = new UsageRecord();
    record.userId = userId;
    record.metricType = metricType;
    record.metricValue = value;
    record.date = date;
    record.aggregationType = this.getDefaultAggregationType(metricType);
    record.metadata = metadata;

    return record;
  }
}
