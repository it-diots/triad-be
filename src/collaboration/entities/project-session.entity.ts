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
  @PrimaryGeneratedColumn('uuid', { comment: '세션 고유 ID' })
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
    comment: '사용자 ID',
  })
  userId: string;

  @Column({
    type: 'varchar',
    length: 100,
    comment: '사용자 이름',
  })
  username: string;

  @Column({
    name: 'user_email',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '사용자 이메일',
  })
  userEmail?: string;

  @Column({
    name: 'user_avatar',
    type: 'text',
    nullable: true,
    comment: '사용자 아바타 URL',
  })
  userAvatar?: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
    comment: '활성 상태',
  })
  isActive: boolean;

  @Column({
    name: 'cursor_position',
    type: 'json',
    nullable: true,
    comment: '커서 위치',
  })
  cursorPosition?: {
    x: number;
    y: number;
  };

  @Column({
    name: 'last_activity',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    comment: '마지막 활동 시간',
  })
  lastActivity: Date;

  @Column({
    name: 'joined_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    comment: '참가 시간',
  })
  joinedAt: Date;

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
