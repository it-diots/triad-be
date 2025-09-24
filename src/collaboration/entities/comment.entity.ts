import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

import { CommentThread } from './comment-thread.entity';
import { Deployment } from './deployment.entity';

@Entity('comments')
@Index(['projectId'])
@Index(['userId'])
@Index(['parentId'])
@Index(['isResolved'])
@Index(['threadId'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  // 코멘트 스레드 참조
  @Column({ name: 'thread_id', type: 'uuid', nullable: true })
  threadId: string;

  // 코멘트 내용 (structured content)
  @Column({ type: 'jsonb', nullable: true })
  body: Record<string, unknown>[];

  // 텍스트 버전 (검색 및 호환성용)
  @Column({ type: 'text' })
  content: string;

  // 이미지 첨부 정보
  @Column({ type: 'jsonb', default: '[]' })
  images: string[];

  // Git 관련 정보
  @Column({ name: 'commit_sha', type: 'varchar', length: 40, nullable: true })
  commitSha: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  href: string;

  // 로컬호스트 여부
  @Column({ name: 'left_on_localhost', type: 'boolean', default: false })
  leftOnLocalhost: boolean;

  // 배포 정보 참조
  @Column({ name: 'deployment_id', type: 'uuid', nullable: true })
  deploymentId: string;

  @Column({ type: 'jsonb' })
  position: {
    x: number;
    y: number;
  };

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId?: string;

  @Column({ name: 'is_resolved', type: 'boolean', default: false })
  isResolved: boolean;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @Column({ name: 'resolved_by', type: 'uuid', nullable: true })
  resolvedBy?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  url?: string; // Chrome Extension용 URL

  @Column({ type: 'text', nullable: true })
  xpath?: string; // DOM 경로

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // Relations
  @ManyToOne('Project', 'comments', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: unknown;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => CommentThread, (thread) => thread.comments, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'thread_id' })
  thread: CommentThread;

  @ManyToOne(() => Deployment, { nullable: true })
  @JoinColumn({ name: 'deployment_id' })
  deployment: Deployment;

  @ManyToOne('Comment', 'replies', { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: unknown;

  @OneToMany('Comment', 'parent')
  replies: unknown[];

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'resolved_by' })
  resolver?: User;

  // Legacy fields for compatibility
  get project_id(): string {
    return this.projectId;
  }

  get user_id(): string {
    return this.userId;
  }

  get parent_id(): string | undefined {
    return this.parentId;
  }

  get is_resolved(): boolean {
    return this.isResolved;
  }

  get resolved_at(): string | undefined {
    return this.resolvedAt?.toISOString();
  }

  get resolved_by(): string | undefined {
    return this.resolvedBy;
  }

  get created_at(): string {
    return this.createdAt.toISOString();
  }

  get updated_at(): string {
    return this.updatedAt.toISOString();
  }

  get username(): string {
    return this.user?.username || '';
  }
}
