'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, parseApiError } from '@/libs/api';
import type { CartItem, PaymentMethod, PickupMethod, Promotion } from '@/store/useCartStore';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: CartItem[];
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

type CheckoutStep = 'INFO' | 'SCHEDULE' | 'SELECT_METHOD' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
type SimulatedOutcome = 'SUCCESS' | 'FAILED';

interface CreatedOrderResponse {
  order_id: string;
  order_code: string;
  status: string;
  subtotal: number | string;
  discount: number | string;
  total: number | string;
}

interface PaymentResponse {
  order_id: string;
  order_code: string;
  status: string;
  payment_status: string;
  order_status: string;
  method: string;
  amount: number | string;
  transaction_id: string | null;
  idempotency_key: string;
  paid_at: string | null;
}

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value);
const pad = (value: number) => String(value).padStart(2, '0');

function localDateValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function firstWeekdayMondayFirst(year: number, monthIndex: number) {
  const monthOffsets = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  const adjustedYear = year - (monthIndex < 2 ? 1 : 0);
  const sundayFirst = (adjustedYear + Math.floor(adjustedYear / 4) - Math.floor(adjustedYear / 100) + Math.floor(adjustedYear / 400) + monthOffsets[monthIndex] + 1) % 7;
  return (sundayFirst + 6) % 7;
}

function getCalendarDays(year: number, monthIndex: number) {
  const lengths = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const blanks = firstWeekdayMondayFirst(year, monthIndex);
  return [...Array.from({ length: blanks }, () => null), ...Array.from({ length: lengths[monthIndex] }, (_, index) => index + 1)];
}

