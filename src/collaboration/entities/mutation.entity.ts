import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { Project } from './project.entity';

@Entity('mutations')
@Index(['projectId'])
@Index(['userId'])
@Index(['type'])
@Index(['timestamp'])
@Index(['url'])
export class Mutation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 프로젝트 참조
  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  // 사용자 참조
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: unknown;

  // DOM 변경 타입
  @Column({
    type: 'enum',
    enum: ['added', 'removed', 'modified', 'style', 'attribute'],
  })
  type: 'added' | 'removed' | 'modified' | 'style' | 'attribute';

  // 타겟 셀렉터
  @Column({ name: 'target_selector', type: 'varchar', length: 500, nullable: true })
  targetSelector?: string;

  // 타겟 XPath
  @Column({ name: 'target_xpath', type: 'text', nullable: true })
  targetXpath?: string;

  // 이전 값
  @Column({ name: 'old_value', type: 'text', nullable: true })
  oldValue?: string;

  // 새 값
  @Column({ name: 'new_value', type: 'text', nullable: true })
  newValue?: string;

  // 메타데이터
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown>;

  // URL
  @Column({ type: 'varchar', length: 500, nullable: true })
  url?: string;

  // 타임스탬프
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  // 타임스탬프
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
