import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  TRIAL = 'TRIAL',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
  PAST_DUE = 'PAST_DUE',
}

export enum BillingInterval {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
  INVOICE = 'INVOICE',
}

/**
 * 사용자 구독 엔티티
 *
 * 사용자의 플랜 구독 정보를 관리합니다.
 * Stripe 등의 외부 결제 서비스와 연동됩니다.
 *
 * @example
 * ```typescript
 * const subscription = new Subscription();
 * subscription.userId = 'user-uuid';
 * subscription.planTierId = 'plan-uuid';
 * subscription.status = SubscriptionStatus.ACTIVE;
 * subscription.billingInterval = BillingInterval.MONTHLY;
 * ```
 */
@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 구독 사용자 ID
   */
  @Column('uuid')
  userId: string;

  /**
   * 플랜 티어 ID
   */
  @Column('uuid')
  planTierId: string;

  /**
   * 구독 상태
   */
  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
  })
  status: SubscriptionStatus;

  /**
   * 결제 주기
   */
  @Column({
    type: 'enum',
    enum: BillingInterval,
    default: BillingInterval.MONTHLY,
  })
  billingInterval: BillingInterval;

  /**
   * 결제 수단
   */
  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true,
  })
  paymentMethod: PaymentMethod;

  /**
   * 구독 시작일
   */
  @Column('timestamp')
  startsAt: Date;

  /**
   * 구독 종료일
   */
  @Column('timestamp')
  endsAt: Date;

  /**
   * 무료 체험 종료일
   */
  @Column('timestamp', { nullable: true })
  trialEndsAt: Date;

  /**
   * 자동 갱신 여부
   */
  @Column({ default: true })
  autoRenew: boolean;

  /**
   * 취소 요청 일시
   */
  @Column('timestamp', { nullable: true })
  cancelledAt: Date;

  /**
   * 취소 사유
   */
  @Column({ nullable: true })
  cancellationReason: string;

  /**
   * Stripe 구독 ID
   */
  @Column({ nullable: true })
  stripeSubscriptionId: string;

  /**
   * Stripe 고객 ID
   */
  @Column({ nullable: true })
  stripeCustomerId: string;

  /**
   * 다음 결제 예정일
   */
  @Column('timestamp', { nullable: true })
  nextBillingDate: Date;

  /**
   * 현재 결제 금액
   */
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  currentAmount: number;

  /**
   * 통화
   */
  @Column({ length: 3, default: 'USD' })
  currency: string;

  /**
   * 구독 메타데이터
   */
  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations would be added when implementing
  // @ManyToOne(() => User, user => user.subscriptions)
  // @JoinColumn({ name: 'user_id' })
  // user: User;

  // @ManyToOne(() => PlanTier, planTier => planTier.subscriptions)
  // @JoinColumn({ name: 'plan_tier_id' })
  // planTier: PlanTier;

  // @OneToMany(() => Payment, payment => payment.subscription)
  // payments: Payment[];

  /**
   * 구독이 활성 상태인지 확인
   */
  isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE || this.status === SubscriptionStatus.TRIAL;
  }

  /**
   * 무료 체험 중인지 확인
   */
  isTrial(): boolean {
    return (
      this.status === SubscriptionStatus.TRIAL && this.trialEndsAt && this.trialEndsAt > new Date()
    );
  }

  /**
   * 구독 만료 여부 확인
   */
  isExpired(): boolean {
    return this.endsAt < new Date();
  }

  /**
   * 취소된 구독인지 확인
   */
  isCancelled(): boolean {
    return this.status === SubscriptionStatus.CANCELLED;
  }

  /**
   * 자동 갱신 예정인지 확인
   */
  willAutoRenew(): boolean {
    return this.autoRenew && this.isActive() && !this.isCancelled();
  }

  /**
   * 구독 기간 계산 (일 단위)
   */
  getDurationInDays(): number {
    const diffTime = this.endsAt.getTime() - this.startsAt.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * 남은 구독 기간 (일 단위)
   */
  getRemainingDays(): number {
    if (!this.isActive()) return 0;

    const now = new Date();
    const diffTime = this.endsAt.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  /**
   * 다음 결제까지 남은 일수
   */
  getDaysUntilNextBilling(): number {
    if (!this.nextBillingDate) return 0;

    const now = new Date();
    const diffTime = this.nextBillingDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  /**
   * 구독 취소 (즉시 또는 기간 종료 시)
   */
  cancel(immediately: boolean = false, reason?: string): void {
    this.status = SubscriptionStatus.CANCELLED;
    this.cancelledAt = new Date();
    this.autoRenew = false;

    if (reason) {
      this.cancellationReason = reason;
    }

    if (immediately) {
      this.endsAt = new Date();
    }
  }

  /**
   * 구독 일시 정지
   */
  suspend(): void {
    this.status = SubscriptionStatus.SUSPENDED;
  }

  /**
   * 구독 재개
   */
  resume(): void {
    if (this.status === SubscriptionStatus.SUSPENDED) {
      this.status = SubscriptionStatus.ACTIVE;
    }
  }

  /**
   * 무료 체험 시작
   */
  startTrial(trialDays: number = 14): void {
    const now = new Date();
    this.status = SubscriptionStatus.TRIAL;
    this.startsAt = now;
    this.trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
    this.endsAt = this.trialEndsAt;
  }

  /**
   * 체험을 유료 구독으로 전환
   */
  convertTrialToActive(): void {
    if (this.status === SubscriptionStatus.TRIAL) {
      this.status = SubscriptionStatus.ACTIVE;

      // 결제 주기에 따라 종료일 설정
      const monthsToAdd = this.billingInterval === BillingInterval.YEARLY ? 12 : 1;
      this.endsAt = new Date();
      this.endsAt.setMonth(this.endsAt.getMonth() + monthsToAdd);

      // 다음 결제일 설정
      this.nextBillingDate = new Date(this.endsAt);
    }
  }

  /**
   * 구독 갱신
   */
  renew(): void {
    if (!this.isActive()) return;

    const monthsToAdd = this.billingInterval === BillingInterval.YEARLY ? 12 : 1;
    this.endsAt = new Date(this.endsAt);
    this.endsAt.setMonth(this.endsAt.getMonth() + monthsToAdd);

    this.nextBillingDate = new Date(this.endsAt);
  }

  /**
   * 구독료 계산
   */
  calculateAmount(planTier: { priceMonthly: number; priceYearly: number }): number {
    return this.billingInterval === BillingInterval.YEARLY
      ? planTier.priceYearly
      : planTier.priceMonthly;
  }
}
