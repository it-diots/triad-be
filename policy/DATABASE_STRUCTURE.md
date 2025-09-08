# 데이터베이스 구조 설계 - 사용자 정책 및 요금제

## 개요
Triad 협업 도구의 사용자 정책, 요금제 티어, 구독 관리를 위한 데이터베이스 구조입니다.
이 구조는 옵셔널하게 적용할 수 있도록 설계되었습니다.

## ERD 다이어그램

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    users    │────│  subscriptions  │────│   plan_tiers    │
│             │    │                 │    │                 │
│ - id (PK)   │    │ - id (PK)       │    │ - id (PK)       │
│ - email     │    │ - user_id (FK)  │    │ - name          │
│ - username  │    │ - tier_id (FK)  │    │ - display_name  │
│ - password  │    │ - status        │    │ - description   │
│ - role      │    │ - starts_at     │    │ - price_monthly │
│ - status    │    │ - ends_at       │    │ - price_yearly  │
│ - created_at│    │ - created_at    │    │ - features      │
│ - updated_at│    │ - updated_at    │    │ - limits        │
└─────────────┘    └─────────────────┘    │ - is_active     │
                                          │ - sort_order    │
                                          │ - created_at    │
                                          │ - updated_at    │
                                          └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  usage_records  │    │   payments      │    │  user_policies  │
│                 │    │                 │    │                 │
│ - id (PK)       │    │ - id (PK)       │    │ - id (PK)       │
│ - user_id (FK)  │    │ - user_id (FK)  │    │ - user_id (FK)  │
│ - metric_type   │    │ - subscription  │    │ - policy_type   │
│ - metric_value  │    │ - amount        │    │ - policy_value  │
│ - date          │    │ - currency      │    │ - is_active     │
│ - created_at    │    │ - payment_id    │    │ - created_at    │
└─────────────────┘    │ - status        │    │ - updated_at    │
                       │ - created_at    │    └─────────────────┘
                       └─────────────────┘

┌─────────────────┐    ┌─────────────────┐
│ project_members │    │   audit_logs    │
│                 │    │                 │
│ - id (PK)       │    │ - id (PK)       │
│ - project_id    │    │ - user_id (FK)  │
│ - user_id (FK)  │    │ - action        │
│ - role          │    │ - resource_type │
│ - permissions   │    │ - resource_id   │
│ - created_at    │    │ - details       │
│ - updated_at    │    │ - ip_address    │
└─────────────────┘    │ - user_agent    │
                       │ - created_at    │
                       └─────────────────┘
```

## 엔티티 상세 설계

### 1. PlanTier (요금제 티어)

```typescript
enum PlanType {
  FREE = 'FREE',
  STARTER = 'STARTER', 
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
  CUSTOM = 'CUSTOM'
}

interface PlanTierFeatures {
  maxProjects: number;
  maxCollaborators: number;
  maxStorageGB: number;
  maxComments: number;
  realTimeSync: boolean;
  videoRecording: boolean;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
  apiAccess: boolean;
}

