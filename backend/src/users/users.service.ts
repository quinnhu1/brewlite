import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateProfileDto } from './DTO/update-profile.dto.js';

const SALT_ROUNDS = 10;

const publicUserSelect = {
  user_id: true,
  email: true,
  name: true,
  phone: true,
  point: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(user_id: string, dto: UpdateProfileDto) {
    const data: Prisma.usersUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }

    try {
      return await this.prisma.users.update({
        where: { user_id },
        data,
        select: publicUserSelect,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new ConflictException('Số điện thoại đã được đăng ký');
        }
        if (e.code === 'P2025') {
          throw new UnauthorizedException('Tài khoản không tồn tại');
        }
      }
      throw e;
    }
  }
}
