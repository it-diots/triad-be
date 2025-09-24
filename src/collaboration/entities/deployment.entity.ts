import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('deployments')
@Index(['projectId'])
@Index(['deploymentUrl'])
@Index(['environment'])
@Index(['status'])
export class Deployment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 프로젝트 참조
  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne('Project', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: unknown;

  // 배포 URL
  @Column({ name: 'deployment_url', type: 'varchar', length: 500 })
  deploymentUrl: string;

  // 환경
  @Column({
    type: 'varchar',
    length: 50,
    default: 'production',
    enum: ['development', 'staging', 'production', 'preview'],
  })
  environment: 'development' | 'staging' | 'production' | 'preview';

  // 버전 정보
  @Column({ type: 'varchar', length: 50, nullable: true })
  version?: string;

  // Git 커밋 SHA
  @Column({ name: 'commit_sha', type: 'varchar', length: 40, nullable: true })
  commitSha?: string;

  // 배포자
  @Column({ name: 'deployed_by', type: 'uuid', nullable: true })
  deployedBy?: string;

  @ManyToOne('User', { nullable: true })
  @JoinColumn({ name: 'deployed_by' })
  deployer?: unknown;

  // 배포 시각
  @Column({ name: 'deployed_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  deployedAt: Date;

  // 상태
  @Column({
    type: 'varchar',
    length: 20,
    default: 'active',
    enum: ['active', 'inactive', 'failed'],
  })
  status: 'active' | 'inactive' | 'failed';

  // 메타데이터
  @Column({ type: 'jsonb', default: '{}', nullable: true })
  metadata?: Record<string, unknown>;

  // 타임스탬프
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
