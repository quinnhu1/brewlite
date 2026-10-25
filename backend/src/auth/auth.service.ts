import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './DTO/login.dto.js';
import { RegisterDto } from './DTO/register.dto.js';

// Độ "nặng" của bcrypt khi băm mật khẩu.
// Số càng lớn càng an toàn nhưng càng chậm. 10 là mức thông dụng.
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
  // NestJS tự đưa PrismaService (DB) và JwtService (ký token) vào đây.
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // ===================== ĐĂNG KÝ (POST /auth/register) =====================
  async register(dto: RegisterDto) {
    // Cột email trong DB KHÔNG unique, nên phải tự kiểm tra trùng email.
    const emailExists = await this.prisma.users.findFirst({
      where: { email: dto.email },
      select: { user_id: true },
    });
    if (emailExists) {
      throw new ConflictException('Email đã được đăng ký'); // HTTP 409
    }

    // Băm mật khẩu. DB chỉ lưu chuỗi băm, KHÔNG lưu mật khẩu thật.
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      return await this.prisma.users.create({
        data: {
          email: dto.email,
          name: dto.name,
          phone: dto.phone,
          password: passwordHash, // cột "password" lưu chuỗi ĐÃ BĂM
        },
        select: publicUserSelect,
      });
    } catch (e) {
      // P2002 = vi phạm cột unique. Trong bảng users chỉ "phone" là unique.
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Số điện thoại đã được đăng ký'); // 409
      }
      throw e; // lỗi khác: ném lại, không che giấu
    }
  }

  // ===================== ĐĂNG NHẬP (POST /auth/login) =====================
  async login(dto: LoginDto) {
    // Email không unique nên dùng findFirst.
    const user = await this.prisma.users.findFirst({
      where: { email: dto.email },
    });

    // So sánh mật khẩu nhập vào với chuỗi đã băm trong cột "password".
    const passwordOk =
      user !== null && (await bcrypt.compare(dto.password, user.password));

    // Sai email hoặc sai mật khẩu: cùng một thông báo (không lộ email nào tồn tại).
    if (!user || !passwordOk) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng'); // 401
    }

    // Ký token. Token lưu user_id, cùng tên với cột trong DB.
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

  // ===================== LẤY THÔNG TIN MÌNH (GET /auth/me) =====================
  // user_id lấy từ token (do JwtAuthGuard gắn vào), là UUID nên kiểu string.
  async me(user_id: string) {
    const user = await this.prisma.users.findUnique({
      where: { user_id },
      select: publicUserSelect,
    });

    // Token còn hạn nhưng tài khoản có thể đã bị xóa.
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
