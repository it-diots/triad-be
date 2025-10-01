import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { UserResponseDto } from '../users/dto/user-response.dto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenResponseDto } from './dto/token-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<TokenResponseDto> {
    const user = await this.usersService.create(registerDto);
    return this.generateTokens(user);
  }

  async login(loginDto: LoginDto): Promise<TokenResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    await this.usersService.updateLastLogin(user.id);
    return this.generateTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<TokenResponseDto> {
    const user = await this.usersService.findOne(userId);

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access Denied');
    }

    const refreshTokenMatches = user.refreshToken === refreshToken;
    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access Denied');
    }

    // Access Token만 재발급, Refresh Token은 그대로 유지
    return this.generateAccessToken(user);
  }

  validateUser(email: string, password: string): Promise<User | null> {
    return this.usersService.validateUser(email, password);
  }

  async generateTokens(user: User): Promise<TokenResponseDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiresIn', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn', '7d'),
      }),
    ]);

    await this.usersService.updateRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900, // 15 minutes in seconds
      user: this.transformUserToDto(user),
    };
  }

  async generateAccessToken(user: User): Promise<TokenResponseDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn', '15m'),
    });

    if (!user.refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    return {
      accessToken,
      refreshToken: user.refreshToken, // 기존 Refresh Token 그대로 반환
      tokenType: 'Bearer',
      expiresIn: 900, // 15 minutes in seconds
      user: this.transformUserToDto(user),
    };
  }

  private transformUserToDto(user: User): UserResponseDto {
    const { password: _password, refreshToken: _refreshToken, ...result } = user;
    return result as UserResponseDto;
  }
}
