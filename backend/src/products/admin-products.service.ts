import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';

// 5 danh mục cố định theo Figma. Dữ liệu lưu luôn dùng đúng cách viết này.
export const PRODUCT_CATEGORIES = [
  'Classic Coffee',
  'Cold & Brewed',
  'Tea',
  'Pastry & Dessert',
  'Best Sellers',
] as const;

const PLACEHOLDER_IMAGE = '/images/espresso.jpg';
const MAX_NAME_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_IMAGE_URL_LENGTH = 500;
const MAX_PRICE = 9_999_999_999; // numeric(10) không dấu thập phân

type ProductFields = {
  productName?: string;
  description?: string | null;
  basePrice?: number;
  imageUrl?: string;
  stock?: number;
  isActive?: boolean;
  categories?: string;
};

const ADMIN_SELECT = {
  productId: true,
  productName: true,
  description: true,
  basePrice: true,
  imageUrl: true,
  stock: true,
  isActive: true,
  categories: true,
  version: true,
} satisfies Prisma.ProductSelect;

@Injectable()
export class AdminProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Danh sách cho admin: gồm cả món đã ngừng bán, có tìm kiếm theo tên và lọc. */
  findAll(search?: string, category?: string, status?: string) {
    const where: Prisma.ProductWhereInput = {};

    const keyword = search?.trim();
    if (keyword) {
      where.productName = { contains: keyword, mode: 'insensitive' };
    }

    const categoryName = category?.trim();
    if (categoryName) {
      where.categories = { equals: categoryName, mode: 'insensitive' };
    }

    if (status === 'active') {
      where.isActive = true;
      where.stock = { gt: 0 };
    } else if (status === 'inactive') {
      where.isActive = false;
    } else if (status === 'out_of_stock') {
      where.isActive = true;
      where.stock = { lte: 0 };
    }

    return this.prisma.product.findMany({
      where,
      select: ADMIN_SELECT,
      orderBy: { productName: 'asc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { productId: id },
      select: ADMIN_SELECT,
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  create(body: Record<string, unknown>) {
    const data = this.parse(body, true);
    return this.prisma.product.create({
      data: {
        productId: randomUUID(),
        productName: data.productName!,
        description: data.description ?? null,
        basePrice: data.basePrice!,
        imageUrl: data.imageUrl ?? PLACEHOLDER_IMAGE,
        stock: data.stock!,
        version: 1,
        isActive: data.isActive ?? true,
        categories: data.categories!,
      },
      select: ADMIN_SELECT,
    });
  }

  async update(id: string, body: Record<string, unknown>) {
    const data = this.parse(body, false);
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Không có thông tin nào để cập nhật');
    }

    const exists = await this.prisma.product.findUnique({
      where: { productId: id },
      select: { productId: true },
    });
    if (!exists) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.prisma.product.update({
      where: { productId: id },
      data: { ...data, version: { increment: 1 } },
      select: ADMIN_SELECT,
    });
  }

  /**
   * Kiểm tra dữ liệu gửi lên.
   * requireAll = true (thêm mới): bắt buộc tên, danh mục, giá, tồn kho.
   * requireAll = false (sửa): chỉ kiểm tra những trường có gửi.
   */
  private parse(body: Record<string, unknown>, requireAll: boolean): ProductFields {
    const out: ProductFields = {};
    const has = (key: string) => body[key] !== undefined;

    if (requireAll || has('productName')) {
      const v = body.productName;
      if (typeof v !== 'string' || !v.trim()) {
        throw new BadRequestException('Tên sản phẩm không được để trống');
      }
      if (v.trim().length > MAX_NAME_LENGTH) {
        throw new BadRequestException(
          `Tên sản phẩm tối đa ${MAX_NAME_LENGTH} ký tự`,
        );
      }
      out.productName = v.trim();
    }

    if (requireAll || has('categories')) {
      const raw =
        typeof body.categories === 'string'
          ? body.categories.trim().toLowerCase()
          : '';
      const canonical = PRODUCT_CATEGORIES.find((c) => c.toLowerCase() === raw);
      if (!canonical) {
        throw new BadRequestException(
          `Danh mục không hợp lệ. Chọn một trong: ${PRODUCT_CATEGORIES.join(', ')}`,
        );
      }
      out.categories = canonical;
    }

    if (requireAll || has('basePrice')) {
      out.basePrice = this.toNonNegativeInt(body.basePrice, 'Giá', MAX_PRICE);
    }

    if (requireAll || has('stock')) {
      out.stock = this.toNonNegativeInt(body.stock, 'Tồn kho', 1_000_000);
    }

    if (has('description')) {
      const v = body.description;
      if (v === null || v === '') {
        out.description = null;
      } else if (typeof v === 'string') {
        if (v.trim().length > MAX_DESCRIPTION_LENGTH) {
          throw new BadRequestException(
            `Mô tả tối đa ${MAX_DESCRIPTION_LENGTH} ký tự`,
          );
        }
        out.description = v.trim();
      } else {
        throw new BadRequestException('Mô tả không hợp lệ');
      }
    }

    if (has('imageUrl')) {
      const v = body.imageUrl;
      if (v !== null && typeof v !== 'string') {
        throw new BadRequestException('Đường dẫn ảnh không hợp lệ');
      }
      const url = (v ?? '').trim();
      if (url.length > MAX_IMAGE_URL_LENGTH) {
        throw new BadRequestException('Đường dẫn ảnh quá dài');
      }
      out.imageUrl = url || PLACEHOLDER_IMAGE; // để trống thì dùng ảnh tạm
    }

    if (has('isActive')) {
      if (typeof body.isActive !== 'boolean') {
        throw new BadRequestException('Trạng thái phải là true hoặc false');
      }
      out.isActive = body.isActive;
    }

    return out;
  }

  private toNonNegativeInt(value: unknown, label: string, max: number): number {
    if (value === null || value === undefined || value === '') {
      throw new BadRequestException(`${label} không được để trống`);
    }
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0 || n > max) {
      throw new BadRequestException(
        `${label} phải là số nguyên từ 0 đến ${max.toLocaleString('vi-VN')}`,
      );
    }
    return n;
  }
}