import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

export enum PlanType {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
  CUSTOM = 'CUSTOM',
}

export interface PlanTierFeatures {
  maxProjects: number; // -1 for unlimited
  maxCollaborators: number; // -1 for unlimited
  maxStorageGB: number; // -1 for unlimited
  maxComments: number; // -1 for unlimited
  realTimeSync: boolean;
  videoRecording: boolean;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
  apiAccess: boolean;
  samlSSO: boolean;
  auditLogs: boolean;
  dedicatedSupport: boolean;
}

export interface PlanTierLimits {
  dailyApiCalls: number; // -1 for unlimited
  monthlyBandwidthGB: number; // -1 for unlimited
  concurrentSessions: number; // -1 for unlimited
  fileUploadSizeMB: number; // -1 for unlimited
  webhookEndpoints: number;
  exportFrequency: number; // per month, -1 for unlimited
}

/**
 * 요금제 티어 엔티티
 * 
 * 각 요금제의 기능과 제한사항을 정의합니다.
 * JSONB 컬럼을 사용하여 유연한 설정이 가능합니다.
 * 
 * @example
 * ```typescript
 * const freePlan = new PlanTier();
 * freePlan.name = PlanType.FREE;
 * freePlan.displayName = 'Free Plan';
 * freePlan.features = {
 *   maxProjects: 3,
 *   maxCollaborators: 5,
 *   realTimeSync: true,
 *   apiAccess: false,
 *   // ... other features
 * };
 * ```
 */
@Entity('plan_tiers')
export class PlanTier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 플랜 타입 (내부 식별자)
   */
  @Column({
    type: 'enum',
    enum: PlanType,
    unique: true,
  })
  name: PlanType;

  /**
   * 사용자에게 표시될 플랜 이름
   */
  @Column({ length: 100 })
  displayName: string;

  /**
   * 플랜 설명
   */
  @Column({ type: 'text', nullable: true })
  description: string;

  /**
   * 월간 요금 (USD)
   */
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  priceMonthly: number;

  /**
   * 연간 요금 (USD)
   */
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  priceYearly: number;

  /**
   * 플랜 기능 설정
   */
  @Column('jsonb')
  features: PlanTierFeatures;

  /**
   * 사용량 제한 설정
   */
  @Column('jsonb')
  limits: PlanTierLimits;

  /**
   * 플랜 활성화 여부
   */
  @Column({ default: true })
  isActive: boolean;

  /**
   * 표시 순서
   */
  @Column({ default: 0 })
  sortOrder: number;

  /**
   * Stripe Price ID (결제 연동용)
   */
  @Column({ nullable: true })
  stripePriceIdMonthly: string;

  /**
   * Stripe Price ID (연간) 
   */
  @Column({ nullable: true })
  stripePriceIdYearly: string;

  /**
   * 플랜 색상 (UI용)
   */
  @Column({ nullable: true })
  color: string;

  /**
   * 추천 플랜 여부
   */
  @Column({ default: false })
  isRecommended: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations would be added here when implementing
  // @OneToMany(() => Subscription, subscription => subscription.planTier)
  // subscriptions: Subscription[];

  /**
   * 특정 기능이 활성화되어 있는지 확인
   */
  hasFeature(feature: keyof PlanTierFeatures): boolean {
    return this.features[feature] === true;
  }

  /**
   * 사용량 제한 체크
   */
  checkLimit(limitType: keyof PlanTierLimits, currentUsage: number): boolean {
    const limit = this.limits[limitType];
    if (limit === -1) return true; // 무제한
    return currentUsage < limit;
  }

  /**
   * 플랜 업그레이드 가능 여부
   */
  canUpgradeTo(targetPlan: PlanTier): boolean {
    const planLevels = {
      [PlanType.FREE]: 0,
      [PlanType.STARTER]: 1,
      [PlanType.PROFESSIONAL]: 2,
      [PlanType.ENTERPRISE]: 3,
      [PlanType.CUSTOM]: 4,
    };

    return planLevels[this.name] < planLevels[targetPlan.name];
  }

  /**
   * 월간/연간 요금 할인율 계산
   */
  getYearlyDiscount(): number {
    if (this.priceMonthly === 0) return 0;
    const monthlyTotal = this.priceMonthly * 12;
    const discount = ((monthlyTotal - this.priceYearly) / monthlyTotal) * 100;
    return Math.round(discount);
  }
}