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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 프로젝트 참조
  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne('Project', 'commentThreads', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: unknown;

  // URL 정보
  @Column({ type: 'varchar', length: 500, nullable: true })
  url?: string;

  @Column({ name: 'page_title', type: 'varchar', length: 255, nullable: true })
  pageTitle?: string;

  // 해결 상태
  @Column({ name: 'is_resolved', type: 'boolean', default: false })
  isResolved: boolean;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @Column({ name: 'resolved_by', type: 'uuid', nullable: true })
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
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
