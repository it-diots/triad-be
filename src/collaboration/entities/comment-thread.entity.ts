import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('comment_threads')
@Index(['projectId'])
@Index(['url'])
@Index(['isResolved'])
export class CommentThread {
  @PrimaryGeneratedColumn('uuid', { comment: '코멘트 스레드 고유 ID' })
  id: string;

  // 프로젝트 참조
  @Column({
    name: 'project_id',
    type: 'uuid',
    comment: '프로젝트 ID',
  })
  projectId: string;

  @ManyToOne('Project', 'commentThreads', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: unknown;

  // URL 정보
  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '코멘트 스레드 URL',
  })
  url?: string;

  @Column({
    name: 'page_title',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '페이지 제목',
  })
  pageTitle?: string;

  // 해결 상태
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

  @ManyToOne('User', { nullable: true })
  @JoinColumn({ name: 'resolved_by' })
  resolver?: unknown;

  // 코멘트 관계
  @OneToMany('Comment', 'thread', {
    cascade: true,
    eager: false,
  })
  comments: unknown[];

  // 타임스탬프
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
}
