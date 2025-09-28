import { CreateUserDto } from '../../users/dto/create-user.dto';

/**
 * 회원가입 요청 DTO
 * 사용자 회원가입을 위한 데이터로, CreateUserDto를 상속받아 사용
 */
export class RegisterDto extends CreateUserDto {}
