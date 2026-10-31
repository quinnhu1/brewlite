import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AdminProductsService } from './admin-products.service.js';

/**
 * API quản lý sản phẩm cho trang admin.
 *
 * LƯU Ý BẢO MẬT: controller này CHƯA có kiểm tra đăng nhập / quyền admin.
 * Trước khi triển khai thật phải gắn guard của nhóm (JWT + vai trò admin), ví dụ:
 *   @UseGuards(JwtAuthGuard, AdminGuard)
 * đặt ngay phía trên @Controller.
 */
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly adminProductsService: AdminProductsService) {}

  // GET /admin/products?search=espresso&category=Tea&status=active
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
  ) {
    return this.adminProductsService.findAll(search, category, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminProductsService.findOne(id);
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.adminProductsService.create(body);
  }

  // Sửa thông tin, đổi giá, đổi tồn kho, ngừng bán / bán lại (isActive)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.adminProductsService.update(id, body);
  }
}