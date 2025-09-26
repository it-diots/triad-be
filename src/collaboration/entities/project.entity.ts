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

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

@Entity('projects')
@Index(['name'])
@Index(['ownerId'])
@Index(['status'])
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  url?: string; // Chrome Extension용 URL

  @Column({ type: 'varchar', length: 255, nullable: true })
  domain?: string;

  @Column({ name: 'is_public', type: 'boolean', default: false })
  isPublic: boolean;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.ACTIVE,
  })
  status: ProjectStatus;

  @Column({ type: 'json', nullable: true })
  settings?: {
    allowComments: boolean;
    allowGuests: boolean;
    maxParticipants?: number;
    isPublic: boolean;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
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
