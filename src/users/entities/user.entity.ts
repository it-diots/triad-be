import * as bcrypt from 'bcrypt';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export enum AuthProvider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
  GITHUB = 'GITHUB',
}

@Entity('users')
@Index(['email'])
@Index(['username'])
@Index(['provider', 'providerId'])
export class User {
  @PrimaryGeneratedColumn('uuid', { comment: '사용자 고유 ID' })
  id: string;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    comment: '사용자 이메일 주소',
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '비밀번호 (해시 처리됨)',
  })
  password?: string;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    comment: '사용자명',
  })
  username: string;

  @Column({
    name: 'first_name',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '이름',
  })
  firstName?: string;

  @Column({
    name: 'last_name',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '성',
  })
  lastName?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: '프로필 이미지 URL',
  })
  avatar?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
    comment: '사용자 역할',
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
    comment: '계정 상태',
  })
  status: UserStatus;

  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
    comment: '인증 제공자',
  })
  provider: AuthProvider;

  @Column({
    name: 'provider_id',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '외부 인증 제공자 ID',
  })
  providerId?: string;

  @Column({
    name: 'provider_data',
    type: 'json',
    nullable: true,
    comment: '외부 인증 제공자 데이터',
  })
  providerData?: Record<string, unknown>;

  @Column({
    name: 'refresh_token',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '리프레시 토큰',
  })
  refreshToken?: string;

  @Column({
    name: 'email_verified_at',
    type: 'timestamp',
    nullable: true,
    comment: '이메일 인증 시간',
  })
  emailVerifiedAt?: Date;

  @Column({
    name: 'last_login_at',
    type: 'timestamp',
    nullable: true,
    comment: '마지막 로그인 시간',
  })
  lastLoginAt?: Date;

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

  @BeforeInsert()
  async hashPassword(): Promise<void> {
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  validatePassword(password: string): Promise<boolean> {
    if (!this.password) {
      return Promise.resolve(false);
    }
    return bcrypt.compare(password, this.password);
  }

  async updatePassword(newPassword: string): Promise<void> {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(newPassword, salt);
  }
}