interface PlanTierLimits {
  dailyApiCalls: number;
  monthlyBandwidthGB: number;
  concurrentSessions: number;
  fileUploadSizeMB: number;
}
```

**테이블**: `plan_tiers`
- `id`: UUID (Primary Key)
- `name`: VARCHAR(50) - 플랜 식별자 (FREE, STARTER 등)
- `display_name`: VARCHAR(100) - 사용자에게 표시될 이름
- `description`: TEXT - 플랜 설명
- `price_monthly`: DECIMAL(10,2) - 월 요금 (USD)
- `price_yearly`: DECIMAL(10,2) - 연 요금 (USD) 
- `features`: JSONB - 기능 설정
- `limits`: JSONB - 사용량 제한
- `is_active`: BOOLEAN - 활성화 여부
- `sort_order`: INTEGER - 표시 순서
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 2. Subscription (구독)

```typescript
enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED', 
  EXPIRED = 'EXPIRED',
  TRIAL = 'TRIAL',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED'
}
```

**테이블**: `subscriptions`
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key → users.id)
- `tier_id`: UUID (Foreign Key → plan_tiers.id)
- `status`: ENUM(SubscriptionStatus)
- `starts_at`: TIMESTAMP - 구독 시작일
- `ends_at`: TIMESTAMP - 구독 종료일
- `trial_ends_at`: TIMESTAMP - 무료 체험 종료일
- `auto_renew`: BOOLEAN - 자동 갱신 여부
- `payment_method`: VARCHAR(50) - 결제 방법
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 3. UsageRecord (사용량 기록)

```typescript
enum MetricType {
  PROJECT_COUNT = 'PROJECT_COUNT',
  COLLABORATOR_COUNT = 'COLLABORATOR_COUNT',
  COMMENT_COUNT = 'COMMENT_COUNT',
  API_CALLS = 'API_CALLS',
  STORAGE_USAGE = 'STORAGE_USAGE',
  BANDWIDTH_USAGE = 'BANDWIDTH_USAGE',
  SESSION_TIME = 'SESSION_TIME'
}
```

**테이블**: `usage_records`
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key → users.id)
- `metric_type`: ENUM(MetricType)
- `metric_value`: INTEGER - 사용량 값
- `date`: DATE - 기록 날짜
- `metadata`: JSONB - 추가 정보
- `created_at`: TIMESTAMP

### 4. Payment (결제)

```typescript
enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}
```

**테이블**: `payments`
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key → users.id)
- `subscription_id`: UUID (Foreign Key → subscriptions.id)
- `amount`: DECIMAL(10,2) - 결제 금액
- `currency`: VARCHAR(3) - 통화 코드 (USD, KRW 등)
- `payment_method`: VARCHAR(50) - 결제 수단
- `payment_provider`: VARCHAR(50) - 결제 업체 (stripe, paypal 등)
- `provider_payment_id`: VARCHAR(255) - 결제 업체 거래 ID
- `status`: ENUM(PaymentStatus)
- `paid_at`: TIMESTAMP - 결제 완료 시간
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 5. UserPolicy (사용자 정책)

```typescript
enum PolicyType {
  DATA_RETENTION = 'DATA_RETENTION',
  EXPORT_FREQUENCY = 'EXPORT_FREQUENCY', 
  NOTIFICATION_SETTINGS = 'NOTIFICATION_SETTINGS',
  PRIVACY_SETTINGS = 'PRIVACY_SETTINGS',
  SECURITY_SETTINGS = 'SECURITY_SETTINGS'
}
```

**테이블**: `user_policies`
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key → users.id)
- `policy_type`: ENUM(PolicyType)
- `policy_value`: JSONB - 정책 설정 값
- `is_active`: BOOLEAN - 활성화 여부
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 6. AuditLog (감사 로그)

```typescript
enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE', 
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  SUBSCRIBE = 'SUBSCRIBE',
  UNSUBSCRIBE = 'UNSUBSCRIBE',
  PAYMENT = 'PAYMENT'
}

enum ResourceType {
  USER = 'USER',
  PROJECT = 'PROJECT',
  COMMENT = 'COMMENT',
  SUBSCRIPTION = 'SUBSCRIPTION',
  PAYMENT = 'PAYMENT'
}
```

**테이블**: `audit_logs`
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key → users.id) - NULL 가능
- `action`: ENUM(AuditAction)
- `resource_type`: ENUM(ResourceType)
- `resource_id`: UUID - 대상 리소스 ID
- `details`: JSONB - 상세 정보
- `ip_address`: INET - IP 주소
- `user_agent`: TEXT - 사용자 에이전트
- `created_at`: TIMESTAMP

### 7. User (사용자) - 확장

기존 User 엔티티에 추가 필드:
- `subscription_id`: UUID (Foreign Key → subscriptions.id) - 현재 구독
- `trial_started_at`: TIMESTAMP - 무료 체험 시작일
- `last_login_at`: TIMESTAMP - 마지막 로그인
- `email_verified_at`: TIMESTAMP - 이메일 인증 완료일
- `preferences`: JSONB - 사용자 설정

## 인덱스 설계

```sql
-- 성능 최적화를 위한 인덱스
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_ends_at ON subscriptions(ends_at);

CREATE INDEX idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX idx_usage_records_date ON usage_records(date);
CREATE INDEX idx_usage_records_metric_type ON usage_records(metric_type);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX idx_user_policies_user_id ON user_policies(user_id);
CREATE INDEX idx_user_policies_type ON user_policies(policy_type);

