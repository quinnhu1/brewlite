import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { PaymentsService } from './payments.service.js';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Thanh toán giả lập và cập nhật trạng thái đơn' })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  createPayment(
    @Body() body: CreatePaymentDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    if (!idempotencyKey?.trim()) {
      throw new BadRequestException('Thiếu header Idempotency-Key.');
    }
    if (idempotencyKey.length > 255) {
      throw new BadRequestException('Idempotency-Key không được dài quá 255 ký tự.');
    }
    return this.paymentsService.createPayment(body, idempotencyKey.trim());
  }
}
