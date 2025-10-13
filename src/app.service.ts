import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  /**
   * Hello World 메시지 반환
   * @returns Hello World 문자열
   */
  getHello(): string {
    return 'Hello World!';
  }
}
