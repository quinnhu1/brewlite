import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  // Có thể là email HOẶC số điện thoại (khớp với ô "Email or phone" ở FE)
  @ApiProperty({ example: 'long@example.com hoặc 0901234567' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập email hoặc số điện thoại' })
  identifier: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu' })
  password: string;
}
