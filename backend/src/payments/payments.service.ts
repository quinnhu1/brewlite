import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createPayment(dto: CreatePaymentDto, idempotencyKey: string) {
    // Idempotency: gửi lại cùng key cho cùng đơn sẽ trả lại giao dịch đã lưu.
    const previous = await this.prisma.payments.findUnique({
      where: { idempotency_key: idempotencyKey },
      include: { orders: true },
    });
    if (previous) {
      if (previous.order_id !== dto.order_id) {
        throw new ConflictException('Idempotency-Key này đã được sử dụng cho đơn hàng khác.');
      }
      return this.toResponse(
        previous,
        previous.status === 'success' ? 'paid' : 'payment_failed',
        previous.orders.order_code,
      );
    }

    const allowMockOverride =
      process.env.NODE_ENV !== 'production' &&
      process.env.PAYMENT_MOCK_ALLOW_OVERRIDE === 'true';
    const isFailed = allowMockOverride && dto.simulate_result === 'FAILED';

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const order = await tx.orders.findUnique({
          where: { order_id: dto.order_id },
          select: {
            order_id: true,
            order_code: true,
            total: true,
            status: true,
          },
        });
        if (!order) {
          throw new NotFoundException(`Không tìm thấy đơn ${dto.order_id}.`);
        }
        if (order.status === 'paid') {
          throw new ConflictException('Đơn hàng đã thanh toán thành công.');
        }
        if (order.status !== 'pending' && order.status !== 'payment_failed') {
          throw new ConflictException(
            `Không thể thanh toán đơn hàng đang ở trạng thái ${order.status}.`,
          );
        }

        const transactionId = isFailed ? null : `MOCK-${randomUUID()}`;
        const payment = await tx.payments.create({
          data: {
            order_id: order.order_id,
            idempotency_key: idempotencyKey,
            // Số tiền lấy từ đơn trong DB, không nhận amount từ FE.
            amount: order.total,
            method: dto.method,
            status: isFailed ? 'failed' : 'success',
            transaction_id: transactionId,
            paid_at: isFailed ? null : new Date(),
          },
        });

        // Điều kiện trạng thái trong UPDATE chống hai yêu cầu khác key cùng trả một đơn.
        const update = await tx.orders.updateMany({
          where: {
            order_id: order.order_id,
            status: { in: ['pending', 'payment_failed'] },
          },
          data: { status: isFailed ? 'payment_failed' : 'paid' },
        });
        if (update.count !== 1) {
          throw new ConflictException(
            'Trạng thái đơn đã thay đổi. Hãy tải lại trạng thái trước khi thử lại.',
          );
        }

        return {
          payment,
          order_code: order.order_code,
          order_status: isFailed ? 'payment_failed' : 'paid',
        };
      });

      return this.toResponse(
        result.payment,
        result.order_status,
        result.order_code,
      );
    } catch (error: unknown) {
      // Xử lý trường hợp hai request đồng thời dùng đúng một idempotency key.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const racedPayment = await this.prisma.payments.findUnique({
          where: { idempotency_key: idempotencyKey },
          include: { orders: true },
        });
        if (racedPayment) {
          if (racedPayment.order_id !== dto.order_id) {
            throw new ConflictException('Idempotency-Key này đã được sử dụng cho đơn hàng khác.');
          }
          return this.toResponse(
            racedPayment,
            racedPayment.status === 'success' ? 'paid' : 'payment_failed',
            racedPayment.orders.order_code,
          );
        }
      }
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw error;
    }
  }

  private toResponse(
    payment: {
      payment_id: string;
      order_id: string;
      amount: Prisma.Decimal;
      method: string;
      status: string;
      transaction_id: string | null;
      paid_at: Date | null;
      idempotency_key: string;
    },
    orderStatus: string,
    orderCode: string,
  ) {
    return {
      payment_id: payment.payment_id,
      order_id: payment.order_id,
      order_code: orderCode,
      status: payment.status.toUpperCase(),
      payment_status: payment.status,
      order_status: orderStatus.toUpperCase(),
      method: payment.method,
      amount: Number(payment.amount),
      transaction_id: payment.transaction_id,
      idempotency_key: payment.idempotency_key,
      paid_at: payment.paid_at?.toISOString() ?? null,
    };
  }
}
