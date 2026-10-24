import { Controller, Get, Param } from '@nestjs/common';
import { ProductsService } from './products.service.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}
  @Get()
  timTatCaSanPham() {
    return this.productsService.timTatCaSanPham();
  }
  @Get(':id')
  timMotSanPham(@Param('id') id: string) {
    return this.productsService.timMotSanPham(id);
  }
}
