import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}
  findAllProduct() {
    return this.prisma.product.findMany({
      where: { isActive: true },
      select: {
        productId: true,
        productName: true,
        description: true,
        basePrice: true,
        imageUrl: true,
        stock: true,
        categories: true,
      },
      orderBy: { productId: 'asc' },
    });
  }
  async findOneProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { productId: id },
      select: {
        productId: true,
        productName: true,
        description: true,
        basePrice: true,
        imageUrl: true,
        stock: true,
        categories: true,

        product_size: {
          select: {
            size_id: true,
            size: true,
            add_price: true,
          },
          orderBy: { size: 'asc' },
        },
        product_toppings: {
          where: {
            toppings: {
              is_active: true,
            },
          },
          select: {
            toppings: {
              select: {
                topping_id: true,
                topping_name: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return {
      ...product,
      toppings: (product as any).product_toppings.map((pt: any) => pt.toppings),
      product_toppings: undefined,
    };
  }
  async giamSoLuongSanPham(
    productId: string,
    quantity: number,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestException('Số lượng không hợp lệ');
    }

    const { count } = await tx.product.updateMany({
      where: { productId, isActive: true, stock: { gte: quantity } },
      data: { stock: { decrement: quantity }, version: { increment: 1 } },
    });

    if (count === 0) {
      const p = await tx.product.findUnique({
        where: { productId },
        select: { productName: true, stock: true, isActive: true },
      });
      if (!p || !p.isActive) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }
      throw new BadRequestException(
        `"${p.productName}" chỉ còn ${p.stock} sản phẩm`,
      );
    }
  }
  async tangSoLuongSanPham(
      productId: string,quantity:number,tx:Prisma.TransactionClient=this.prisma,
  ){
    await tx.product.update({
      where :{productId},
      data:{stock:{increment:quantity},version:{increment:1}}
    });
  }
}
