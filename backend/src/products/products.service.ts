import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotFoundError } from 'rxjs';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {  }
  findAll(){
    return this.prisma.product.findMany({
      where :{ isActive :true},
      select : {
        productId :true,
        productName : true,
        description : true,
        basePrice : true,
        imageUrl :true,
        stock :true,
      },
      orderBy : {productId : 'asc'
      },
    });
  }
  async findOne(id: string){
    const product = await this.prisma.product.findUnique({
      where: { productId: id },
      select: {
        productId: true,
        productName: true,
        description: true,
        basePrice: true,
        imageUrl: true,
        stock: true,
        product_size: {
          select: {
            size_id: true,
            size: true,
            add_price: true,
          },
        },
        product_toppings: {
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
      throw new NotFoundError (`Sản phẩm với ID "${id}" không tồn tại`);
    }
    return product;
  }
}
