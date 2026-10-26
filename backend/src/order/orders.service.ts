import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  // Chỉ lấy đơn của CHÍNH người đăng nhập.
  // user_id lấy từ token, không bao giờ nhận từ query hay body.
  findMine(user_id: string) {
    return this.prisma.orders.findMany({
      where: { user_id },
      orderBy: { created: 'desc' }, // đơn mới nhất lên đầu
      select: {
        order_id: true,
        order_code: true,
        status: true,
        subtotal: true,
        discount: true,
        total: true,
        created: true,
        order_items: {
          select: {
            orderitem_id: true,
            product_id: true,
            product_name: true,
            size: true,
            unit_price: true,
            quantity: true,
            line_total: true,
            order_item_toppings: {
              select: { topping_name: true, price: true },
            },
          },
        },
        // Không lấy idempotency_key và transaction_id vì là thông tin nội bộ
        payments: {
          orderBy: { created_at: 'desc' },
          select: {
            payment_id: true,
            amount: true,
            method: true,
            status: true,
            paid_at: true,
          },
        },
      },
    });
  }
}
