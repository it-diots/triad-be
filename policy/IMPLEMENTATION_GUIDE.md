# 정책 시스템 구현 가이드

## 개요
사용자 정책 및 요금제 시스템을 단계적으로 구현하기 위한 가이드입니다.
기존 시스템에 영향을 최소화하면서 점진적으로 적용할 수 있도록 설계되었습니다.

## 구현 단계

### Phase 1: 기본 사용자 시스템 (현재)
**목표**: MVP 기능 개발 및 검증
**기간**: 개발 초기 단계

**구현 내용**:
- 기본 사용자 인증/인가
- 프로젝트 생성/관리
- 실시간 협업 기능
- 댓글 시스템

**데이터베이스**:
```typescript
// 기본 User 엔티티만 사용
interface User {
  id: string;
  email: string;
  password: string;
  username: string;
  role: UserRole; // USER, ADMIN
  status: UserStatus; // ACTIVE, INACTIVE
  createdAt: Date;
  updatedAt: Date;
}
```

### Phase 2: 플랜 시스템 도입
**목표**: 요금제 체계 구축 및 기능 제한
**기간**: MVP 검증 후

**구현 내용**:
1. PlanTier 엔티티 생성
2. 기본 요금제 설정 (FREE, STARTER, PROFESSIONAL)
3. 사용자별 플랜 할당 로직
4. 기능 제한 미들웨어

**구현 예시**:
```typescript
// 1. PlanTier 엔티티
@Entity('plan_tiers')
export class PlanTier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // FREE, STARTER, PROFESSIONAL

  @Column('jsonb')
  features: PlanFeatures;

  @Column('jsonb') 
  limits: PlanLimits;

  // ... other fields
}

// 2. User 엔티티 확장
@Entity('users')
export class User {
  // 기존 필드들...
  
  @ManyToOne(() => PlanTier, { eager: true })
  @JoinColumn({ name: 'plan_tier_id' })
  planTier: PlanTier;
  
  @Column({ name: 'plan_tier_id', nullable: true })
  planTierId: string;
}

// 3. 기능 제한 데코레이터
export function RequirePlan(planName: string) {
  return SetMetadata('requiredPlan', planName);
}

@Post('/projects')
@RequirePlan('STARTER')
async createProject(@Body() dto: CreateProjectDto) {
  // 프로젝트 생성 로직
}

// 4. 기능 제한 가드
@Injectable()
export class PlanGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlan = this.reflector.get<string>('requiredPlan', context.getHandler());
    
    if (!requiredPlan) {
      return true;
    }

    const user = context.switchToHttp().getRequest().user;
    const userPlanLevel = this.getPlanLevel(user.planTier.name);
    const requiredPlanLevel = this.getPlanLevel(requiredPlan);
    
    return userPlanLevel >= requiredPlanLevel;
  }

  private getPlanLevel(planName: string): number {
    const levels = { FREE: 0, STARTER: 1, PROFESSIONAL: 2, ENTERPRISE: 3 };
    return levels[planName] || 0;
  }
}
```

**마이그레이션 전략**:
```typescript
// 기존 사용자를 FREE 플랜으로 마이그레이션
export class AddPlanTierToUsers1234567890123 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // 1. plan_tiers 테이블 생성
    await queryRunner.createTable(new Table({
      name: 'plan_tiers',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid' },
        { name: 'name', type: 'varchar', isUnique: true },
        { name: 'features', type: 'jsonb' },
        { name: 'limits', type: 'jsonb' },
        // ... other columns
      ]
    }));

    // 2. 기본 플랜 데이터 삽입
    await queryRunner.query(`
      INSERT INTO plan_tiers (name, features, limits) VALUES
      ('FREE', '{"maxProjects": 3}', '{"dailyApiCalls": 100}'),
      ('STARTER', '{"maxProjects": 10}', '{"dailyApiCalls": 1000}')
    `);

    // 3. users 테이블에 plan_tier_id 컬럼 추가
    await queryRunner.addColumn('users', new TableColumn({
      name: 'plan_tier_id',
      type: 'uuid',
      isNullable: true
    }));

    // 4. 기존 사용자를 FREE 플랜으로 설정
    const freePlanId = await queryRunner.query("SELECT id FROM plan_tiers WHERE name = 'FREE'");
    await queryRunner.query(`
      UPDATE users SET plan_tier_id = '${freePlanId[0].id}'
    `);
  }
}
```

### Phase 3: 구독 및 결제 시스템
**목표**: 결제 기능 및 구독 관리
**기간**: Phase 2 안정화 후

**구현 내용**:
1. Subscription 엔티티 생성
2. 결제 시스템 연동 (Stripe)
3. 구독 상태 관리
4. 자동 결제 및 갱신

