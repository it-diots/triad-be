import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserSearchRequestDto } from '../common/dto/request.dto';
import {
  UserListResponseDto,
  UserProfileResponseDto,
  UserResponseDto,
  UserSummaryResponseDto,
} from '../common/dto/response.dto';
import { TransformUtil } from '../common/utils/transform.util';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthProvider, User } from './entities/user.entity';
import {
  OAuthUserProfile,
  OAuthProfileUpdate,
  OAuthProviderLink,
  NewOAuthUserProfile,
} from './types/users.service.types';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 사용자 생성
   * @param createUserDto - 사용자 생성 정보
   * @returns 생성된 사용자 엔티티
   * @throws ConflictException - 이메일 또는 사용자명이 이미 존재할 경우
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: [{ email: createUserDto.email }, { username: createUserDto.username }],
    });

    if (existingUser) {
      if (existingUser.email === createUserDto.email) {
        throw new ConflictException('Email already exists');
      }
      throw new ConflictException('Username already exists');
    }

    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  /**
   * OAuth 사용자 생성 또는 기존 사용자와 연동
   * @param profile - OAuth 프로필 정보
   * @returns 생성되거나 연동된 사용자 엔티티
   */
  async createOAuthUser(profile: OAuthUserProfile): Promise<User> {
    // 1. 동일한 provider + providerId로 기존 사용자 찾기
    const existingUser = await this.findByProviderAndId(profile.provider, profile.providerId);
    if (existingUser) {
      return this.updateOAuthUserProfile(existingUser, profile);
    }

    // 2. 같은 이메일의 사용자가 있는지 확인
    const userByEmail = await this.findByEmail(profile.email);
    if (userByEmail) {
      return this.linkOAuthProviderToExistingUser(userByEmail, profile);
    }

    // 3. 신규 사용자 생성
    return this.createNewOAuthUser(profile);
  }

  /**
   * 모든 사용자 조회 (비밀번호 제외)
   * @returns 사용자 목록
   */
  findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: [
        'id',
        'email',
        'username',
        'firstName',
        'lastName',
        'avatar',
        'role',
        'status',
        'provider',
        'createdAt',
      ],
    });
  }

  /**
   * 특정 사용자 조회
   * @param id - 사용자 ID
   * @returns 사용자 엔티티
   * @throws NotFoundException - 사용자를 찾을 수 없을 경우
   */
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  /**
   * 이메일로 사용자 조회
   * @param email - 이메일 주소
   * @returns 사용자 엔티티 또는 null
   */
  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * 사용자명으로 사용자 조회
   * @param username - 사용자명
   * @returns 사용자 엔티티 또는 null
   */
  findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  /**
   * OAuth Provider와 Provider ID로 사용자 조회
   * @param provider - OAuth 제공자 (Google, GitHub 등)
   * @param providerId - Provider에서 제공하는 사용자 ID
   * @returns 사용자 엔티티 또는 null
   */
  findByProviderAndId(provider: AuthProvider, providerId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { provider, providerId },
    });
  }

  /**
   * 사용자 정보 수정
   * @param id - 사용자 ID
   * @param updateUserDto - 수정할 사용자 정보
   * @returns 수정된 사용자 엔티티
   * @throws ConflictException - 사용자명이 이미 존재할 경우
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.findByUsername(updateUserDto.username);
      if (existingUser) {
        throw new ConflictException('Username already exists');
      }
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  /**
   * 리프레시 토큰 업데이트
   * @param id - 사용자 ID
   * @param refreshToken - 리프레시 토큰 (null이면 제거)
   * @returns void
   */
  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    await this.userRepository.update(id, {
      refreshToken: refreshToken || undefined,
    });
  }

  /**
   * 마지막 로그인 시간 업데이트
   * @param id - 사용자 ID
   * @returns void
   */
  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  /**
   * 사용자 삭제 (Soft Delete)
   * @param id - 사용자 ID
   * @returns void
   */
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.softRemove(user);
  }

  /**
   * 이메일과 비밀번호로 사용자 인증 검증
   * @param email - 이메일 주소
   * @param password - 비밀번호
   * @returns 인증 성공 시 사용자 엔티티, 실패 시 null
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (user && user.password && (await user.validatePassword(password))) {
      return user;
    }
    return null;
  }

  // DTO 변환 메서드들
  /**
   * User 엔티티를 UserResponseDto로 변환
   */
  toUserResponseDto(user: User): UserResponseDto {
    return TransformUtil.toUserResponseDto(user);
  }

  /**
   * User 엔티티를 UserProfileResponseDto로 변환
   */
  toUserProfileResponseDto(user: User): UserProfileResponseDto {
    return TransformUtil.toUserProfileResponseDto(user);
  }

  /**
   * User 엔티티를 UserSummaryResponseDto로 변환
   */
  toUserSummaryResponseDto(user: User): UserSummaryResponseDto {
    return TransformUtil.toUserSummaryResponseDto(user);
  }

  /**
   * 사용자 목록을 검색하고 DTO로 변환하여 반환
   */
  async findAllWithSearch(searchDto: UserSearchRequestDto): Promise<UserListResponseDto> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // 검색어 필터링
    if (searchDto.search) {
      queryBuilder.andWhere(
        '(user.username LIKE :search OR user.firstName LIKE :search OR user.lastName LIKE :search OR user.email LIKE :search)',
        { search: `%${searchDto.search}%` },
      );
    }

    // 역할 필터링
    if (searchDto.role) {
      queryBuilder.andWhere('user.role = :role', { role: searchDto.role });
    }

    // 상태 필터링
    if (searchDto.status) {
      queryBuilder.andWhere('user.status = :status', { status: searchDto.status });
    }

    // 인증 제공자 필터링
    if (searchDto.provider) {
      queryBuilder.andWhere('user.provider = :provider', { provider: searchDto.provider });
    }

    // 페이지네이션
    const page = searchDto.page || 1;
    const limit = searchDto.limit || 20;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);
    queryBuilder.orderBy('user.createdAt', 'DESC');

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      users: users.map((user) => this.toUserResponseDto(user)),
      total,
      page,
      limit,
    };
  }

  /**
   * 사용자 생성 후 DTO로 변환하여 반환
   */
  async createAndTransform(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.create(createUserDto);
    return this.toUserResponseDto(user);
  }

  /**
   * 사용자 업데이트 후 DTO로 변환하여 반환
   */
  async updateAndTransform(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.update(id, updateUserDto);
    return this.toUserResponseDto(user);
  }

  /**
   * 사용자 조회 후 DTO로 변환하여 반환
   */
  async findOneAndTransform(id: string): Promise<UserResponseDto> {
    const user = await this.findOne(id);
    return this.toUserResponseDto(user);
  }

  /**
   * 사용자 프로필 조회 후 DTO로 변환하여 반환
   */
  async getProfileAndTransform(id: string): Promise<UserProfileResponseDto> {
    const user = await this.findOne(id);
    return this.toUserProfileResponseDto(user);
  }

  /**
   * 기존 OAuth 사용자 프로필 업데이트
   */
  private async updateOAuthUserProfile(user: User, profile: OAuthProfileUpdate): Promise<User> {
    let updated = false;

    if (profile.avatar && profile.avatar !== user.avatar) {
      user.avatar = profile.avatar;
      updated = true;
    }
    if (profile.firstName && profile.firstName !== user.firstName) {
      user.firstName = profile.firstName;
      updated = true;
    }
    if (profile.lastName && profile.lastName !== user.lastName) {
      user.lastName = profile.lastName;
      updated = true;
    }
    if (profile.providerData) {
      user.providerData = profile.providerData;
      updated = true;
    }

    if (updated) {
      await this.userRepository.save(user);
    }

    return user;
  }

  /**
   * 기존 사용자에 OAuth provider 연동
   */
  private async linkOAuthProviderToExistingUser(
    user: User,
    profile: OAuthProviderLink,
  ): Promise<User> {
    const needsUpdate =
      user.provider !== profile.provider || user.providerId !== profile.providerId;

    if (needsUpdate) {
      user.provider = profile.provider;
      user.providerId = profile.providerId;

      if (profile.avatar) {
        user.avatar = profile.avatar;
      }
      if (profile.firstName) {
        user.firstName = profile.firstName;
      }
      if (profile.lastName) {
        user.lastName = profile.lastName;
      }
      if (profile.providerData) {
        user.providerData = profile.providerData;
      }

      await this.userRepository.save(user);
    }

    return user;
  }

  /**
   * 새 OAuth 사용자 생성
   */
  private async createNewOAuthUser(profile: NewOAuthUserProfile): Promise<User> {
    const username = profile.username || `${profile.provider.toLowerCase()}_${profile.providerId}`;

    const user = this.userRepository.create({
      email: profile.email,
      username: await this.generateUniqueUsername(username),
      provider: profile.provider,
      providerId: profile.providerId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatar: profile.avatar,
      providerData: profile.providerData,
      emailVerifiedAt: new Date(),
    });

    return this.userRepository.save(user);
  }

  private async generateUniqueUsername(baseUsername: string): Promise<string> {
    let username = baseUsername;
    let counter = 0;

    while (await this.findByUsername(username)) {
      counter++;
      username = `${baseUsername}_${counter}`;
    }

    return username;
  }
}
