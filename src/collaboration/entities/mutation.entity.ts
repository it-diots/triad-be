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
  @PrimaryGeneratedColumn('uuid', { comment: '변경 기록 고유 ID' })
  id: string;

  // 프로젝트 참조
  @Column({
    name: 'project_id',
    type: 'uuid',
    comment: '프로젝트 ID',
  })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  // 사용자 참조
  @Column({
    name: 'user_id',
    type: 'uuid',
    comment: '사용자 ID',
  })
  userId: string;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: unknown;

  // DOM 변경 타입
  @Column({
    type: 'enum',
    enum: ['added', 'removed', 'modified', 'style', 'attribute'],
    comment: 'DOM 변경 타입',
  })
  type: 'added' | 'removed' | 'modified' | 'style' | 'attribute';

  // 타겟 셀렉터
  @Column({
    name: 'target_selector',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'CSS 셀렉터',
  })
  targetSelector?: string;

  // 타겟 XPath
  @Column({
    name: 'target_xpath',
    type: 'text',
    nullable: true,
    comment: 'XPath 경로',
  })
  targetXpath?: string;

  // 이전 값
  @Column({
    name: 'old_value',
    type: 'text',
    nullable: true,
    comment: '이전 값',
  })
  oldValue?: string;

  // 새 값
  @Column({
    name: 'new_value',
    type: 'text',
    nullable: true,
    comment: '새 값',
  })
  newValue?: string;

  // 메타데이터
  @Column({
    type: 'json',
    nullable: true,
    comment: '추가 메타데이터',
  })
  metadata?: Record<string, unknown>;

  // URL
  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '변경이 일어난 URL',
  })
  url?: string;

  // 타임스탬프
  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    comment: '변경 시간',
  })
  timestamp: Date;

  // 타임스탬프
  @CreateDateColumn({
    name: 'created_at',
    comment: '생성 시간',
  })
  createdAt: Date;
}