CREATE INDEX idx_plan_tiers_active ON plan_tiers(is_active, sort_order);
```

## 기본 요금제 데이터

```sql
-- 기본 요금제 설정
INSERT INTO plan_tiers (id, name, display_name, description, price_monthly, price_yearly, features, limits, is_active, sort_order) VALUES
(
  gen_random_uuid(),
  'FREE', 
  'Free Plan',
  '개인 사용자를 위한 무료 플랜',
  0.00,
  0.00,
  '{
    "maxProjects": 3,
    "maxCollaborators": 5,
    "maxStorageGB": 1,
    "maxComments": 100,
    "realTimeSync": true,
    "videoRecording": false,
    "advancedAnalytics": false,
    "prioritySupport": false,
    "customBranding": false,
    "apiAccess": false
  }',
  '{
    "dailyApiCalls": 100,
    "monthlyBandwidthGB": 5,
    "concurrentSessions": 2,
    "fileUploadSizeMB": 10
  }',
  true,
  1
),
(
  gen_random_uuid(),
  'STARTER',
  'Starter Plan', 
  '소규모 팀을 위한 시작 플랜',
  9.99,
  99.00,
  '{
    "maxProjects": 10,
    "maxCollaborators": 15,
    "maxStorageGB": 10,
    "maxComments": 1000,
    "realTimeSync": true,
    "videoRecording": true,
    "advancedAnalytics": false,
    "prioritySupport": false,
    "customBranding": false,
    "apiAccess": true
  }',
  '{
    "dailyApiCalls": 1000,
    "monthlyBandwidthGB": 50,
    "concurrentSessions": 5,
    "fileUploadSizeMB": 50
  }',
  true,
  2
),
(
  gen_random_uuid(),
  'PROFESSIONAL',
  'Professional Plan',
  '중간 규모 팀을 위한 프로페셔널 플랜', 
  29.99,
  299.00,
  '{
    "maxProjects": -1,
    "maxCollaborators": 50,
    "maxStorageGB": 100,
    "maxComments": -1,
    "realTimeSync": true,
    "videoRecording": true,
    "advancedAnalytics": true,
    "prioritySupport": true,
    "customBranding": true,
    "apiAccess": true
  }',
  '{
    "dailyApiCalls": 10000,
    "monthlyBandwidthGB": 500,
    "concurrentSessions": 20,
    "fileUploadSizeMB": 200
  }',
  true,
  3
);
```

## 제약 조건

```sql
-- Foreign Key 제약 조건
ALTER TABLE subscriptions 
  ADD CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_subscriptions_tier FOREIGN KEY (tier_id) REFERENCES plan_tiers(id);

ALTER TABLE usage_records 
  ADD CONSTRAINT fk_usage_records_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE payments 
  ADD CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_payments_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id);

ALTER TABLE user_policies 
  ADD CONSTRAINT fk_user_policies_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Check 제약 조건
ALTER TABLE plan_tiers 
  ADD CONSTRAINT check_price_positive CHECK (price_monthly >= 0 AND price_yearly >= 0);

ALTER TABLE payments 
  ADD CONSTRAINT check_amount_positive CHECK (amount >= 0);

ALTER TABLE subscriptions 
  ADD CONSTRAINT check_subscription_dates CHECK (starts_at <= ends_at);
```

## 마이그레이션 전략

1. **Phase 1**: 기본 사용자 시스템만 구현 (현재)
2. **Phase 2**: PlanTier와 Subscription 테이블 추가
3. **Phase 3**: 결제 시스템 (Payment) 추가  
4. **Phase 4**: 사용량 추적 (UsageRecord) 추가
5. **Phase 5**: 정책 관리 (UserPolicy, AuditLog) 추가

각 단계는 기존 시스템에 영향을 주지 않고 추가할 수 있도록 설계되었습니다.

## 주의사항

- 모든 테이블은 옵셔널하게 적용 가능
- 기존 사용자는 자동으로 FREE 플랜으로 마이그레이션
- JSONB 필드는 PostgreSQL 전용 (다른 DB 사용 시 TEXT로 대체)
- 모든 금액은 USD 기준 (다국가 서비스 시 통화 테이블 별도 필요)
- 개인정보 보호를 위한 데이터 암호화 고려 필요