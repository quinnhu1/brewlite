import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  order_id!: string;

  @IsIn(['momo', 'vnpay', 'banking'])
  method!: 'momo' | 'vnpay' | 'banking';

  // Chỉ được tôn trọng nếu PAYMENT_MOCK_ALLOW_OVERRIDE=true và NODE_ENV khác production.
  @IsOptional()
  @IsIn(['SUCCESS', 'FAILED'])
  simulate_result?: 'SUCCESS' | 'FAILED';
}