**구현 예시**:
```typescript
// 1. Subscription 엔티티
@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => PlanTier)
  planTier: PlanTier;

  @Column({ type: 'enum', enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @Column({ type: 'timestamp' })
  startsAt: Date;

  @Column({ type: 'timestamp' })
  endsAt: Date;

  @Column({ default: true })
  autoRenew: boolean;
}

// 2. 구독 서비스
@Injectable()
export class SubscriptionService {
  async createSubscription(userId: string, planId: string): Promise<Subscription> {
    const user = await this.userService.findById(userId);
    const plan = await this.planTierService.findById(planId);
    
    // Stripe 구독 생성
    const stripeSubscription = await this.stripeService.createSubscription({
      customerId: user.stripeCustomerId,
      priceId: plan.stripePriceId
    });

    // 로컬 구독 레코드 생성
    const subscription = this.subscriptionRepository.create({
      user,
      planTier: plan,
      status: SubscriptionStatus.ACTIVE,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
      stripeSubscriptionId: stripeSubscription.id
    });

    return this.subscriptionRepository.save(subscription);
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
        break;
    }
  }
}
```

### Phase 4: 사용량 추적 시스템
**목표**: 사용량 기반 제한 및 모니터링
**기간**: Phase 3 안정화 후

**구현 내용**:
1. UsageRecord 엔티티 생성
2. 실시간 사용량 추적
3. 사용량 기반 제한
4. 대시보드 및 알림

**구현 예시**:
```typescript
// 1. 사용량 추적 인터셉터
@Injectable()
export class UsageTrackingInterceptor implements NestInterceptor {
  constructor(private usageService: UsageService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (user && request.route?.path.includes('/api/')) {
      await this.usageService.recordUsage(user.id, MetricType.API_CALLS, 1);
    }

    return next.handle();
  }
}

// 2. 사용량 서비스
@Injectable()
export class UsageService {
  async recordUsage(userId: string, metricType: MetricType, value: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    await this.usageRepository.upsert({
      userId,
      metricType,
      date: today,
      metricValue: () => `metric_value + ${value}`
    }, ['userId', 'metricType', 'date']);
  }

  async checkLimit(userId: string, metricType: MetricType): Promise<boolean> {
    const user = await this.userService.findById(userId);
    const limit = user.planTier.limits[metricType];
    
    if (limit === -1) return true; // 무제한
    
    const usage = await this.getCurrentUsage(userId, metricType);
    return usage < limit;
  }
}
```

### Phase 5: 고급 정책 및 감사
**목표**: 엔터프라이즈 기능 및 거버넌스
**기간**: 엔터프라이즈 고객 확보 후

**구현 내용**:
1. 사용자 정책 관리
2. 감사 로그 시스템
3. 고급 보안 설정
4. 규정 준수 기능

## 기능 토글링 전략

환경 변수나 설정을 통해 각 Phase의 기능을 켜고 끌 수 있도록 구현:

```typescript
// config/features.config.ts
export default registerAs('features', () => ({
  subscriptions: process.env.ENABLE_SUBSCRIPTIONS === 'true',
  payments: process.env.ENABLE_PAYMENTS === 'true',
  usageTracking: process.env.ENABLE_USAGE_TRACKING === 'true',
  enterpriseFeatures: process.env.ENABLE_ENTERPRISE === 'true',
}));

// 기능 가드
@Injectable()
export class FeatureGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const feature = this.reflector.get<string>('feature', context.getHandler());
    return this.configService.get(`features.${feature}`, false);
  }
}

// 사용법
@Post('/subscribe')
@SetMetadata('feature', 'subscriptions')
@UseGuards(FeatureGuard)
async subscribe(@Body() dto: SubscribeDto) {
  // 구독 로직
}
```

## API 버전 관리

각 Phase별로 API 버전을 관리하여 하위 호환성 보장:

```typescript
@Controller({ version: '1' })
export class UserControllerV1 {
  // Phase 1 기능만 제공
}

@Controller({ version: '2' })  
export class UserControllerV2 {
  // Phase 2 기능 추가 (플랜 관리)
}

@Controller({ version: '3' })
export class UserControllerV3 {
  // Phase 3 기능 추가 (구독 관리)
}
```

## 모니터링 및 알림

각 Phase별 핵심 메트릭 모니터링:

```typescript
// Phase 1: 기본 메트릭
- 활성 사용자 수
- 프로젝트 생성 수
- 시스템 가동 시간

// Phase 2: 플랜 메트릭  
- 플랜별 사용자 분포
- 기능 사용률
- 제한 도달 빈도

// Phase 3: 비즈니스 메트릭
- MRR (Monthly Recurring Revenue)
- 구독 전환율
- 이탈률

// Phase 4: 사용량 메트릭
- API 호출 패턴
- 스토리지 사용량
- 대역폭 사용량
```

## 주의사항

1. **점진적 적용**: 각 Phase는 이전 Phase가 안정화된 후 진행
2. **데이터 마이그레이션**: 기존 데이터 손실 없이 마이그레이션
3. **성능 고려**: 사용량 추적 시 성능 영향 최소화
4. **보안**: 민감한 결제 정보는 외부 서비스 활용
5. **테스트**: 각 Phase별 철저한 테스트 수행
6. **문서화**: 변경사항에 대한 명확한 문서화
7. **사용자 통지**: 정책 변경 시 사전 공지

이 가이드를 통해 비즈니스 요구사항에 맞춰 유연하게 정책 시스템을 구축할 수 있습니다.