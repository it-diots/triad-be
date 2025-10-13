import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
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
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * 회원가입 처리
   * @param registerDto - 회원가입 정보
   * @returns 생성된 사용자의 액세스 토큰 및 리프레시 토큰
   */
  async register(registerDto: RegisterDto): Promise<TokenResponseDto> {
    const user = await this.usersService.create(registerDto);
    return this.generateTokens(user);
  }

  /**
   * 로그인 처리
   * @param loginDto - 로그인 정보 (이메일, 비밀번호)
   * @returns 인증 성공 시 액세스 토큰 및 리프레시 토큰
   * @throws UnauthorizedException - 인증 실패 시
   */
  async login(loginDto: LoginDto): Promise<TokenResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new NotFoundException('Invalid credentials');
    }
    await this.usersService.updateLastLogin(user.id);
    return this.generateTokens(user);
  }

  /**
   * 로그아웃 처리
   * @param userId - 로그아웃할 사용자 ID
   * @returns void
   */
  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  /**
   * 토큰 갱신 처리 (리프레시 토큰을 사용하여 새로운 액세스 토큰 발급)
   * @param userId - 사용자 ID
   * @param refreshToken - 리프레시 토큰
   * @returns 새로운 액세스 토큰 (리프레시 토큰은 기존 것 유지)
   * @throws UnauthorizedException - 리프레시 토큰이 유효하지 않을 경우
   */
  async refreshTokens(userId: string, refreshToken: string): Promise<TokenResponseDto> {
    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new NotFoundException('User not found');
      this.logger.error('User not found: ' + userId);
    }

    if (!user.refreshToken) {
      throw new NotFoundException('Refresh token not found');
      this.logger.error('Refresh token not found: ' + userId);
    }

    const refreshTokenMatches = user.refreshToken === refreshToken;
    if (!refreshTokenMatches) {
      throw new BadRequestException('Invalid refresh token');
      this.logger.error('Invalid refresh token: ' + userId);
    }

    // Access Token만 재발급, Refresh Token은 그대로 유지
    return this.generateAccessToken(user);
  }

  /**
   * 사용자 인증 검증
   * @param email - 사용자 이메일
   * @param password - 비밀번호
   * @returns 인증 성공 시 사용자 엔티티, 실패 시 null
   */
  validateUser(email: string, password: string): Promise<User | null> {
    return this.usersService.validateUser(email, password);
  }

  /**
   * 액세스 토큰 및 리프레시 토큰 생성
   * @param user - 사용자 엔티티
   * @returns 생성된 액세스 토큰, 리프레시 토큰 및 사용자 정보
   */
  async generateTokens(user: User): Promise<TokenResponseDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: '7d',
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

  /**
   * 액세스 토큰만 재발급 (리프레시 토큰은 기존 것 유지)
   * @param user - 사용자 엔티티
   * @returns 새로운 액세스 토큰 및 기존 리프레시 토큰
   * @throws UnauthorizedException - 리프레시 토큰이 없을 경우
   */
  async generateAccessToken(user: User): Promise<TokenResponseDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: '15m',
    });

    if (!user.refreshToken) {
      throw new NotFoundException('Refresh token not found');
      this.logger.error('Refresh token not found222');
    }

    return {
      accessToken,
      refreshToken: user.refreshToken, // 기존 Refresh Token 그대로 반환
      tokenType: 'Bearer',
      expiresIn: 900, // 15 minutes in seconds
      user: this.transformUserToDto(user),
    };
  }

  /**
   * User 엔티티를 UserResponseDto로 변환 (비밀번호 및 리프레시 토큰 제외)
   * @param user - 사용자 엔티티
   * @returns 사용자 응답 DTO
   */
  private transformUserToDto(user: User): UserResponseDto {
    const { password: _password, refreshToken: _refreshToken, ...result } = user;
    return result as UserResponseDto;
  }
}
