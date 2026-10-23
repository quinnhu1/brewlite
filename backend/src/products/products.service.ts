import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

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
}
