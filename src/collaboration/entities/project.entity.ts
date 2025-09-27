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

@Entity('projects')
@Index(['ownerId'])
@Index(['url'])
@Index(['domain'])
export class Project {
  @PrimaryGeneratedColumn('uuid', { comment: '프로젝트 고유 ID' })
  id: string;

  @Column({
    type: 'varchar',
    length: 255,
    comment: '프로젝트 이름',
  })
  name: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: '프로젝트 설명',
  })
  description?: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Chrome Extension용 URL',
  })
  url?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '프로젝트 도메인',
  })
  domain?: string;

  @Column({
    name: 'is_public',
    type: 'boolean',
    default: false,
    comment: '공개 여부',
  })
  isPublic: boolean;

  @Column({
    name: 'owner_id',
    type: 'uuid',
    comment: '프로젝트 소유자 ID',
  })
  ownerId: string;

  @Column({
    type: 'json',
    nullable: true,
    comment: '프로젝트 설정',
  })
  settings?: {
    allowComments: boolean;
    allowGuests: boolean;
    maxParticipants?: number;
    isPublic: boolean;
  };

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
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany('Comment', 'project')
  comments: unknown[];

  @OneToMany(() => CommentThread, (thread) => thread.project)
  commentThreads: CommentThread[];

  @OneToMany('ProjectSession', 'project')
  sessions: unknown[];
}
