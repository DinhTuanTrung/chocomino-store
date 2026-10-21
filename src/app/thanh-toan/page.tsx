'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import administrativeData from '@/data/administrative_areas.json';
import {
  CreditCard,
  Truck,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

const ADMINISTRATIVE_AREAS: Record<string, string[]> = administrativeData;

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, subtotal, hasPreorder, clearCart } = useCart();

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [province, setProvince] = useState('Thành phố Hồ Chí Minh');
  const [ward, setWard] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [note, setNote] = useState('');
  const [source, setSource] = useState('Khác');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank_qr'>(
    hasPreorder ? 'bank_qr' : 'cod'
  );
  const [agreedPolicy, setAgreedPolicy] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Enforce bank_qr when preorder items exist in cart
  useEffect(() => {
    if (hasPreorder) {
      setPaymentMethod('bank_qr');
    }
  }, [hasPreorder]);

  // Autofill UTM source if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const utm = urlParams.get('utm_source');
      if (utm) {
        setSource(utm);
      }
    }
  }, []);

  // List of provinces from SPX
  const provinceList = useMemo(() => Object.keys(ADMINISTRATIVE_AREAS), []);

  // List of wards for chosen province
  const wardList = useMemo(() => {
    return ADMINISTRATIVE_AREAS[province] || [];
  }, [province]);

  // Set first ward as default when province changes
  useEffect(() => {
    if (wardList.length > 0 && !wardList.includes(ward)) {
      setWard(wardList[0]);
    }
  }, [province, wardList, ward]);

  // Calculate dynamic shipping fee (18.000d for HCM, 22.000d for others)
  const isHCM = province.includes('Hồ Chí Minh');
  const shippingFee = isHCM ? 18000 : 22000;
  const total = subtotal + shippingFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (cart.length === 0) {
      setErrorMessage('Giỏ hàng của bạn đang trống!');
      return;
    }

    if (!customerName.trim() || !phone.trim() || !email.trim() || !addressDetail.trim() || !ward) {
      setErrorMessage('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
      return;
    }

    // Phone validation (10 digits starting with 03, 05, 07, 08, 09 or +84)
    const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    if (!phoneRegex.test(phone.trim())) {
      setErrorMessage('Số điện thoại không đúng định dạng di động Việt Nam (vd: 0912345678)');
      return;
    }

    if (!agreedPolicy) {
      setErrorMessage('Vui lòng đồng ý với Chính sách đổi trả và Chính sách bảo mật');
      return;
    }

    setIsSubmitting(true);

    try {
      const idempotencyKey = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          province,
          ward,
          addressDetail: addressDetail.trim(),
          note: note.trim() || undefined,
          source,
          paymentMethod,
          items: cart,
          idempotencyKey,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || 'Không thể tạo đơn hàng, vui lòng thử lại.');
        setIsSubmitting(false);
        return;
      }

      // Order created successfully
      const createdOrder = data.order;
      clearCart();

      // Store recent order info in sessionStorage for immediate QR/Success display
      sessionStorage.setItem('last_chocomino_order', JSON.stringify(createdOrder));

      // Redirect to Order Success / QR page
      router.push(`/dat-hang-thanh-cong?code=${createdOrder.code}`);
    } catch (err) {
      console.error('Lỗi khi gửi đơn hàng:', err);
      setErrorMessage('Đã có lỗi kết nối đến máy chủ. Vui lòng thử lại!');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F6]">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 space-y-6">
        <div>
          <Link
            href="/gio-hang"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7D5C5C] hover:text-[#F9739B] transition-colors"
          >
            <ArrowLeft size={14} /> Quay lại giỏ hàng
          </Link>
          <h1 className="font-title text-2xl font-bold text-[#5A3A3A] mt-2">
            Thông tin đặt hàng
          </h1>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-[#FFE8EF] border border-[#F9739B]/30 text-xs font-bold text-[#E24C7C] flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Form input sections */}
          <div className="md:col-span-2 space-y-5">
            {/* 1. Customer Contact Details */}
            <div className="bg-white rounded-3xl border border-[#FFE8EF] p-5 space-y-4 shadow-xs">
              <h2 className="font-title text-base font-bold text-[#5A3A3A] flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-full bg-[#FFE8EF] text-[#E24C7C] text-xs flex items-center justify-center font-bold">1</span>
                Thông tin người nhận
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#7D5C5C]">
                    Họ và tên <span className="text-[#E24C7C]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs text-[#5A3A3A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#7D5C5C]">
                    Số điện thoại <span className="text-[#E24C7C]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0912345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs text-[#5A3A3A]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#7D5C5C]">
                  Email <span className="text-[#E24C7C]">*</span> (nhận thông báo mã đơn)
                </label>
                <input
                  type="email"
                  required
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs text-[#5A3A3A]"
                />
              </div>
            </div>

            {/* 2. Shipping Address (2 levels: Province -> Ward -> Street) */}
            <div className="bg-white rounded-3xl border border-[#FFE8EF] p-5 space-y-4 shadow-xs">
              <h2 className="font-title text-base font-bold text-[#5A3A3A] flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-full bg-[#FFE8EF] text-[#E24C7C] text-xs flex items-center justify-center font-bold">2</span>
                Địa chỉ giao hàng (Chuẩn SPX Express)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#7D5C5C]">
                    Tỉnh / Thành phố <span className="text-[#E24C7C]">*</span>
                  </label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs text-[#5A3A3A] bg-white"
                  >
                    {provinceList.map((p) => (
                      <option key={p} value={p}>
                        {p} {p.includes('Hồ Chí Minh') ? '(Phí ship 18k)' : '(Phí ship 22k)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#7D5C5C]">
                    Phường / Xã <span className="text-[#E24C7C]">*</span>
                  </label>
                  <select
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs text-[#5A3A3A] bg-white"
                  >
                    {wardList.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#7D5C5C]">
                  Số nhà, tên đường cụ thể <span className="text-[#E24C7C]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 38/32 Đường Số 2, Khu phố 1"
                  value={addressDetail}
                  onChange={(e) => setAddressDetail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs text-[#5A3A3A]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#7D5C5C]">
                  Ghi chú giao hàng (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Giao giờ hành chính, gọi trước khi giao..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs text-[#5A3A3A]"
                />
              </div>
            </div>

            {/* 3. Payment Method */}
            <div className="bg-white rounded-3xl border border-[#FFE8EF] p-5 space-y-4 shadow-xs">
              <h2 className="font-title text-base font-bold text-[#5A3A3A] flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-full bg-[#FFE8EF] text-[#E24C7C] text-xs flex items-center justify-center font-bold">3</span>
                Phương thức thanh toán
              </h2>

              {hasPreorder && (
                <div className="p-3 rounded-2xl bg-[#FFD76A]/20 border border-[#FFD76A]/40 text-xs text-[#856404] flex items-center gap-2">
                  <Clock size={15} />
                  <span>Đơn hàng có món <b>Pre-order</b>: chỉ áp dụng chuyển khoản QR trả trước.</span>
                </div>
              )}

              <div className="space-y-2.5">
                {/* COD option */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    paymentMethod === 'cod'
                      ? 'border-[#F9739B] bg-[#FFE8EF]/30'
                      : 'border-[#FFE8EF] bg-white hover:border-[#F9739B]/30'
                  } ${hasPreorder ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    disabled={hasPreorder}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 text-[#F9739B] focus:ring-[#F9739B]"
                  />
                  <div>
                    <span className="font-bold text-xs text-[#5A3A3A] flex items-center gap-1.5">
                      <Truck size={14} className="text-[#9ADFC8]" /> Thanh toán khi nhận hàng (COD)
                    </span>
                    <p className="text-[11px] text-[#7D5C5C] mt-0.5">
                      Nhận hàng tại nhà rồi mới trả tiền cho shipper SPX.
                    </p>
                  </div>
                </label>

                {/* Bank QR option */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    paymentMethod === 'bank_qr'
                      ? 'border-[#F9739B] bg-[#FFE8EF]/30'
                      : 'border-[#FFE8EF] bg-white hover:border-[#F9739B]/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank_qr"
                    checked={paymentMethod === 'bank_qr'}
                    onChange={() => setPaymentMethod('bank_qr')}
                    className="mt-1 text-[#F9739B] focus:ring-[#F9739B]"
                  />
                  <div>
                    <span className="font-bold text-xs text-[#5A3A3A] flex items-center gap-1.5">
                      <CreditCard size={14} className="text-[#F9739B]" /> Chuyển khoản qua mã VietQR (Techcombank)
                    </span>
                    <p className="text-[11px] text-[#7D5C5C] mt-0.5">
                      Quét mã QR bằng mọi app ngân hàng, mã đơn và số tiền tự động điền sẵn.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* 4. Survey Question (FR-C-27) */}
            <div className="bg-white rounded-3xl border border-[#FFE8EF] p-5 space-y-2 shadow-xs">
              <label className="text-xs font-bold text-[#7D5C5C]">
                Bạn biết tiệm chocomino từ đâu nè?
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs text-[#5A3A3A] bg-white"
              >
                <option value="TikTok">TikTok</option>
                <option value="Threads">Threads</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="Zalo">Zalo</option>
                <option value="BanBe">Bạn bè giới thiệu</option>
                <option value="Khac">Khác</option>
              </select>
            </div>
          </div>

          {/* Sticky Checkout Summary Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-[#FFE8EF] p-5 space-y-4 shadow-xs sticky top-20">
              <h3 className="font-title text-base font-bold text-[#5A3A3A]">Đơn hàng của bạn</h3>

              {/* Items summary */}
              <div className="divide-y divide-[#FFE8EF] max-h-56 overflow-y-auto space-y-2 pr-1">
                {cart.map((item) => (
                  <div key={item.variantId} className="pt-2 first:pt-0 flex justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#5A3A3A] line-clamp-1">{item.productName}</p>
                      <p className="text-[10px] text-[#A39A9A]">
                        {item.variantName} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-bold text-[#5A3A3A] shrink-0">
                      {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                ))}
              </div>

              {/* Financial Breakdown */}
              <div className="pt-3 border-t border-[#FFE8EF] space-y-2 text-xs">
                <div className="flex justify-between text-[#7D5C5C]">
                  <span>Tiền hàng:</span>
                  <span className="font-bold text-[#5A3A3A]">{subtotal.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-[#7D5C5C]">
                  <span>Phí ship SPX ({isHCM ? 'TP.HCM' : 'Ngoài TP.HCM'}):</span>
                  <span className="font-bold text-[#E24C7C]">{shippingFee.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              {/* Total */}
              <div className="pt-3 border-t border-[#FFE8EF] flex justify-between items-baseline">
                <span className="font-bold text-sm text-[#5A3A3A]">Tổng thanh toán:</span>
                <span className="font-title text-xl font-bold text-[#E24C7C]">
                  {total.toLocaleString('vi-VN')}đ
                </span>
              </div>

              {/* Policy Checkbox */}
              <label className="flex items-start gap-2 pt-2 text-[11px] text-[#7D5C5C] cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedPolicy}
                  onChange={(e) => setAgreedPolicy(e.target.checked)}
                  className="mt-0.5 text-[#F9739B] focus:ring-[#F9739B] rounded-sm"
                />
                <span>
                  Tôi đồng ý với <b>Chính sách đổi trả trong 3 ngày</b> (yêu cầu có video khui hàng) và <b>Chính sách bảo mật</b> của tiệm.
                </span>
              </label>

              {/* Place Order Button */}
              <button
                type="submit"
                disabled={isSubmitting || cart.length === 0}
                className="w-full py-3.5 px-4 rounded-full bg-[#F9739B] text-white font-title text-sm font-bold shadow-md hover:bg-[#E24C7C] transition-all disabled:bg-[#A39A9A] disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Đang xử lý đơn...</span>
                ) : (
                  <span>Xác nhận Đặt hàng</span>
                )}
              </button>

              <p className="text-[10px] text-center text-[#A39A9A]">
                Cam kết bảo mật thông tin & an toàn tuyệt đối
              </p>
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
