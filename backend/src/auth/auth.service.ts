import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from '../users/DTO/login.dto.js';
import { RegisterDto } from '../users/DTO/register.dto.js';

const SALT_ROUNDS = 10;

// Các cột được phép trả cho FE. Cố ý KHÔNG có "password".
const publicUserSelect = {
  user_id: true,
  email: true,
  name: true,
  phone: true,
  point: true,
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // ===================== ĐĂNG KÝ (POST /auth/register) =====================
  async register(dto: RegisterDto) {
    const emailExists = await this.prisma.users.findFirst({
      where: { email: dto.email },
      select: { user_id: true },
    });
    if (emailExists) {
      throw new ConflictException('Email đã được đăng ký');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      return await this.prisma.users.create({
        data: {
          email: dto.email,
          name: dto.name,
          phone: dto.phone,
          password: passwordHash,
        },
        select: publicUserSelect,
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Số điện thoại đã được đăng ký');
      }
      throw e;
    }
  }

  // ===================== ĐĂNG NHẬP (POST /auth/login) =====================
  async login(dto: LoginDto) {
    // Có "@" thì coi là email, ngược lại là số điện thoại
    const where = dto.identifier.includes('@')
      ? { email: dto.identifier }
      : { phone: dto.identifier };

    const user = await this.prisma.users.findFirst({ where });

    const passwordOk =
      user !== null && (await bcrypt.compare(dto.password, user.password));

    if (!user || !passwordOk) {
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không đúng');
    }

    const accessToken = await this.jwt.signAsync({ user_id: user.user_id });

    return {
      accessToken,
      user: {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        point: user.point,
      },
    };
  }

  // ===================== GET /auth/me =====================
  async me(user_id: string) {
    const user = await this.prisma.users.findUnique({
      where: { user_id },
      select: publicUserSelect,
    });
    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }
    return user;
  }
}
