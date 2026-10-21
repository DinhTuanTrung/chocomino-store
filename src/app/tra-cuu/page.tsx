'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import {
  Search,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Video,
  X,
} from 'lucide-react';

function OrderLookupContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const [orderCode, setOrderCode] = useState(initialCode);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderResult, setOrderResult] = useState<any>(null);

  // Return Request Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('Hàng bị lỗi sản xuất');
  const [returnDescription, setReturnDescription] = useState('');
  const [unboxingVideoUrl, setUnboxingVideoUrl] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnSuccessMsg, setReturnSuccessMsg] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOrderResult(null);
    setReturnSuccessMsg('');

    if (!orderCode.trim() || !phone.trim()) {
      setError('Vui lòng nhập cả Mã đơn hàng và Số điện thoại đặt hàng');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const codeClean = orderCode.trim().toUpperCase();
      const phoneClean = phone.trim().replace(/^\+84/, '0');

      const { data: dbOrder, error: dbErr } = await supabase
        .from('orders')
        .select('*, items:order_items(*), return:return_requests(*), shipment:shipments(*)')
        .eq('code', codeClean)
        .single();

      if (dbErr || !dbOrder) {
        setError('Không tìm thấy thông tin đơn hàng khớp với mã đơn và số điện thoại đã nhập.');
        setLoading(false);
        return;
      }

      // Verify phone match (last 9 digits)
      const orderPhoneClean = dbOrder.phone.trim().replace(/^\+84/, '0');
      if (!orderPhoneClean.endsWith(phoneClean.slice(-9))) {
        setError('Không tìm thấy thông tin đơn hàng khớp với mã đơn và số điện thoại đã nhập.');
        setLoading(false);
        return;
      }

      // Calculate 3-day return eligibility
      const isCompleted = dbOrder.status === 'completed';
      const completedTime = new Date(dbOrder.updated_at).getTime();
      const isWithin3Days = Date.now() - completedTime <= 3 * 24 * 60 * 60 * 1000;
      const hasExistingReturn = dbOrder.return && dbOrder.return.length > 0;

      setOrderResult({
        ...dbOrder,
        isEligibleForReturn: isCompleted && isWithin3Days && !hasExistingReturn,
        returnDetails: hasExistingReturn ? dbOrder.return[0] : null,
        trackingCode: dbOrder.shipment?.[0]?.tracking_code || null,
      });
    } catch (err) {
      setError('Đã có lỗi xảy ra trong quá trình tra cứu. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unboxingVideoUrl.trim()) {
      alert('Video khui hàng là bắt buộc theo chính sách đổi trả của shop');
      return;
    }

    setSubmittingReturn(true);
    try {
      const res = await fetch('/api/orders/return-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderCode: orderResult.code,
          phone,
          customerReason: returnReason,
          customerDescription: returnDescription,
          videoUrl: unboxingVideoUrl.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || 'Không thể gửi yêu cầu đổi trả');
        return;
      }

      setReturnSuccessMsg('Yêu cầu đổi trả đã được gửi thành công! Shop sẽ kiểm tra video và phản hồi sớm.');
      setShowReturnModal(false);
      setOrderResult((prev: any) => ({
        ...prev,
        status: 'return_requested',
        isEligibleForReturn: false,
        returnDetails: {
          customer_reason: returnReason,
          status: 'pending',
          video_url: unboxingVideoUrl,
        },
      }));
    } catch (e) {
      alert('Lỗi kết nối khi gửi yêu cầu');
    } finally {
      setSubmittingReturn(false);
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

      {returnSuccessMsg && (
        <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-xs font-bold text-green-800 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-green-600" />
          <span>{returnSuccessMsg}</span>
        </div>
      )}

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
              <span className="text-[10px] text-[#A39A9A]">Trạng thái</span>
              <span className="block font-bold text-xs text-[#E24C7C] bg-[#FFE8EF] px-3 py-1 rounded-full capitalize">
                {orderResult.status === 'completed'
                  ? 'Hoàn thành'
                  : orderResult.status === 'packing'
                  ? 'Đang đóng gói'
                  : orderResult.status === 'shipping'
                  ? 'Đang giao'
                  : orderResult.status === 'return_requested'
                  ? 'Chờ duyệt đổi trả'
                  : orderResult.status === 'return_approved'
                  ? 'Đã duyệt đổi trả'
                  : orderResult.status === 'return_rejected'
                  ? 'Từ chối đổi trả'
                  : 'Mới tạo'}
              </span>
            </div>
          </div>

          {/* Masked Info */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-[#FFF9F6] p-4 rounded-2xl border border-[#FFE8EF]">
            <div>
              <span className="text-[11px] text-[#A39A9A]">Người nhận:</span>
              <p className="font-bold text-[#5A3A3A]">{orderResult.customer_name}</p>
            </div>
            <div>
              <span className="text-[11px] text-[#A39A9A]">Số điện thoại:</span>
              <p className="font-bold text-[#5A3A3A]">*******{orderResult.phone.slice(-3)}</p>
            </div>
            <div className="col-span-2">
              <span className="text-[11px] text-[#A39A9A]">Khu vực giao:</span>
              <p className="font-bold text-[#5A3A3A]">{orderResult.address_ward}, {orderResult.address_province}</p>
            </div>
            <div>
              <span className="text-[11px] text-[#A39A9A]">Hình thức:</span>
              <p className="font-bold text-[#5A3A3A]">
                {orderResult.payment_method === 'cod' ? 'COD (Thu khi nhận)' : 'Chuyển khoản VietQR'}
              </p>
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
                Theo dõi SPX <ExternalLink size={12} />
              </a>
            </div>
          )}

          {/* Return Status Feedback if requested */}
          {orderResult.returnDetails && (
            <div className="p-4 rounded-2xl bg-[#FFF9F6] border border-[#FFE8EF] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#5A3A3A] flex items-center gap-1.5">
                  <ShieldAlert size={15} className="text-[#F9739B]" /> Yêu cầu đổi trả của bạn:
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {orderResult.returnDetails.status === 'approved'
                    ? 'Đã duyệt'
                    : orderResult.returnDetails.status === 'rejected'
                    ? 'Từ chối'
                    : 'Đang xem xét'}
                </span>
              </div>
              <p className="text-[11px] text-[#7D5C5C]">
                Lý do của bạn: <b>{orderResult.returnDetails.customer_reason}</b>
              </p>
              {orderResult.returnDetails.shop_note && (
                <div className="p-2 rounded-xl bg-white border border-[#FFE8EF] text-[11px]">
                  <span className="font-bold text-[#E24C7C]">Phản hồi từ shop: </span>
                  <span>{orderResult.returnDetails.shop_note}</span>
                </div>
              )}
            </div>
          )}

          {/* Return Request Button (Eligible within 3 days of completion) */}
          {orderResult.isEligibleForReturn && (
            <div className="pt-2 border-t border-[#FFE8EF] flex items-center justify-between">
              <div>
                <p className="font-bold text-xs text-[#5A3A3A]">Hàng có vấn đề gì không?</p>
                <p className="text-[10px] text-[#7D5C5C]">
                  Đơn hàng trong thời hạn 3 ngày được hỗ trợ đổi trả nếu có video khui hàng.
                </p>
              </div>
              <button
                onClick={() => setShowReturnModal(true)}
                className="px-4 py-2 rounded-full bg-[#FFE8EF] text-[#E24C7C] font-bold text-xs hover:bg-[#F9739B] hover:text-white transition-all shadow-xs"
              >
                Yêu cầu Đổi / Hoàn hàng
              </button>
            </div>
          )}
        </div>
      )}

      {/* Return Request Modal */}
      {showReturnModal && orderResult && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-[#FFE8EF] animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#FFE8EF] pb-3">
              <h3 className="font-title text-base font-bold text-[#5A3A3A] flex items-center gap-1.5">
                <RefreshCw size={16} className="text-[#F9739B]" /> Yêu cầu Đổi trả đơn {orderResult.code}
              </h3>
              <button
                onClick={() => setShowReturnModal(false)}
                className="p-1 rounded-full text-[#A39A9A] hover:text-[#5A3A3A]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#7D5C5C]">Lý do đổi trả (*)</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none bg-white font-medium"
                >
                  <option value="Hàng bị lỗi sản xuất">Hàng bị lỗi sản xuất (rách, bẹp, lem màu)</option>
                  <option value="Giao sai mẫu mã/màu sắc">Giao sai mẫu mã / sai số lượng</option>
                  <option value="Hư hỏng trong quá trình vận chuyển">Hư hỏng do bưu tá vận chuyển</option>
                  <option value="Lý do khác">Lý do khác</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#7D5C5C]">Mô tả chi tiết lỗi gặp phải</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả cụ thể để shop hỗ trợ nhanh hơn..."
                  value={returnDescription}
                  onChange={(e) => setReturnDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs"
                />
              </div>

              <div className="space-y-1 bg-[#FFE8EF]/40 p-3 rounded-2xl border border-[#F9739B]/30">
                <label className="font-bold text-[#E24C7C] flex items-center gap-1">
                  <Video size={14} /> Link Video khui hàng (Bắt buộc theo D14) (*)
                </label>
                <input
                  type="url"
                  required
                  placeholder="Dán link Google Drive, YouTube, TikTok hoặc Cloud..."
                  value={unboxingVideoUrl}
                  onChange={(e) => setUnboxingVideoUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs bg-white"
                />
                <p className="text-[10px] text-[#7D5C5C] mt-1 leading-relaxed">
                  Video quay liên tục từ lúc mở kiện hàng niêm phong của SPX. Nếu đúng lỗi từ xưởng/tiệm, <b>chocomino chịu 100% chi phí vận chuyển đổi trả</b>.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 rounded-xl font-bold text-[#7D5C5C] hover:bg-[#FFE8EF]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="px-5 py-2.5 rounded-full bg-[#F9739B] text-white font-title font-bold hover:bg-[#E24C7C] transition-all disabled:bg-[#A39A9A]"
                >
                  {submittingReturn ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </button>
              </div>
            </form>
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
