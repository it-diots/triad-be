import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthProvider, User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

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

  async createOAuthUser(profile: {
    email: string;
    provider: AuthProvider;
    providerId: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    providerData?: Record<string, any>;
  }): Promise<User> {
    const existingUser = await this.findByProviderAndId(profile.provider, profile.providerId);

    if (existingUser) {
      return existingUser;
    }

    const userByEmail = await this.findByEmail(profile.email);
    if (userByEmail) {
      if (userByEmail.provider !== profile.provider) {
        throw new ConflictException(
          `User with email ${profile.email} already exists with different provider`,
        );
      }
      return userByEmail;
    }

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

  async findAll(): Promise<User[]> {
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

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async findByProviderAndId(provider: AuthProvider, providerId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { provider, providerId },
    });
  }

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

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    await this.userRepository.update(id, {
      refreshToken: refreshToken || undefined,
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.softRemove(user);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (user && user.password && (await user.validatePassword(password))) {
      return user;
    }
    return null;
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
