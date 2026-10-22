'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { generateVietQRUrl } from '@/lib/sepay/vietqr';
import { createClient } from '@/lib/supabase/client';
import {
  CheckCircle2,
  Copy,
  Check,
  Clock,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  ExternalLink,
  Truck,
} from 'lucide-react';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || 'CM000000';
  const pmParam = searchParams.get('pm');

  const [order, setOrder] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(15 * 60); // 15 mins countdown
  const [bankConfig, setBankConfig] = useState<{
    bankName: string;
    bankAccount: string;
    accountHolder: string;
  }>({
    bankName: 'Techcombank',
    bankAccount: '',
    accountHolder: 'NGUYEN VAN TRUNG',
  });

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'bank_account')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          setBankConfig({
            bankName: data.value.bank_name || 'Techcombank',
            bankAccount: data.value.account_number || '',
            accountHolder: data.value.account_holder || 'NGUYEN VAN TRUNG',
          });
        }
      });
  }, []);

  useEffect(() => {
    // 1. Try reading last order from sessionStorage
    try {
      const stored = sessionStorage.getItem('last_chocomino_order');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.code === code) {
          setOrder(parsed);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Fallback fetch from Supabase if not in sessionStorage
    if (code && code !== 'CM000000') {
      const supabase = createClient();
      supabase
        .from('orders')
        .select('*')
        .eq('code', code)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setOrder({
              code: data.code,
              total: data.total,
              subtotal: data.subtotal,
              shippingFee: data.shipping_fee,
              paymentMethod: data.payment_method,
              paymentStatus: data.payment_status,
              customerName: data.customer_name,
              phone: data.phone,
              email: data.email,
              address: `${data.address_detail}, ${data.address_ward}, ${data.address_province}`,
              isPreorder: data.is_preorder,
            });
            if (data.expires_at) {
              const diffSec = Math.max(0, Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000));
              setTimeLeftSeconds(diffSec);
            }
          }
        });
    }
  }, [code]);

  // Polling check for payment status every 5 seconds (FR-C-42)
  useEffect(() => {
    const currentPaymentMethod = order?.paymentMethod || order?.payment_method || pmParam || 'cod';
    if (currentPaymentMethod !== 'bank_qr' || order?.paymentStatus === 'paid' || !code || code === 'CM000000') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('orders')
          .select('payment_status, status')
          .eq('code', code)
          .maybeSingle();

        if (data?.payment_status === 'paid') {
          setOrder((prev: any) => ({
            ...prev,
            paymentStatus: 'paid',
            status: data.status,
          }));
        }
      } catch (e) {
        // silent fallback
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [order?.paymentMethod, order?.payment_method, order?.paymentStatus, code, pmParam]);

  // 15-minute countdown timer (only for bank_qr)
  useEffect(() => {
    if (timeLeftSeconds <= 0) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeftSeconds]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const paymentMethod = order?.paymentMethod || order?.payment_method || pmParam || 'cod';
  const isBankQR = paymentMethod === 'bank_qr';
  const bankAccount = bankConfig.bankAccount || process.env.NEXT_PUBLIC_SEPAY_ACCOUNT_NUMBER || '19030000000000';
  const bankName = bankConfig.bankName || process.env.NEXT_PUBLIC_SEPAY_BANK_NAME || 'Techcombank';
  const accountHolder = bankConfig.accountHolder || process.env.NEXT_PUBLIC_SEPAY_ACCOUNT_HOLDER || 'NGUYEN VAN TRUNG';
  const totalAmount = order?.total || 63000;

  const qrImageUrl = generateVietQRUrl({
    bankName,
    accountNumber: bankAccount,
    amount: totalAmount,
    orderCode: code,
    accountHolder,
  });

  return (
    <div className="max-w-2xl w-full mx-auto px-4 py-8 space-y-6">
      {/* Success Badge */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-[#FFE8EF] text-[#E24C7C] mx-auto flex items-center justify-center shadow-xs">
          <CheckCircle2 size={36} />
        </div>
        <h1 className="font-title text-2xl md:text-3xl font-extrabold text-[#5A3A3A]">
          Đặt hàng thành công! 🎉
        </h1>
        <p className="text-xs text-[#7D5C5C]">
          Cảm ơn bạn đã ủng hộ tiệm chocomino. Mã đơn hàng của bạn là:
        </p>
        <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-[#FFE8EF] shadow-xs">
          <span className="font-title text-xl font-extrabold text-[#F9739B] tracking-wider">
            {code}
          </span>
          <button
            onClick={() => copyToClipboard(code, 'code')}
            className="p-1 text-[#A39A9A] hover:text-[#5A3A3A] transition-colors"
            title="Sao chép mã đơn"
          >
            {copiedField === 'code' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* QR Bank Transfer Section (Only for Bank QR payment) */}
      {isBankQR ? (
        order?.paymentStatus === 'paid' ? (
          <div className="bg-green-50 border border-green-200 rounded-3xl p-6 text-center space-y-3 animate-fadeIn shadow-xs">
            <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 mx-auto flex items-center justify-center">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="font-title text-lg font-bold text-green-900">
              Đã nhận thanh toán thành công! 🍫
            </h2>
            <p className="text-xs text-green-700 max-w-md mx-auto">
              Tiệm chocomino đã nhận được khoản thanh toán <b>{totalAmount.toLocaleString('vi-VN')}đ</b> cho đơn hàng <b>#{code}</b>. Đơn hàng đang được tiệm chuẩn bị và sớm giao cho bưu tá SPX Express.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#FFE8EF] p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#FFE8EF] pb-4">
              <div>
                <h2 className="font-title text-base font-bold text-[#5A3A3A]">
                  Quét mã VietQR chuyển khoản
                </h2>
                <p className="text-[11px] text-[#7D5C5C]">
                  Tự động điền đúng số tiền và nội dung chuyển khoản
                </p>
              </div>
              {/* Countdown Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFE8EF] text-[#E24C7C] text-xs font-bold">
                <Clock size={14} />
                <span>{formattedTime}</span>
              </div>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* QR Code Image */}
            <div className="flex flex-col items-center space-y-2 bg-[#FFF9F6] p-4 rounded-2xl border border-[#FFE8EF]">
              <div className="relative w-48 h-48 rounded-xl overflow-hidden bg-white p-2 shadow-xs">
                <Image
                  src={qrImageUrl}
                  alt={`VietQR thanh toán đơn hàng ${code}`}
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
              <span className="text-[10px] text-[#A39A9A]">Mở app ngân hàng bất kỳ để quét</span>
            </div>

            {/* Transfer Details with Copy Buttons */}
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] text-[#A39A9A]">Ngân hàng:</span>
                <p className="font-bold text-[#5A3A3A]">{bankName}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-[#A39A9A]">Số tài khoản:</span>
                <div className="flex items-center justify-between bg-[#FFF9F6] px-3 py-2 rounded-xl border border-[#FFE8EF]">
                  <span className="font-bold text-[#5A3A3A] font-mono">{bankAccount}</span>
                  <button
                    onClick={() => copyToClipboard(bankAccount, 'acc')}
                    className="text-[#E24C7C] font-bold text-[11px] flex items-center gap-1"
                  >
                    {copiedField === 'acc' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedField === 'acc' ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-[#A39A9A]">Số tiền:</span>
                <div className="flex items-center justify-between bg-[#FFF9F6] px-3 py-2 rounded-xl border border-[#FFE8EF]">
                  <span className="font-bold text-[#E24C7C] font-mono">
                    {totalAmount.toLocaleString('vi-VN')}đ
                  </span>
                  <button
                    onClick={() => copyToClipboard(String(totalAmount), 'amount')}
                    className="text-[#E24C7C] font-bold text-[11px] flex items-center gap-1"
                  >
                    {copiedField === 'amount' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedField === 'amount' ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-[#A39A9A]">Nội dung chuyển khoản (bắt buộc):</span>
                <div className="flex items-center justify-between bg-[#FFE8EF] px-3 py-2 rounded-xl border border-[#F9739B]/30">
                  <span className="font-extrabold text-[#F9739B] font-mono text-sm">{code}</span>
                  <button
                    onClick={() => copyToClipboard(code, 'msg')}
                    className="text-[#E24C7C] font-bold text-[11px] flex items-center gap-1"
                  >
                    {copiedField === 'msg' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedField === 'msg' ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        )
      ) : (
        /* COD Cash on Delivery Information Section */
        <div className="bg-white rounded-3xl border border-[#FFE8EF] p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-3 border-b border-[#FFE8EF] pb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
              <Truck size={24} />
            </div>
            <div>
              <h2 className="font-title text-base font-bold text-[#5A3A3A]">
                Thanh toán khi nhận hàng (COD)
              </h2>
              <p className="text-[11px] text-[#7D5C5C]">
                Bạn chỉ cần thanh toán tiền mặt cho nhân viên giao hàng SPX Express khi nhận gói hàng
              </p>
            </div>
          </div>

          <div className="bg-[#FFF9F6] p-4 rounded-2xl border border-[#FFE8EF] space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-[#FFE8EF]">
              <span className="text-[#7D5C5C]">Số tiền cần thanh toán cho shipper:</span>
              <span className="font-title text-lg font-extrabold text-[#E24C7C]">
                {totalAmount.toLocaleString('vi-VN')}đ
              </span>
            </div>

            <div className="space-y-1.5 pt-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#A39A9A]">Người nhận:</span>
                <span className="font-bold text-[#5A3A3A]">{order?.customerName || 'Khách hàng'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A39A9A]">Số điện thoại:</span>
                <span className="font-bold text-[#5A3A3A]">{order?.phone || 'Chưa cập nhật'}</span>
              </div>
              {order?.address && (
                <div className="flex justify-between gap-4">
                  <span className="text-[#A39A9A] shrink-0">Địa chỉ giao:</span>
                  <span className="font-medium text-[#5A3A3A] text-right">{order.address}</span>
                </div>
              )}
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1 text-[11px]">
              <p className="font-bold flex items-center gap-1.5 text-amber-800">
                <ShieldCheck size={14} className="text-amber-600 shrink-0" /> Hướng dẫn nhận hàng thuận tiện:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[10px] text-amber-900/90 pl-1">
                <li>Shipper SPX Express sẽ gọi điện trước khi phát hàng. Vui lòng chú ý điện thoại.</li>
                <li>Chuẩn bị sẵn đúng số tiền <b>{totalAmount.toLocaleString('vi-VN')}đ</b> để thanh toán nhanh chóng.</li>
                <li>Nhớ quay video mở hộp (unboxing) khi nhận hàng để được bảo vệ quyền lợi đổi trả trong 3 ngày.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Lookup Order Link */}
      <div className="p-5 rounded-3xl bg-white border border-[#FFE8EF] flex items-center justify-between gap-4 shadow-xs">
        <div>
          <h3 className="font-bold text-xs text-[#5A3A3A]">Theo dõi hành trình đơn hàng</h3>
          <p className="text-[11px] text-[#7D5C5C]">
            Bạn có thể kiểm tra trạng thái đơn bất kỳ lúc nào bằng mã đơn và số điện thoại.
          </p>
        </div>
        <Link
          href={`/tra-cuu?code=${code}`}
          className="inline-flex items-center gap-1 px-4 py-2.5 rounded-full bg-[#FFE8EF] text-[#E24C7C] font-bold text-xs hover:bg-[#F9739B] hover:text-white transition-all shrink-0"
        >
          Tra cứu <ExternalLink size={13} />
        </Link>
      </div>

      {/* Return to Home */}
      <div className="text-center pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#7D5C5C] hover:text-[#F9739B] transition-colors"
        >
          <ShoppingBag size={14} /> Tiếp tục mua sắm các mẫu squishy khác
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F6]">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<div className="text-center py-20 text-xs">Đang tải thông tin đơn hàng...</div>}>
          <OrderSuccessContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
