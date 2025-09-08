# Policy 디렉토리

## 개요
이 디렉토리는 Triad 협업 도구의 사용자 정책, 요금제, 구독 관리를 위한 설계 문서와 옵셔널 구현 코드를 포함합니다.

## 디렉토리 구조
```
policy/
├── README.md                    # 이 파일
├── DATABASE_STRUCTURE.md       # 데이터베이스 구조 설계서
├── PRICING_POLICY.md           # 요금제 및 정책 문서
├── IMPLEMENTATION_GUIDE.md     # 단계별 구현 가이드
└── entities/                   # TypeORM 엔티티 파일들 (옵셔널)
    ├── plan-tier.entity.ts     # 요금제 티어
    ├── subscription.entity.ts  # 구독 관리
    └── usage-record.entity.ts  # 사용량 추적
```

## 문서 설명

### 1. DATABASE_STRUCTURE.md
- 완전한 ERD 다이어그램
- 모든 테이블 구조와 관계
- 인덱스 및 제약조건
- 마이그레이션 전략

### 2. PRICING_POLICY.md  
- 요금제 체계 (FREE, STARTER, PROFESSIONAL, ENTERPRISE)
- 기능별 제한사항
- 결제 및 환불 정책
- 데이터 보존 정책

### 3. IMPLEMENTATION_GUIDE.md
- 5단계 구현 전략
- Phase별 상세 구현 방법
- 기능 토글링 전략
- API 버전 관리

### 4. entities/ 디렉토리
옵셔널하게 사용할 수 있는 TypeORM 엔티티들:

#### PlanTier (plan-tier.entity.ts)
- 요금제 정의 및 기능 설정
- JSONB를 활용한 유연한 설정
- 기능 체크 및 제한 확인 메서드

#### Subscription (subscription.entity.ts)  
- 사용자 구독 관리
- 결제 주기 및 상태 추적
- Stripe 연동을 위한 필드

#### UsageRecord (usage-record.entity.ts)
- 일별 사용량 추적
- 다양한 메트릭 타입 지원
- 집계 타입별 계산 로직

## 적용 방법

### 옵션 1: 전체 적용
1. 모든 엔티티를 `src/` 디렉토리로 복사
2. AppModule에 TypeORM 설정 추가
3. 마이그레이션 실행

### 옵션 2: 단계적 적용
1. Phase 1부터 순차적으로 적용
2. 환경 변수로 기능 토글링
3. 기존 시스템 영향 최소화

### 옵션 3: 참고용으로만 사용
- 문서만 활용하여 자체 구현
- 필요한 부분만 선택적 도입

## 환경 변수 설정

```bash
# 기능 토글링
ENABLE_SUBSCRIPTIONS=false
ENABLE_PAYMENTS=false  
ENABLE_USAGE_TRACKING=false
ENABLE_ENTERPRISE=false

# Stripe 설정 (Phase 3에서 필요)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 마이그레이션 예시

```typescript
// 기존 사용자를 FREE 플랜으로 마이그레이션
export class AddPlanSystem1234567890 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // 1. plan_tiers 테이블 생성
    // 2. 기본 플랜 데이터 삽입  
    // 3. users 테이블에 plan_tier_id 컬럼 추가
    // 4. 기존 사용자를 FREE 플랜으로 설정
  }
}
```

## 주의사항

1. **점진적 적용**: 기존 시스템에 영향을 주지 않도록 단계적으로 적용
2. **데이터 백업**: 마이그레이션 전 반드시 데이터 백업
3. **테스트**: 각 Phase별로 충분한 테스트 수행
4. **모니터링**: 새로운 기능 도입 시 성능 모니터링
5. **사용자 알림**: 정책 변경 시 사전 공지

## 관련 문서

- [CLAUDE.md](../CLAUDE.md) - 프로젝트 전체 가이드
- [rules/DEVELOPMENT_CONVENTION.md](../rules/DEVELOPMENT_CONVENTION.md) - 개발 컨벤션
- [src/config/](../src/config/) - 환경 설정 파일들

---

**참고**: 이 정책 시스템은 완전히 옵셔널입니다. 비즈니스 요구사항에 따라 선택적으로 적용하거나 참고용으로 사용할 수 있습니다.