function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `bl-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

const METHOD_OPTIONS: Array<{ id: PaymentMethod; title: string; backendMethod: 'vnpay' | 'momo' | 'banking' }> = [
  { id: 'VIETQR', title: 'VietQR', backendMethod: 'vnpay' },
  { id: 'E_WALLET', title: 'E-Wallets', backendMethod: 'momo' },
  { id: 'CARD', title: 'Credit / Debit Card', backendMethod: 'banking' },
];

export default function PaymentModal({
  isOpen,
  onClose,
  selectedItems,
  total,
  loyaltyPointsEarned,
  appliedPromotion,
  pickupMethod,
  onPaymentSuccess,
}: PaymentModalProps) {
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>('VIETQR');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [schedulePickup, setSchedulePickup] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('08:00');
  const [calendarYear, setCalendarYear] = useState<number | null>(null);
  const [calendarMonthIndex, setCalendarMonthIndex] = useState<number | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [orderId, setOrderId] = useState('');
  const [orderCode, setOrderCode] = useState('');
  const [step, setStep] = useState<CheckoutStep>('INFO');
  const [errorMessage, setErrorMessage] = useState('');
  const [simulateOutcome, setSimulateOutcome] = useState<SimulatedOutcome>('SUCCESS');
  const [confirmation, setConfirmation] = useState<OrderConfirmationResult | null>(null);
  const [retryNeedsNewKey, setRetryNeedsNewKey] = useState(false);

  if (!isOpen) return null;

  const initializeSchedule = () => {
    const suggested = new Date(Date.now() + 60 * 60 * 1000);
    setScheduledDate(localDateValue(suggested));
    setScheduledTime(`${pad(suggested.getHours())}:${pad(suggested.getMinutes())}`);
    setCalendarYear(suggested.getFullYear());
    setCalendarMonthIndex(suggested.getMonth());
  };

  const handleContinueFromInfo = () => {
    if (customerName.trim().length < 2) {
      setErrorMessage('Please enter the recipient’s full name.');
      return;
    }
    if (!/^[0-9+()\-\s]{8,20}$/.test(customerPhone.trim())) {
      setErrorMessage('Please enter a valid phone number.');
      return;
    }
    if (pickupMethod === 'DELIVERY' && deliveryAddress.trim().length < 5) {
      setErrorMessage('Please enter a delivery address.');
      return;
    }
    setErrorMessage('');
    setStep(schedulePickup ? 'SCHEDULE' : 'SELECT_METHOD');
  };

  const handleScheduleLaterChange = (checked: boolean) => {
    setSchedulePickup(checked);
    if (checked && !scheduledDate) initializeSchedule();
    setErrorMessage('');
  };

  const handleContinueFromSchedule = () => {
    if (!scheduledDate || !scheduledTime) {
      setErrorMessage('Please choose a pickup date and time.');
      return;
    }
    const selectedDate = new Date(`${scheduledDate}T${scheduledTime}`);
    if (Number.isNaN(selectedDate.getTime()) || selectedDate.getTime() <= Date.now()) {
      setErrorMessage('Pickup time must be in the future.');
      return;
    }
    setErrorMessage('');
    setStep('SELECT_METHOD');
  };

  const moveCalendarMonth = (delta: number) => {
    let year = calendarYear ?? 2026;
    let month = (calendarMonthIndex ?? 0) + delta;
    if (month < 0) { year -= 1; month = 11; }
    if (month > 11) { year += 1; month = 0; }
    setCalendarYear(year);
    setCalendarMonthIndex(month);
  };

  const calendarDays = calendarYear !== null && calendarMonthIndex !== null
    ? getCalendarDays(calendarYear, calendarMonthIndex)
    : [] as Array<number | null>;

  const handleRetryPayment = () => {
    if (retryNeedsNewKey) setIdempotencyKey(newIdempotencyKey());
    setRetryNeedsNewKey(false);
    setErrorMessage('');
    setStep('SELECT_METHOD');
  };

  const handleConfirmPayment = async () => {
    if (selectedItems.length === 0) {
      setErrorMessage('Your cart is empty. Add a drink before checking out.');
      setStep('FAILED');
      return;
    }

    setErrorMessage('');
    setStep('PROCESSING');
    setRetryNeedsNewKey(false);
    const requestIdempotencyKey = idempotencyKey || newIdempotencyKey();
    if (!idempotencyKey) setIdempotencyKey(requestIdempotencyKey);

    try {
      let createdOrderId = orderId;
      let createdOrderCode = orderCode;

      if (!createdOrderId) {
        const orderResponse = await fetch(`${API_BASE_URL}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pickup_method: pickupMethod,
            customer_name: customerName.trim(),
            customer_phone: customerPhone.trim(),
            delivery_address: deliveryAddress.trim() || undefined,
            order_note: orderNote.trim() || undefined,
            scheduled_at: schedulePickup && scheduledDate && scheduledTime
              ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
              : undefined,
            promotion_code: appliedPromotion?.code || undefined,
            items: selectedItems.map((item) => ({
              product_id: item.product_id,
              size: item.size,
              quantity: item.quantity,
              topping_ids: item.toppings.map((topping) => topping.topping_id),
              note: item.note?.trim() || undefined,
            })),
          }),
        });

        if (!orderResponse.ok) throw new Error(await parseApiError(orderResponse));
        const orderData = (await orderResponse.json()) as CreatedOrderResponse;
        if (!orderData.order_id || !orderData.order_code || orderData.status !== 'PENDING') {
          throw new Error('The API did not return a valid PENDING order.');
        }
        createdOrderId = orderData.order_id;
        createdOrderCode = orderData.order_code;
        setOrderId(createdOrderId);
        setOrderCode(createdOrderCode);
      }

      const selectedMethod = METHOD_OPTIONS.find((item) => item.id === method);
      if (!selectedMethod) throw new Error('Please choose a payment method.');
      const paymentResponse = await fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': requestIdempotencyKey,
        },
        body: JSON.stringify({
          order_id: createdOrderId,
          method: selectedMethod.backendMethod,
          ...(process.env.NODE_ENV !== 'production' ? { simulate_result: simulateOutcome } : {}),
        }),
      });

      if (!paymentResponse.ok) throw new Error(await parseApiError(paymentResponse));
      const paymentData = (await paymentResponse.json()) as PaymentResponse;
      setOrderId(paymentData.order_id || createdOrderId);
      setOrderCode(paymentData.order_code || createdOrderCode);

      if (paymentData.payment_status === 'failed' || paymentData.order_status === 'PAYMENT_FAILED') {
        setRetryNeedsNewKey(true);
        setErrorMessage('The mock payment was declined. Your order is saved as PAYMENT_FAILED; your cart has been kept.');
        setStep('FAILED');
        return;
      }
      if (paymentData.payment_status !== 'success' || paymentData.order_status !== 'PAID') {
        throw new Error('The API has not confirmed PAID. The interface will not mark this payment as successful.');
      }

      setConfirmation({
        order_id: paymentData.order_id,
        order_code: paymentData.order_code,
        status: 'PAID',
        payment_method: method,
        transaction_id: paymentData.transaction_id || 'MOCK-TRANSACTION',
        idempotency_key: paymentData.idempotency_key || requestIdempotencyKey,
        total: Number(paymentData.amount),
        loyalty_earned: Math.floor(Number(paymentData.amount) / 10000),
        paid_at: paymentData.paid_at ? new Date(paymentData.paid_at).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN'),
      });
      setStep('SUCCESS');
    } catch (error: unknown) {
      setStep('FAILED');
      setErrorMessage(error instanceof Error
        ? `${error.message}. Your cart has been kept. Check the order status before retrying.`
        : 'Could not reach the order/payment API. Your cart has been kept.');
      setRetryNeedsNewKey(false);
    }
  };

  const finishOrder = () => {
    if (!confirmation) return;
    onPaymentSuccess(confirmation);
    onClose();
  };

  const paymentMethodLabel = method === 'VIETQR' ? 'VietQR' : method === 'E_WALLET' ? 'E-Wallets (MoMo)' : 'Credit / Debit Card';
  const monthLabel = calendarYear !== null && calendarMonthIndex !== null
    ? `${MONTH_NAMES[calendarMonthIndex]} ${calendarYear}`
    : '';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[#2b100c]/20 px-4 py-5 backdrop-blur-[1px]" role="dialog" aria-modal="true" aria-labelledby="checkout-modal-title">
      <div className="relative my-auto max-h-[calc(100vh-40px)] w-full max-w-[720px] overflow-y-auto rounded-[28px] border border-[#9b7d68] bg-[#f5f4f2] px-6 py-7 text-[#2b100c] shadow-[0_12px_50px_rgba(43,16,12,0.14)] sm:px-10 sm:py-9 md:px-[58px] md:py-[42px]">
        {step !== 'SUCCESS' && step !== 'PROCESSING' && (
          <button
            type="button"
            onClick={() => step === 'INFO' ? onClose() : step === 'SCHEDULE' ? setStep('INFO') : setStep(schedulePickup ? 'SCHEDULE' : 'INFO')}
            aria-label={step === 'INFO' ? 'Back to cart' : 'Back to previous step'}
            className="mb-3 inline-flex h-8 w-8 items-center justify-center text-3xl leading-none hover:text-[#715039]"
          >
            ←
          </button>
        )}

        {step === 'INFO' && (
          <section>
            <h2 id="checkout-modal-title" className="mb-5 text-[27px] font-bold">Info</h2>
            <div className="space-y-4">
              <Field label="Full name" value={customerName} onChange={setCustomerName} autoComplete="name" maxLength={100} />
              <Field label="Phone number" value={customerPhone} onChange={setCustomerPhone} autoComplete="tel" maxLength={20} inputMode="tel" />
              <div className="pt-1">
                <h3 className="mb-1 text-[23px] font-bold">Address</h3>
                <Field label="Address" value={deliveryAddress} onChange={setDeliveryAddress} maxLength={500} required={pickupMethod === 'DELIVERY'} />
              </div>
              <Field label="Note" value={orderNote} onChange={setOrderNote} maxLength={500} />
            </div>

            <div className="mt-5">
              <h3 className="mb-2 text-[23px] font-bold">Time</h3>
              <label className="flex cursor-pointer items-center gap-4 py-1.5 pl-5 text-[17px]">
                <input type="radio" name="pickup-time" checked={!schedulePickup} onChange={() => { setSchedulePickup(false); setErrorMessage(''); }} className="h-[19px] w-[19px] accent-[#2b100c]" />
                <span>Now (30 mins)</span>
              </label>
              <label className="flex cursor-pointer items-center gap-4 py-1.5 pl-5 text-[17px]">
                <input type="radio" name="pickup-time" checked={schedulePickup} onChange={() => handleScheduleLaterChange(true)} className="h-[19px] w-[19px] accent-[#2b100c]" />
                <span>Schedule for later</span>
              </label>
            </div>

            {errorMessage && <ErrorBox message={errorMessage} />}
            <PrimaryButton onClick={handleContinueFromInfo}>NEXT</PrimaryButton>
          </section>
        )}

        {step === 'SCHEDULE' && (
          <section>
            <h2 id="checkout-modal-title" className="mb-7 text-[27px] font-bold">Scheduled pick up</h2>
            <h3 className="mb-5 text-[22px]">Choose date</h3>
            <div className="overflow-hidden rounded-[22px] border-2 border-[#805d45]">
              <div className="flex items-center justify-between border-b border-[#805d45] px-5 py-3.5">
                <span className="text-[19px]">{monthLabel}</span>
                <div className="flex gap-3">
                  <button type="button" aria-label="Previous month" onClick={() => moveCalendarMonth(-1)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2b100c] text-xl text-white">‹</button>
                  <button type="button" aria-label="Next month" onClick={() => moveCalendarMonth(1)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2b100c] text-xl text-white">›</button>
                </div>
              </div>
              <div className="grid grid-cols-7 px-3 pt-3 text-center text-[14px] font-medium sm:px-5 sm:text-[16px]">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day} className="py-2">{day}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-y-1 px-3 pb-4 text-center sm:px-5">
                {calendarDays.map((day, index) => {
                  if (day === null || calendarYear === null || calendarMonthIndex === null) return <span key={`blank-${index}`} />;
                  const dateValue = `${calendarYear}-${pad(calendarMonthIndex + 1)}-${pad(day)}`;
                  const selected = scheduledDate === dateValue;
                  return (
                    <button key={dateValue} type="button" onClick={() => setScheduledDate(dateValue)} aria-pressed={selected} className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-[14px] sm:h-9 sm:w-9 ${selected ? 'border border-[#805d45] bg-white font-bold' : 'hover:bg-[#e6d9ce]'}`}>
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
              <label htmlFor="scheduled-time" className="text-[21px]">Choose time</label>
              <input id="scheduled-time" type="time" value={scheduledTime} onChange={(event) => setScheduledTime(event.target.value)} className="rounded-full border border-[#8b6c56] bg-transparent px-5 py-3 text-[17px] outline-none focus:ring-2 focus:ring-[#b99a83]" />
            </div>
            {errorMessage && <ErrorBox message={errorMessage} />}
            <PrimaryButton onClick={handleContinueFromSchedule}>NEXT</PrimaryButton>
          </section>
        )}

        {step === 'SELECT_METHOD' && (
          <section>
            <h2 id="checkout-modal-title" className="mb-7 text-[27px] font-bold">Payment</h2>
            <div className="space-y-5">
              {METHOD_OPTIONS.map((option) => {
                const selected = method === option.id;
                return (
                  <button key={option.id} type="button" aria-pressed={selected} onClick={() => setMethod(option.id)} className={`min-h-[82px] w-full rounded-[13px] border-2 px-8 py-5 text-left text-[22px] transition-colors sm:min-h-[94px] sm:text-[27px] ${selected ? 'border-[#715039] bg-[#715039] text-white' : 'border-[#715039] bg-transparent text-[#2b100c] hover:bg-[#eae2da]'}`}>
                    {option.title}
                  </button>
                );
              })}
            </div>
            {process.env.NODE_ENV !== 'production' && (
              <details className="mt-5 rounded-lg border border-dashed border-[#b89d89] px-3 py-2 text-xs text-[#715039]">
                <summary className="cursor-pointer font-semibold">Local demo controls</summary>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => setSimulateOutcome('SUCCESS')} className={`rounded-full px-3 py-1.5 ${simulateOutcome === 'SUCCESS' ? 'bg-[#2b100c] text-white' : 'bg-[#e8ded4]'}`}>Success</button>
                  <button type="button" onClick={() => setSimulateOutcome('FAILED')} className={`rounded-full px-3 py-1.5 ${simulateOutcome === 'FAILED' ? 'bg-[#2b100c] text-white' : 'bg-[#e8ded4]'}`}>Failure</button>
                </div>
              </details>
            )}
            {errorMessage && <ErrorBox message={errorMessage} />}
            <div className="mt-9 grid grid-cols-2 gap-4 sm:gap-8">
              <SecondaryButton onClick={() => { setErrorMessage(''); setStep(schedulePickup ? 'SCHEDULE' : 'INFO'); }}>BACK</SecondaryButton>
              <PrimaryButton className="mt-0" onClick={handleConfirmPayment}>CONFIRM</PrimaryButton>
            </div>
            <p className="mt-4 text-center text-sm text-[#806b5e]">Total: {money(total)} VND</p>
          </section>
        )}

        {step === 'PROCESSING' && (
          <section className="py-14 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#d9c8ba] border-t-[#2b100c]" />
            <h2 id="checkout-modal-title" className="mt-5 text-xl font-bold">Processing payment…</h2>
            <p className="mt-2 text-sm text-[#806b5e]">Please keep this window open while the API responds.</p>
          </section>
        )}

        {step === 'SUCCESS' && confirmation && (
          <section className="py-2 text-center sm:py-3">
            <h2 id="checkout-modal-title" className="text-[31px] font-semibold">Successful!!</h2>
            <p className="text-[19px] text-[#705d50]">Thank you for your order!</p>
            <div className="mx-auto mt-11 max-w-[490px] space-y-6 sm:mt-14">
              <div className="flex min-h-[78px] items-center justify-between gap-4 rounded-[11px] border-2 border-[#805d45] px-5 py-4 text-left text-[20px] sm:text-[25px]">
                <span>Order ID:</span><strong className="text-right">#{confirmation.order_code}</strong>
              </div>
              <div className="flex min-h-[78px] items-center justify-between gap-4 rounded-[11px] border-2 border-[#805d45] px-5 py-4 text-left text-[20px] sm:text-[25px]">
                <span>Order status:</span><strong>Paid</strong>
              </div>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-[72px] sm:grid-cols-2 sm:gap-7">
              <button type="button" onClick={finishOrder} className="min-h-[67px] rounded-full bg-[#2b100c] px-5 py-4 text-[18px] font-bold text-white hover:bg-[#543322] sm:text-[20px]">TRACK ORDER</button>
              <button type="button" onClick={() => { finishOrder(); router.push('/'); }} className="min-h-[67px] rounded-full bg-[#2b100c] px-5 py-4 text-[18px] font-bold text-white hover:bg-[#543322] sm:text-[20px]">BACK TO HOME</button>
            </div>
            <p className="mt-5 text-xs text-[#806b5e]">{paymentMethodLabel} · {money(confirmation.total)} VND · +{loyaltyPointsEarned} points</p>
          </section>
        )}

        {step === 'FAILED' && (
          <section className="py-3 text-center">
            <h2 id="checkout-modal-title" className="text-[27px] font-bold">Payment unsuccessful</h2>
            <p className="mt-4 text-left text-sm leading-relaxed text-[#6d5140]">{errorMessage}</p>
            {orderCode && <p className="mt-3 text-left text-sm">Order: <strong>{orderCode}</strong></p>}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <SecondaryButton onClick={onClose}>CLOSE</SecondaryButton>
              <PrimaryButton className="mt-0" onClick={handleRetryPayment}>TRY AGAIN</PrimaryButton>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  autoComplete,
  maxLength,
  inputMode,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  maxLength: number;
  inputMode?: 'text' | 'tel' | 'email' | 'numeric';
  required?: boolean;
}) {
  const inputId = `checkout-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <label htmlFor={inputId} className="block text-[18px] sm:text-[20px]">
      <span className="mb-2 block">{label}{required ? ' *' : ''}</span>
      <input id={inputId} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} maxLength={maxLength} inputMode={inputMode} required={required} className="h-[42px] w-full rounded-full border border-[#8c6b54] bg-transparent px-4 text-[16px] outline-none transition focus:border-[#2b100c] focus:ring-2 focus:ring-[#d7c3b3]" />
    </label>
  );
}

function PrimaryButton({ onClick, children, className = '' }: { onClick: () => void; children: React.ReactNode; className?: string }) {
  return <button type="button" onClick={onClick} className={`mx-auto mt-9 flex min-h-[61px] w-full max-w-[290px] items-center justify-center rounded-full bg-[#2b100c] px-7 py-4 text-[20px] font-bold text-white transition hover:bg-[#543322] ${className}`}>{children}</button>;
}

function SecondaryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className="min-h-[61px] rounded-full border border-[#2b100c] px-5 py-4 text-[18px] font-bold text-[#2b100c] transition hover:bg-[#eae2da]">{children}</button>;
}

function ErrorBox({ message }: { message: string }) {
  return <div role="alert" className="mt-4 rounded-lg border border-[#b88273] bg-[#fff4f0] px-4 py-3 text-sm text-[#7d3022]">{message}</div>;
}
