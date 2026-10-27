import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

const DEMO_USER_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(dto: CreateOrderDto) {
    // Task 7/JWT chưa nằm trong phạm vi branch này. Dùng user demo CHỈ cho local.
    // Khi tích hợp auth, thay đoạn này bằng user_id lấy từ request.user sau khi xác thực JWT.
    const userId = process.env.DEV_DEFAULT_USER_ID || DEMO_USER_ID;
    const now = new Date();
    const scheduledAt = dto.scheduled_at ? new Date(dto.scheduled_at) : null;

    if (scheduledAt && scheduledAt.getTime() <= now.getTime()) {
      throw new BadRequestException('Thời gian nhận dự kiến phải ở tương lai.');
    }
    if (dto.pickup_method === 'DELIVERY' && !dto.delivery_address?.trim()) {
      throw new BadRequestException('Vui lòng nhập địa chỉ giao hàng khi chọn DELIVERY.');
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.users.findUnique({
        where: { user_id: userId },
        select: { user_id: true },
      });
      if (!user) {
        throw new InternalServerErrorException(
          `Không tìm thấy user demo ${userId}. Hãy nạp backend/prisma/seed/seed-data.sql hoặc đặt DEV_DEFAULT_USER_ID trong backend/.env.`,
        );
      }

      const requestedQuantityByProduct = new Map<string, number>();
      for (const item of dto.items) {
        requestedQuantityByProduct.set(
          item.product_id,
          (requestedQuantityByProduct.get(item.product_id) ?? 0) + item.quantity,
        );
      }

      const orderItems: Array<{
        product_id: string;
        product_name: string;
        size: string;
        unit_price: Prisma.Decimal;
        quantity: number;
        line_total: Prisma.Decimal;
        note: string | null;
        toppings: Array<{
          topping_id: string;
          topping_name: string;
          price: Prisma.Decimal;
        }>;
      }> = [];

      let subtotal = 0;

      for (const item of dto.items) {
        const product = await tx.product.findFirst({
          where: { productId: item.product_id, isActive: true },
          include: {
            product_size: true,
            product_toppings: {
              where: { toppings: { is_active: true } },
              include: { toppings: true },
            },
          },
        });

        if (!product) {
          throw new NotFoundException(`Không tìm thấy sản phẩm ${item.product_id} hoặc sản phẩm đã ngừng bán.`);
        }
        const requestedForThisProduct = requestedQuantityByProduct.get(item.product_id) ?? item.quantity;
        if (requestedForThisProduct > product.stock) {
          throw new BadRequestException(
            `Sản phẩm "${product.productName}" chỉ còn ${product.stock} phần trong kho, nhưng giỏ đang yêu cầu ${requestedForThisProduct} phần.`,
          );
        }

        const size = product.product_size.find((candidate) => candidate.size === item.size);
        if (!size) {
          throw new BadRequestException(
            `Sản phẩm "${product.productName}" không hỗ trợ size ${item.size}.`,
          );
        }

        const requestedToppingIds = item.topping_ids ?? [];
        const availableToppings = product.product_toppings
          .map((row) => row.toppings)
          .filter((topping) => requestedToppingIds.includes(topping.topping_id));

        if (availableToppings.length !== requestedToppingIds.length) {
          throw new BadRequestException(
            `Một hoặc nhiều topping không hợp lệ hoặc không được phép dùng với "${product.productName}".`,
          );
        }

        const baseAndSizePrice = Number(product.basePrice) + Number(size.add_price);
        const toppingPrice = availableToppings.reduce(
          (sum, topping) => sum + Number(topping.price),
          0,
        );
        const lineTotal = (baseAndSizePrice + toppingPrice) * item.quantity;
        subtotal += lineTotal;

        orderItems.push({
          product_id: product.productId,
          product_name: product.productName,
          size: item.size,
          unit_price: new Prisma.Decimal(baseAndSizePrice),
          quantity: item.quantity,
          line_total: new Prisma.Decimal(lineTotal),
          note: item.note?.trim() || null,
          toppings: availableToppings.map((topping) => ({
            topping_id: topping.topping_id,
            topping_name: topping.topping_name,
            price: new Prisma.Decimal(topping.price),
          })),
        });
      }

      let promotionId: string | null = null;
      let discount = 0;
      if (dto.promotion_code?.trim()) {
        const code = dto.promotion_code.trim().toUpperCase();
        const promotion = await tx.promotions.findUnique({ where: { code } });
        if (
          !promotion ||
          !promotion.is_active ||
          promotion.start_at > now ||
          promotion.end_at < now
        ) {
          throw new BadRequestException('Mã giảm giá không tồn tại, chưa bắt đầu hoặc đã hết hạn.');
        }
        if (subtotal < Number(promotion.min_amount)) {
          throw new BadRequestException(
            `Đơn hàng cần tối thiểu ${Number(promotion.min_amount).toLocaleString('vi-VN')}đ để áp dụng mã ${promotion.code}.`,
          );
        }

        promotionId = promotion.promotion_id;
        if (promotion.discount_type === 'percentage') {
          discount = Math.round((subtotal * Number(promotion.discount_value)) / 100);
          if (promotion.max_discount !== null) {
            discount = Math.min(discount, Number(promotion.max_discount));
          }
        } else {
          discount = Number(promotion.discount_value);
          if (promotion.max_discount !== null) {
            discount = Math.min(discount, Number(promotion.max_discount));
          }
        }
        discount = Math.max(0, Math.min(discount, subtotal));
      }

      const total = subtotal - discount;
      const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
      const orderCode = `BL-${datePart}-${randomBytes(3).toString('hex').toUpperCase()}`;

      const order = await tx.orders.create({
        data: {
          order_code: orderCode,
          user_id: user.user_id,
          promotion_id: promotionId,
          status: 'pending',
          subtotal: new Prisma.Decimal(subtotal),
          discount: new Prisma.Decimal(discount),
          total: new Prisma.Decimal(total),
          pickup_method: dto.pickup_method ?? 'AT_COUNTER',
          customer_name: dto.customer_name.trim(),
          customer_phone: dto.customer_phone.trim(),
          delivery_address: dto.delivery_address?.trim() || null,
          order_note: dto.order_note?.trim() || null,
          scheduled_at: scheduledAt,
          order_items: {
            create: orderItems.map((item) => ({
              product_id: item.product_id,
              product_name: item.product_name,
              size: item.size,
              unit_price: item.unit_price,
              quantity: item.quantity,
              line_total: item.line_total,
              note: item.note,
              order_item_toppings: {
                create: item.toppings.map((topping) => ({
                  topping_id: topping.topping_id,
                  topping_name: topping.topping_name,
                  price: topping.price,
                })),
              },
            })),
          },
        },
      });

      return {
        order_id: order.order_id,
        order_code: order.order_code,
        status: 'PENDING',
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        total: Number(order.total),
        created_at: order.created.toISOString(),
      };
    });
  }
}
