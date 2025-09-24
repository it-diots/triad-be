import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

@Entity('project_sessions')
@Index(['projectId'])
@Index(['userId'])
@Index(['isActive'])
@Index(['lastActivity'])
export class ProjectSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  username: string;

  @Column({ name: 'user_email', type: 'varchar', length: 255, nullable: true })
  userEmail?: string;

  @Column({ name: 'user_avatar', type: 'text', nullable: true })
  userAvatar?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'cursor_position', type: 'jsonb', nullable: true })
  cursorPosition?: {
    x: number;
    y: number;
  };

  @Column({ name: 'last_activity', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastActivity: Date;

  @Column({ name: 'joined_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne('Project', 'sessions', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: unknown;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Legacy fields for compatibility
  get project_id(): string {
    return this.projectId;
  }

  get user_id(): string {
    return this.userId;
  }

  get is_active(): boolean {
    return this.isActive;
  }

  get cursor_position(): { x: number; y: number } | undefined {
    return this.cursorPosition;
  }

  get joined_at(): string {
    return this.joinedAt.toISOString();
  }

  get last_activity(): string {
    return this.lastActivity.toISOString();
  }

  get created_at(): string {
    return this.createdAt.toISOString();
  }

  get updated_at(): string {
    return this.updatedAt.toISOString();
  }
}
