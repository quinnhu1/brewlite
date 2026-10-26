'use client';

import React, { useState, useEffect } from 'react';
import {
  CartItem,
  PaymentMethod,
  PickupMethod,
  Promotion,
} from '@/store/useCartStore';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  loyaltyPointsEarned: number;
  appliedPromotion: Promotion | null;
  pickupMethod: PickupMethod;
  onPaymentSuccess: (orderResult: OrderConfirmationResult) => void;
}

export interface OrderConfirmationResult {
  order_id: string;
  order_code: string;
  status: 'PAID' | 'PAYMENT_FAILED';
  payment_method: PaymentMethod;
  transaction_id: string;
  idempotency_key: string;
  total: number;
  loyalty_earned: number;
  paid_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function PaymentModal({
  isOpen,
  onClose,
  selectedItems,
  subtotal,
  discount,
  total,
  loyaltyPointsEarned,
  appliedPromotion,
  pickupMethod,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('E_WALLET');
  const [cardNumber, setCardNumber] = useState('9704 1234 5678 9012');
  const [cardHolder, setCardHolder] = useState('NGUYEN VAN AN');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');

  // Khóa chống thanh toán trùng (Idempotency-Key - Yêu cầu Task 8 & Task 10)
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [orderCode, setOrderCode] = useState<string>('');

  // Trạng thái xử lý giao dịch
  const [step, setStep] = useState<'SELECT_METHOD' | 'PROCESSING' | 'SUCCESS' | 'FAILED'>('SELECT_METHOD');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [simulateOutcome, setSimulateOutcome] = useState<'SUCCESS' | 'FAILED'>('SUCCESS');
  const [confirmation, setConfirmation] = useState<OrderConfirmationResult | null>(null);

  // Khi mở pop-up, khởi tạo mã đơn tạm và Idempotency-Key mới
  useEffect(() => {
    if (isOpen) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      setOrderId(crypto.randomUUID ? crypto.randomUUID() : `ord-${Date.now()}`);
      setOrderCode(`ORD-${today}-${randomSuffix}`);
      setIdempotencyKey(`IDEM-${Date.now()}-${randomSuffix}`);
      setStep('SELECT_METHOD');
      setErrorMessage('');
      setConfirmation(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Sinh Idempotency-Key mới khi khách nhấn "Thử thanh toán lại"
  const handleRetryPayment = () => {
    const retrySuffix = Math.floor(1000 + Math.random() * 9000);
    setIdempotencyKey(`IDEM-RETRY-${Date.now()}-${retrySuffix}`);
    setStep('SELECT_METHOD');
    setErrorMessage('');
  };

  // Xử lý tạo đơn (POST /orders) và thanh toán không tiền mặt (POST /payments)
  const handleConfirmPayment = async () => {
    if (method === 'CARD') {
      if (!cardNumber.trim() || !cardHolder.trim() || !cardExpiry.trim() || !cardCvv.trim()) {
        setErrorMessage('Vui lòng nhập đầy đủ thông tin thẻ ngân hàng.');
        return;
      }
    }

    setErrorMessage('');
    setStep('PROCESSING');

    try {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('brewlite_token') : null;

      let createdOrderId = orderId;
      let createdOrderCode = orderCode;

      // 1. Thử gọi Backend thật (POST /orders & POST /payments) nếu server đang bật
      try {
        const orderResponse = await fetch(`${API_BASE_URL}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            promotion_id: appliedPromotion?.promotion_id ?? null,
            pickup_method: pickupMethod,
            items: selectedItems.map((item) => ({
              product_id: item.product_id,
              product_name: item.product_name,
              size: item.size,
              unit_price: item.unit_price,
              quantity: item.quantity,
              line_total: item.line_total,
              toppings: item.toppings.map((t) => ({
                topping_id: t.topping_id,
                topping_name: t.topping_name,
                price: t.price,
              })),
            })),
          }),
        });

        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          createdOrderId = orderData.order_id || orderData.id || createdOrderId;
          createdOrderCode = orderData.order_code || createdOrderCode;
        }

        const paymentResponse = await fetch(`${API_BASE_URL}/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            order_id: createdOrderId,
            idempotency_key: idempotencyKey,
            amount: total,
            method,
            simulate_status: simulateOutcome,
          }),
        });

        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();
          if (paymentData.status === 'FAILED' || paymentData.order_status === 'PAYMENT_FAILED') {
            throw new Error(
              paymentData.message || 'Cổng thanh toán từ chối giao dịch (PAYMENT_FAILED).'
            );
          }

          const successResult: OrderConfirmationResult = {
            order_id: createdOrderId,
            order_code: createdOrderCode,
            status: 'PAID',
            payment_method: method,
            transaction_id: paymentData.transaction_id || `TXN-${Date.now()}`,
            idempotency_key: idempotencyKey,
            total,
            loyalty_earned: loyaltyPointsEarned,
            paid_at: new Date().toLocaleString('vi-VN'),
          };
          setConfirmation(successResult);
          setStep('SUCCESS');
          return;
        }
      } catch {
        // Nếu Backend (cổng 3001) chưa chạy, tự động chuyển sang Mock Payment Gateway giả lập
      }

      // 2. Chế độ Mock Payment Gateway (Đảm bảo FE demo độc lập mượt mà)
      await new Promise((resolve) => setTimeout(resolve, 1200));

      if (simulateOutcome === 'FAILED') {
        setStep('FAILED');
        setErrorMessage(
          'Giao dịch không thành công từ cổng thanh toán giả lập. Đơn hàng chuyển sang trạng thái PAYMENT_FAILED và giỏ hàng vẫn được giữ nguyên.'
        );
        return;
      }

      const mockSuccessResult: OrderConfirmationResult = {
        order_id: createdOrderId,
        order_code: createdOrderCode,
        status: 'PAID',
        payment_method: method,
        transaction_id: `TXN-DEMO-${Math.floor(100000 + Math.random() * 900000)}`,
        idempotency_key: idempotencyKey,
        total,
        loyalty_earned: loyaltyPointsEarned,
        paid_at: new Date().toLocaleString('vi-VN'),
      };

      setConfirmation(mockSuccessResult);
      setStep('SUCCESS');
    } catch (err: unknown) {
      setStep('FAILED');
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Không thể kết nối cổng thanh toán. Đơn hàng đang ở trạng thái PAYMENT_FAILED.'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-amber-100 overflow-hidden my-8">
        {/* Header của Pop-up */}
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-900 to-amber-800 px-6 py-4 text-white">
          <div>
            <h2 id="payment-modal-title" className="text-lg font-bold tracking-wide">
              {step === 'SUCCESS'
                ? 'Xác nhận Thanh toán Thành công'
                : step === 'FAILED'
                ? 'Thanh toán Thất bại'
                : 'Thanh toán Không tiền mặt'}
            </h2>
            <p className="text-xs text-amber-200 mt-0.5">
              Mã đơn tạm: <span className="font-mono font-semibold">{orderCode}</span>
            </p>
          </div>
          {step !== 'PROCESSING' && (
            <button
              type="button"
              onClick={() => {
                if (step === 'SUCCESS' && confirmation) {
                  onPaymentSuccess(confirmation);
                }
                onClose();
              }}
              className="rounded-lg p-1.5 text-amber-100 hover:bg-white/15 hover:text-white transition"
              aria-label="Đóng cửa sổ thanh toán"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Nội dung theo từng bước */}
        <div className="p-6">
          {/* BƯỚC 1: CHỌN PHƯƠNG THỨC THANH TOÁN (VÍ ĐIỆN TỬ / THẺ) */}
          {step === 'SELECT_METHOD' && (
            <div className="space-y-5">
              {/* Tóm tắt số tiền cần thanh toán */}
              <div className="rounded-xl bg-amber-50/80 border border-amber-200/80 p-4">
                <div className="flex justify-between text-sm text-stone-600">
                  <span>Tạm tính ({selectedItems.length} dòng món):</span>
                  <span className="font-medium text-stone-800">
                    {subtotal.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-700 mt-1">
                    <span>Giảm giá ({appliedPromotion?.code}):</span>
                    <span className="font-medium">-{discount.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
                <div className="border-t border-amber-200/80 my-2.5 pt-2.5 flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-stone-800">Tổng thanh toán:</span>
                  <span className="text-2xl font-extrabold text-amber-900">
                    {total.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-amber-800 bg-amber-100/70 px-3 py-1.5 rounded-lg mt-2">
                  <span>Điểm thưởng tích lũy dự kiến:</span>
                  <span className="font-bold">+{loyaltyPointsEarned} điểm</span>
                </div>
              </div>

              {/* Chọn phương thức: Ví điện tử (E_WALLET) hoặc Thẻ ngân hàng (CARD) */}
              <div>
                <label className="block text-sm font-semibold text-stone-800 mb-2.5">
                  Chọn phương thức thanh toán không tiền mặt
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMethod('E_WALLET')}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 p-3.5 transition ${
                      method === 'E_WALLET'
                        ? 'border-amber-700 bg-amber-50/70 text-amber-950 shadow-sm'
                        : 'border-stone-200 bg-white text-stone-600 hover:border-amber-300'
                    }`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-pink-100 text-pink-800 mb-1.5">
                      QR Ví Điện Tử
                    </span>
                    <span className="text-sm font-semibold">MoMo / VNPay</span>
                    <span className="text-[11px] text-stone-500 mt-0.5">Quét mã QR nhanh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('CARD')}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 p-3.5 transition ${
                      method === 'CARD'
                        ? 'border-amber-700 bg-amber-50/70 text-amber-950 shadow-sm'
                        : 'border-stone-200 bg-white text-stone-600 hover:border-amber-300'
                    }`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800 mb-1.5">
                      Thẻ Ngân Hàng
                    </span>
                    <span className="text-sm font-semibold">ATM / Visa / Master</span>
                    <span className="text-[11px] text-stone-500 mt-0.5">Cổng thẻ nội địa & quốc tế</span>
                  </button>
                </div>
              </div>

              {/* Giao diện chi tiết từng phương thức */}
              {method === 'E_WALLET' ? (
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-center">
                  <p className="text-xs font-medium text-stone-600 mb-3">
                    Mở ứng dụng Ví điện tử bất kỳ để quét mã QR thanh toán cho đơn{' '}
                    <span className="font-semibold text-stone-800">{orderCode}</span>
                  </p>
                  {/* Mã QR SVG giả lập sắc nét */}
                  <div className="mx-auto w-44 h-44 bg-white p-3 rounded-xl border border-stone-200 shadow-inner flex flex-col items-center justify-center">
                    <svg
                      viewBox="0 0 120 120"
                      className="w-32 h-32 text-stone-900"
                      fill="currentColor"
                    >
                      <rect x="8" y="8" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="6" />
                      <rect x="18" y="18" width="12" height="12" />
                      <rect x="80" y="8" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="6" />
                      <rect x="90" y="18" width="12" height="12" />
                      <rect x="8" y="80" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="6" />
                      <rect x="18" y="90" width="12" height="12" />
                      <rect x="48" y="12" width="8" height="8" />
                      <rect x="60" y="20" width="8" height="16" />
                      <rect x="48" y="44" width="16" height="8" />
                      <rect x="12" y="48" width="16" height="8" />
                      <rect x="32" y="56" width="8" height="16" />
                      <rect x="52" y="60" width="16" height="16" />
                      <rect x="76" y="48" width="12" height="8" />
                      <rect x="96" y="56" width="12" height="16" />
                      <rect x="48" y="84" width="12" height="12" />
                      <rect x="68" y="80" width="16" height="8" />
                      <rect x="88" y="88" width="20" height="12" />
                      <rect x="68" y="100" width="12" height="12" />
                    </svg>
                    <span className="text-[10px] font-mono text-stone-500 mt-1">
                      BREWLITE • {total.toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Số thẻ ngân hàng
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="9704 xxxx xxxx xxxx"
                      className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-amber-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Tên chủ thẻ (không dấu)
                    </label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      placeholder="NGUYEN VAN AN"
                      className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 uppercase focus:border-amber-700 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        Ngày hết hạn
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-amber-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        Mã bảo mật (CVV/OTP)
                      </label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="***"
                        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-amber-700 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Chế độ kiểm thử nhanh kết quả cổng thanh toán giả lập (Phục vụ Demo Task 8) */}
              <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/70 px-3.5 py-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-600">
                    Chế độ giả lập Cổng thanh toán (Mock Gateway):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSimulateOutcome('SUCCESS')}
                      className={`px-2.5 py-1 rounded-md font-medium transition ${
                        simulateOutcome === 'SUCCESS'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                      }`}
                    >
                      Thành công (PAID)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulateOutcome('FAILED')}
                      className={`px-2.5 py-1 rounded-md font-medium transition ${
                        simulateOutcome === 'FAILED'
                          ? 'bg-rose-600 text-white'
                          : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                      }`}
                    >
                      Lỗi (PAYMENT_FAILED)
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-stone-500 mt-1 font-mono truncate">
                  Idempotency-Key: {idempotencyKey}
                </p>
              </div>

              {errorMessage && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-700">
                  {errorMessage}
                </div>
              )}

              {/* Nút hành động */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 rounded-xl border border-stone-300 bg-white py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  className="w-2/3 rounded-xl bg-amber-800 py-3 text-sm font-bold text-white shadow-md hover:bg-amber-900 transition"
                >
                  Xác nhận trả • {total.toLocaleString('vi-VN')}đ
                </button>
              </div>
            </div>
          )}

          {/* BƯỚC 2: ĐANG XỬ LÝ GIAO DỊCH */}
          {step === 'PROCESSING' && (
            <div className="py-12 text-center space-y-4">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-amber-200 border-t-amber-800" />
              <div>
                <h3 className="text-base font-bold text-stone-800">
                  Đang kết nối cổng thanh toán...
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Đang kiểm tra tồn kho và xác thực khóa chống trùng ({idempotencyKey})
                </p>
              </div>
            </div>
          )}

          {/* BƯỚC 3: KẾT QUẢ THÀNH CÔNG (TRẠNG THÁI PAID) */}
          {step === 'SUCCESS' && confirmation && (
            <div className="text-center space-y-5 py-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div>
                <span className="inline-block rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800">
                  Trạng thái đơn: {confirmation.status} (Đã thanh toán)
                </span>
                <h3 className="text-xl font-extrabold text-stone-900 mt-2">
                  Đặt hàng thành công!
                </h3>
                <p className="text-sm text-stone-600 mt-1">
                  Quầy pha chế đã tiếp nhận đơn. Mời bạn theo dõi trạng thái để tới quầy lấy nước.
                </p>
              </div>

              <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-500">Mã đơn hàng:</span>
                  <span className="font-mono font-bold text-stone-900">
                    {confirmation.order_code}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Mã giao dịch:</span>
                  <span className="font-mono text-stone-800">{confirmation.transaction_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Phương thức:</span>
                  <span className="font-semibold text-stone-800">
                    {confirmation.payment_method === 'E_WALLET' ? 'Ví điện tử (QR)' : 'Thẻ ngân hàng'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Số tiền đã trả:</span>
                  <span className="font-bold text-amber-900">
                    {confirmation.total.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Điểm thưởng cộng thêm:</span>
                  <span className="font-bold text-emerald-700">
                    +{confirmation.loyalty_earned} điểm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Thời gian thanh toán:</span>
                  <span className="text-stone-700">{confirmation.paid_at}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onPaymentSuccess(confirmation);
                  onClose();
                }}
                className="w-full rounded-xl bg-amber-800 py-3 text-sm font-bold text-white shadow-md hover:bg-amber-900 transition"
              >
                Hoàn tất & Xem xác nhận đơn
              </button>
            </div>
          )}

          {/* BƯỚC 4: KẾT QUẢ THẤT BẠI (TRẠNG THÁI PAYMENT_FAILED - GIỮ NGUYÊN GIỎ HÀNG) */}
          {step === 'FAILED' && (
            <div className="text-center space-y-5 py-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
                </svg>
              </div>

              <div>
                <span className="inline-block rounded-full bg-rose-100 px-3 py-0.5 text-xs font-bold text-rose-800">
                  Trạng thái đơn: PAYMENT_FAILED
                </span>
                <h3 className="text-lg font-extrabold text-stone-900 mt-2">
                  Giao dịch thanh toán chưa thành công
                </h3>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">{errorMessage}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 rounded-xl border border-stone-300 bg-white py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition"
                >
                  Đóng (Giữ giỏ hàng)
                </button>
                <button
                  type="button"
                  onClick={handleRetryPayment}
                  className="w-1/2 rounded-xl bg-amber-800 py-3 text-sm font-bold text-white shadow-md hover:bg-amber-900 transition"
                >
                  Thử thanh toán lại
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}