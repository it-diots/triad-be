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

@Entity('comments')
@Index(['projectId'])
@Index(['userId'])
@Index(['parentId'])
@Index(['isResolved'])
@Index(['threadId'])
export class Comment {
  @PrimaryGeneratedColumn('uuid', { comment: '코멘트 고유 ID' })
  id: string;

  @Column({
    name: 'project_id',
    type: 'uuid',
    comment: '프로젝트 ID',
  })
  projectId: string;

  @Column({
    name: 'user_id',
    type: 'uuid',
    comment: '작성자 ID',
  })
  userId: string;

  // 코멘트 스레드 참조
  @Column({
    name: 'thread_id',
    type: 'uuid',
    nullable: true,
    comment: '코멘트 스레드 ID',
  })
  threadId: string;

  // 코멘트 내용 (structured content)
  @Column({
    type: 'json',
    nullable: true,
    comment: '리치 텍스트 코멘트 본문',
  })
  body: Record<string, unknown>[];

  // 텍스트 버전 (검색 및 호환성용)
  @Column({
    type: 'text',
    comment: '일반 텍스트 코멘트',
  })
  content: string;

  // 이미지 첨부 정보
  @Column({
    type: 'json',
    nullable: true,
    comment: '첨부 이미지 URL 목록',
  })
  images: string[];

  // Git 관련 정보
  @Column({
    name: 'commit_sha',
    type: 'varchar',
    length: 40,
    nullable: true,
    comment: 'Git 커밋 SHA',
  })
  commitSha: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '참조 링크',
  })
  href: string;

  // 로컬호스트 여부
  @Column({
    name: 'left_on_localhost',
    type: 'boolean',
    default: false,
    comment: '로컬호스트 작성 여부',
  })
  leftOnLocalhost: boolean;

  // 배포 정보 참조 (deprecated)
  @Column({
    name: 'deployment_id',
    type: 'uuid',
    nullable: true,
    comment: '배포 ID (deprecated)',
  })
  deploymentId: string;

  @Column({
    type: 'json',
    comment: '코멘트 위치 좌표',
  })
  position: {
    x: number;
    y: number;
  };

  @Column({
    name: 'parent_id',
    type: 'uuid',
    nullable: true,
    comment: '부모 코멘트 ID',
  })
  parentId?: string;

  @Column({
    name: 'is_resolved',
    type: 'boolean',
    default: false,
    comment: '해결 상태',
  })
  isResolved: boolean;

  @Column({
    name: 'resolved_at',
    type: 'timestamp',
    nullable: true,
    comment: '해결 시간',
  })
  resolvedAt?: Date;

  @Column({
    name: 'resolved_by',
    type: 'uuid',
    nullable: true,
    comment: '해결한 사용자 ID',
  })
  resolvedBy?: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Chrome Extension용 URL',
  })
  url?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'DOM 경로',
  })
  xpath?: string;

  @CreateDateColumn({
    name: 'created_at',
    comment: '생성 시간',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    comment: '수정 시간',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    comment: '삭제 시간 (Soft Delete)',
  })
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

  // Deployment relation removed - no longer used

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
