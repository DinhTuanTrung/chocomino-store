'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

function OrderLookupContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const [orderCode, setOrderCode] = useState(initialCode);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderResult, setOrderResult] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOrderResult(null);

    if (!orderCode.trim() || !phone.trim()) {
      setError('Vui lòng nhập cả Mã đơn hàng và Số điện thoại đặt hàng');
      return;
    }

    setLoading(true);

    try {
      // Fetch status (Mock or Supabase)
      await new Promise((r) => setTimeout(r, 600));

      // Mock display for preview
      setOrderResult({
        code: orderCode.toUpperCase(),
        customerName: 'Nguyễn Văn *',
        maskedPhone: `*******${phone.slice(-3)}`,
        maskedAddress: 'Phường Dĩ An, Thành phố Hồ Chí Minh',
        status: 'packing',
        statusText: 'Đang đóng gói',
        paymentMethod: 'Chuyển khoản VietQR',
        paymentStatus: 'Đã thanh toán',
        total: 63000,
        createdAt: new Date().toLocaleString('vi-VN'),
        trackingCode: 'SPXVN0392817281',
        history: [
          { status: 'Mới tạo', time: '10:15 - Hôm nay', note: 'Đơn hàng được tạo thành công' },
          { status: 'Đã thanh toán', time: '10:18 - Hôm nay', note: 'Xác nhận chuyển khoản VietQR' },
          { status: 'Đang đóng gói', time: '14:20 - Hôm nay', note: 'Shop đang chuẩn bị hàng gửi SPX' },
        ],
      });
    } catch (err) {
      setError('Không tìm thấy thông tin đơn hàng khớp với mã đơn và số điện thoại đã nhập.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl w-full mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="font-title text-2xl md:text-3xl font-bold text-[#5A3A3A]">
          Tra cứu đơn hàng 📦
        </h1>
        <p className="text-xs text-[#7D5C5C]">
          Nhập mã đơn hàng (ví dụ: CM7K2P9Q) và số điện thoại bạn đã dùng khi đặt hàng.
        </p>
      </div>

      {/* Search Box */}
      <form onSubmit={handleSearch} className="bg-white rounded-3xl border border-[#FFE8EF] p-6 space-y-4 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#7D5C5C]">Mã đơn hàng</label>
            <input
              type="text"
              required
              placeholder="CMxxxxxx"
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs text-[#5A3A3A] uppercase font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#7D5C5C]">Số điện thoại đặt hàng</label>
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

        {error && (
          <p className="text-xs font-bold text-[#E24C7C] flex items-center gap-1.5">
            <AlertCircle size={14} /> {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-full bg-[#F9739B] text-white font-title text-sm font-bold shadow-md hover:bg-[#E24C7C] transition-all disabled:bg-[#A39A9A] flex items-center justify-center gap-2"
        >
          {loading ? <span>Đang tìm kiếm...</span> : <><Search size={16} /> Tra cứu đơn</>}
        </button>
      </form>

      {/* Result Card */}
      {orderResult && (
        <div className="bg-white rounded-3xl border border-[#FFE8EF] p-6 space-y-5 shadow-xs animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#FFE8EF] pb-4">
            <div>
              <span className="text-[10px] text-[#A39A9A]">Mã đơn hàng</span>
              <p className="font-title text-xl font-extrabold text-[#F9739B]">{orderResult.code}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#A39A9A]">Trạng thái hiện tại</span>
              <span className="block font-bold text-xs text-[#E24C7C] bg-[#FFE8EF] px-3 py-1 rounded-full">
                {orderResult.statusText}
              </span>
            </div>
          </div>

          {/* Masked Info */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-[#FFF9F6] p-4 rounded-2xl border border-[#FFE8EF]">
            <div>
              <span className="text-[11px] text-[#A39A9A]">Người nhận:</span>
              <p className="font-bold text-[#5A3A3A]">{orderResult.customerName}</p>
            </div>
            <div>
              <span className="text-[11px] text-[#A39A9A]">Số điện thoại:</span>
              <p className="font-bold text-[#5A3A3A]">{orderResult.maskedPhone}</p>
            </div>
            <div className="col-span-2">
              <span className="text-[11px] text-[#A39A9A]">Khu vực giao:</span>
              <p className="font-bold text-[#5A3A3A]">{orderResult.maskedAddress}</p>
            </div>
            <div>
              <span className="text-[11px] text-[#A39A9A]">Hình thức:</span>
              <p className="font-bold text-[#5A3A3A]">{orderResult.paymentMethod}</p>
            </div>
            <div>
              <span className="text-[11px] text-[#A39A9A]">Tổng thanh toán:</span>
              <p className="font-bold text-[#E24C7C]">{orderResult.total.toLocaleString('vi-VN')}đ</p>
            </div>
          </div>

          {/* SPX Tracking */}
          {orderResult.trackingCode && (
            <div className="p-4 rounded-2xl bg-[#FFE8EF]/40 border border-[#F9739B]/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck size={18} className="text-[#F9739B]" />
                <div>
                  <p className="text-xs font-bold text-[#5A3A3A]">Mã vận đơn SPX Express</p>
                  <p className="font-mono text-xs text-[#E24C7C] font-bold">{orderResult.trackingCode}</p>
                </div>
              </div>
              <a
                href={`https://spx.vn/track?billcode=${orderResult.trackingCode}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-[#F9739B] hover:underline flex items-center gap-1"
              >
                Theo dõi trên SPX <ExternalLink size={12} />
              </a>
            </div>
          )}

          {/* Status Timeline */}
          <div className="space-y-3 pt-2">
            <h3 className="font-title text-sm font-bold text-[#5A3A3A]">Lịch trình đơn hàng</h3>
            <div className="space-y-3 pl-2 border-l-2 border-[#FFE8EF] ml-2">
              {orderResult.history.map((h: any, idx: number) => (
                <div key={idx} className="relative pl-4 space-y-0.5">
                  <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-[#F9739B] border-2 border-white" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#5A3A3A]">{h.status}</span>
                    <span className="text-[10px] text-[#A39A9A]">{h.time}</span>
                  </div>
                  <p className="text-[11px] text-[#7D5C5C]">{h.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderLookupPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F6]">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<div className="text-center py-20 text-xs">Đang tải trang tra cứu...</div>}>
          <OrderLookupContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
