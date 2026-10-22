'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminNav } from '@/components/AdminNav';
import { createClient } from '@/lib/supabase/client';
import type { Order, OrderItem, OrderStatus, ReturnRequest } from '@/types/database';
import {
  FileSpreadsheet,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Printer,
  Search,
  Filter,
  RefreshCw,
  Eye,
  X,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Check,
  Ban,
  Download,
} from 'lucide-react';

interface OrderWithDetails extends Order {
  items: OrderItem[];
  returns?: ReturnRequest[];
  shipment_code?: string | null;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);

  // Selected Order for Modal View
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);

  // Action status state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isProcessingPreorders, setIsProcessingPreorders] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');
  const [showShippingModal, setShowShippingModal] = useState(false);

  // Return resolution state
  const [returnShopNote, setReturnShopNote] = useState('');
  const [isResolvingReturn, setIsResolvingReturn] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*), returns:return_requests(*)')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setOrders(data as OrderWithDetails[]);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Lỗi khi nạp danh sách đơn hàng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus, trackingCode?: string) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nextStatus,
          trackingCode,
          reason: `Admin cập nhật trạng thái sang ${nextStatus}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || 'Không thể đổi trạng thái đơn');
        return;
      }

      // Update state locally
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }
      setShowShippingModal(false);
      setTrackingInput('');
    } catch (err) {
      alert('Lỗi kết nối khi cập nhật trạng thái');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleBatchPreorderArrived = async () => {
    const pendingPreorders = orders.filter(
      (o) => o.is_preorder && o.status === 'new'
    );

    if (pendingPreorders.length === 0) {
      alert('Không có đơn hàng Pre-order nào đang chờ hàng về!');
      return;
    }

    const confirmed = confirm(
      `Xác nhận hàng Pre-order đã về kho?\n\nHệ thống sẽ chuyển đồng loạt ${pendingPreorders.length} đơn hàng sang trạng thái "Đã xác nhận" để sẵn sàng in phiếu & đóng gói giao SPX.`
    );
    if (!confirmed) return;

    setIsProcessingPreorders(true);
    try {
      for (const ord of pendingPreorders) {
        await fetch(`/api/admin/orders/${ord.id}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nextStatus: 'confirmed',
            reason: 'Hàng Pre-order đã về kho (Xử lý hàng loạt FR-A-18)',
          }),
        });
      }
      alert(`Đã chuyển thành công ${pendingPreorders.length} đơn Pre-order sang "Đã xác nhận"!`);
      await fetchOrders();
    } catch (err) {
      alert('Đã có lỗi trong quá trình cập nhật trạng thái hàng loạt');
    } finally {
      setIsProcessingPreorders(false);
    }
  };

  const handleResolveReturn = async (
    returnRequestId: string,
    resolution: 'approved' | 'rejected' | 'refunded'
  ) => {
    if (!returnShopNote.trim()) {
      alert('Vui lòng nhập ghi chú phản hồi của shop trước khi xử lý!');
      return;
    }

    setIsResolvingReturn(true);
    try {
      const res = await fetch(`/api/admin/returns/${returnRequestId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution,
          shopNote: returnShopNote.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || 'Không thể xử lý yêu cầu đổi trả');
        return;
      }

      alert('Đã cập nhật trạng thái yêu cầu đổi trả thành công!');
      setReturnShopNote('');
      // Reload orders to get fresh status and relations
      await fetchOrders();

      if (selectedOrder) {
        const nextStatus: OrderStatus =
          resolution === 'approved'
            ? 'return_approved'
            : resolution === 'rejected'
            ? 'return_rejected'
            : 'refunded';
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                status: nextStatus,
                returns: prev.returns?.map((r) =>
                  r.id === returnRequestId
                    ? {
                        ...r,
                        status:
                          resolution === 'approved'
                            ? 'approved'
                            : resolution === 'rejected'
                            ? 'rejected'
                            : 'resolved',
                        shop_note: returnShopNote.trim(),
                        resolution,
                        resolved_at: new Date().toISOString(),
                      }
                    : r
                ),
              }
            : null
        );
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setIsResolvingReturn(false);
    }
  };

  const handleExportSPX = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/spx-export', {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Xuất file thất bại');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SPX_DonHang_Chocomino_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Không thể tạo file Excel SPX. Vui lòng kiểm tra lại!');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = () => {
    if (!orders || orders.length === 0) {
      alert('Chưa có dữ liệu đơn hàng để xuất CSV!');
      return;
    }

    const headers = [
      'Mã đơn',
      'Khách hàng',
      'Số điện thoại',
      'Email',
      'Tỉnh/Thành',
      'Phường/Xã',
      'Địa chỉ chi tiết',
      'Tạm tính',
      'Phí ship',
      'Tổng tiền',
      'Phương thức TT',
      'Tình trạng TT',
      'Trạng thái đơn',
      'Nguồn traffic',
      'Ghi chú',
      'Mã vận đơn SPX',
      'Ngày đặt',
    ];

    const rows = orders.map((o) => [
      `"${o.code || ''}"`,
      `"${(o.customer_name || '').replace(/"/g, '""')}"`,
      `"${o.phone || ''}"`,
      `"${o.email || ''}"`,
      `"${(o.address_province || '').replace(/"/g, '""')}"`,
      `"${(o.address_ward || '').replace(/"/g, '""')}"`,
      `"${(o.address_detail || '').replace(/"/g, '""')}"`,
      o.subtotal || 0,
      o.shipping_fee || 0,
      o.total || 0,
      `"${o.payment_method === 'cod' ? 'COD' : 'VietQR'}"`,
      `"${o.payment_status || ''}"`,
      `"${o.status || ''}"`,
      `"${o.source || 'direct'}"`,
      `"${(o.note || '').replace(/"/g, '""')}"`,
      `"${o.shipment_code || ''}"`,
      `"${new Date(o.created_at).toLocaleString('vi-VN')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Chocomino_DanhSachDonHang_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'returns') {
      const isReturn =
        o.status === 'return_requested' ||
        o.status === 'return_approved' ||
        o.status === 'return_rejected' ||
        o.status === 'returned' ||
        o.status === 'refunded' ||
        (o.returns && o.returns.length > 0);
      if (!isReturn) return false;
    } else if (filterStatus === 'preorder') {
      if (!o.is_preorder) return false;
    } else if (filterStatus !== 'all' && o.status !== filterStatus) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = o.code.toLowerCase().includes(q);
      const matchName = o.customer_name.toLowerCase().includes(q);
      const matchPhone = o.phone.includes(q);
      if (!matchCode && !matchName && !matchPhone) return false;
    }
    return true;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Đơn mới</span>;
      case 'confirmed':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">Đã xác nhận</span>;
      case 'packing':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Đang đóng gói</span>;
      case 'shipping':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">Đang giao</span>;
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">Hoàn thành</span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-700">Đã hủy</span>;
      case 'return_requested':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">⚠️ Yêu cầu đổi trả</span>;
      case 'return_approved':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">✓ Đã duyệt trả hàng</span>;
      case 'return_rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-800">✕ Từ chối đổi trả</span>;
      case 'returned':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white">📦 Đã nhận hàng trả</span>;
      case 'refunded':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">💰 Đã hoàn tiền</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F6] text-[#5A3A3A]">
      <AdminNav />

      <main className="max-w-6xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-title text-2xl md:text-3xl font-extrabold text-[#5A3A3A]">
              Quản lý Đơn hàng Chocomino 📦
            </h1>
            <p className="text-xs text-[#7D5C5C]">
              Xác nhận đơn, chuyển trạng thái 1 chạm, xử lý đổi trả 3 ngày, in phiếu giao hàng và xuất file Excel mẫu SPX.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-white border border-[#FFE8EF] hover:border-[#F9739B] text-xs font-bold text-[#5A3A3A] transition-all shadow-xs"
              title="Tải lại đơn hàng"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-white border border-[#FFE8EF] hover:border-[#F9739B] text-xs font-bold text-[#5A3A3A] transition-all shadow-xs"
              title="Xuất danh sách đơn ra file CSV mở bằng Excel tiếng Việt"
            >
              <Download size={14} className="text-[#E24C7C]" />
              <span>Xuất CSV</span>
            </button>

            <button
              onClick={handleExportSPX}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E24C7C] text-white font-title text-xs font-bold shadow-md hover:bg-[#F9739B] transition-all disabled:bg-[#A39A9A]"
            >
              <FileSpreadsheet size={16} />
              {exporting ? 'Đang xuất...' : 'Xuất Excel SPX'}
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-3xl border border-[#FFE8EF] p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Tìm theo mã đơn, tên khách, SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FFF9F6] border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs text-[#5A3A3A]"
            />
            <Search size={15} className="absolute left-3 top-2.5 text-[#A39A9A]" />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto text-xs font-bold">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'new', label: 'Đơn mới' },
              { id: 'preorder', label: '⏳ Chờ hàng về' },
              { id: 'confirmed', label: 'Xác nhận' },
              { id: 'packing', label: 'Đóng gói' },
              { id: 'shipping', label: 'Đang giao' },
              { id: 'completed', label: 'Hoàn thành' },
              { id: 'returns', label: 'Đổi trả' },
              { id: 'cancelled', label: 'Đã hủy' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                  filterStatus === tab.id
                    ? 'bg-[#5A3A3A] text-white'
                    : 'bg-[#FFF9F6] text-[#7D5C5C] hover:bg-[#FFE8EF]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pre-order Batch Action Banner (FR-A-18) */}
        {filterStatus === 'preorder' && (
          <div className="bg-[#FFF9F6] border border-[#FFD76A] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFD76A]/40 text-[#856404] flex items-center justify-center font-bold shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <p className="font-bold text-xs text-[#5A3A3A]">
                  Quản lý đơn đặt trước (Pre-order - FR-A-18)
                </p>
                <p className="text-[11px] text-[#7D5C5C]">
                  Có {orders.filter((o) => o.is_preorder && o.status === 'new').length} đơn Pre-order đang chờ hàng về kho. Khi hàng cập bến, bấm nút bên phải để kích hoạt chuyển đồng loạt sang xác nhận đóng gói.
                </p>
              </div>
            </div>
            <button
              onClick={handleBatchPreorderArrived}
              disabled={isProcessingPreorders || orders.filter((o) => o.is_preorder && o.status === 'new').length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FFD76A] to-[#F9739B] text-[#5A3A3A] font-bold text-xs shadow-sm hover:opacity-95 disabled:opacity-50 transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              <Package size={14} />
              <span>{isProcessingPreorders ? 'Đang cập nhật...' : 'Hàng đã về: Xác nhận hàng loạt'}</span>
            </button>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white rounded-3xl border border-[#FFE8EF] overflow-hidden shadow-xs">
          {loading ? (
            <div className="text-center py-20 text-xs text-[#7D5C5C]">
              Đang tải danh sách đơn hàng từ Supabase...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 p-6 text-xs text-[#7D5C5C]">
              Không có đơn hàng nào phù hợp với bộ lọc.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF9F6] border-b border-[#FFE8EF] text-[#7D5C5C] uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Mã đơn</th>
                    <th className="p-4">Khách hàng</th>
                    <th className="p-4">Khu vực</th>
                    <th className="p-4">Thanh toán</th>
                    <th className="p-4">Tổng tiền</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FFE8EF]">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#FFF9F6]/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-[#F9739B]">
                        {ord.code}
                      </td>
                      <td className="p-4 space-y-0.5">
                        <p className="font-bold text-[#5A3A3A]">{ord.customer_name}</p>
                        <p className="text-[11px] text-[#A39A9A]">{ord.phone}</p>
                      </td>
                      <td className="p-4 text-[11px] text-[#7D5C5C]">
                        {ord.address_ward}, {ord.address_province}
                      </td>
                      <td className="p-4">
                        <span className="block font-bold">
                          {ord.payment_method === 'cod' ? 'COD' : 'VietQR'}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            ord.payment_status === 'paid' ? 'text-green-600' : 'text-amber-600'
                          }`}
                        >
                          {ord.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa trả'}
                        </span>
                      </td>
                      <td className="p-4 font-title font-bold text-[#E24C7C]">
                        {ord.total.toLocaleString('vi-VN')}đ
                      </td>
                      <td className="p-4">
                        {getStatusBadge(ord.status)}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="p-1.5 rounded-lg bg-[#FFF9F6] hover:bg-[#FFE8EF] text-[#5A3A3A] transition-colors"
                            title="Xem chi tiết đơn"
                          >
                            <Eye size={15} />
                          </button>
                          <Link
                            href={`/admin/orders/${ord.id}/in-phieu`}
                            className="p-1.5 rounded-lg bg-[#FFF9F6] hover:bg-[#FFE8EF] text-[#5A3A3A] transition-colors"
                            title="In phiếu gửi SPX"
                            target="_blank"
                          >
                            <Printer size={15} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-[#FFE8EF] max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#FFE8EF]">
              <div>
                <h3 className="font-title text-lg font-bold text-[#5A3A3A] flex items-center gap-2">
                  Đơn hàng #{selectedOrder.code}
                  {getStatusBadge(selectedOrder.status)}
                </h3>
                <p className="text-xs text-[#7D5C5C]">
                  Ngày tạo: {new Date(selectedOrder.created_at).toLocaleString('vi-VN')}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-full hover:bg-[#FFF9F6] text-[#A39A9A]"
              >
                <X size={18} />
              </button>
            </div>

            {/* RETURN REQUEST SECTION IF ANY */}
            {selectedOrder.returns && selectedOrder.returns.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <RotateCcw size={16} className="text-amber-600" />
                    <span>Yêu cầu đổi trả hàng (Chính sách 3 ngày)</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 uppercase">
                    {selectedOrder.returns[0].status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-[#5A3A3A] bg-white/70 p-3 rounded-xl border border-amber-200">
                  <p>
                    <span className="text-[#7D5C5C] font-semibold">Lý do đổi trả:</span>{' '}
                    <span className="font-bold text-amber-900">{selectedOrder.returns[0].customer_reason}</span>
                  </p>
                  {selectedOrder.returns[0].customer_description && (
                    <p>
                      <span className="text-[#7D5C5C] font-semibold">Mô tả của khách:</span>{' '}
                      {selectedOrder.returns[0].customer_description}
                    </p>
                  )}
                  {selectedOrder.returns[0].video_url && (
                    <div className="pt-1 flex items-center gap-2">
                      <span className="text-[#7D5C5C] font-semibold">Video mở hộp bắt buộc:</span>
                      <a
                        href={selectedOrder.returns[0].video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                      >
                        Xem video bằng chứng <ExternalLink size={13} />
                      </a>
                    </div>
                  )}
                  {selectedOrder.returns[0].shop_note && (
                    <div className="pt-2 border-t border-amber-100 text-[11px]">
                      <span className="text-[#7D5C5C] font-semibold">Phản hồi của shop:</span>{' '}
                      <span className="font-bold text-[#5A3A3A]">{selectedOrder.returns[0].shop_note}</span>
                      {selectedOrder.returns[0].resolved_at && (
                        <span className="text-[10px] text-gray-500 block">
                          (Đã xử lý lúc {new Date(selectedOrder.returns[0].resolved_at).toLocaleString('vi-VN')})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Return Actions for Admin */}
                {selectedOrder.returns[0].status === 'pending' && (
                  <div className="space-y-2 pt-2 border-t border-amber-200">
                    <label className="text-[11px] font-bold text-amber-900 block">
                      Ghi chú phản hồi của shop (bắt buộc theo D2/SRS):
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập lý do duyệt/từ chối hoặc hướng dẫn khách gửi hàng..."
                      value={returnShopNote}
                      onChange={(e) => setReturnShopNote(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 focus:outline-none focus:border-amber-500 bg-white"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResolveReturn(selectedOrder.returns![0].id, 'approved')}
                        disabled={isResolvingReturn}
                        className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Check size={14} /> Duyệt cho phép trả hàng
                      </button>
                      <button
                        onClick={() => handleResolveReturn(selectedOrder.returns![0].id, 'rejected')}
                        disabled={isResolvingReturn}
                        className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Ban size={14} /> Từ chối
                      </button>
                    </div>
                  </div>
                )}

                {selectedOrder.returns[0].status === 'approved' && (
                  <div className="space-y-2 pt-2 border-t border-amber-200">
                    <label className="text-[11px] font-bold text-amber-900 block">
                      Xác nhận đã nhận hàng hoàn trả & hoàn tất hoàn tiền:
                    </label>
                    <input
                      type="text"
                      placeholder="Ghi chú xác nhận (vd: Đã nhận bưu phẩm hoàn, đã ck lại qua STK...)"
                      value={returnShopNote}
                      onChange={(e) => setReturnShopNote(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 focus:outline-none focus:border-amber-500 bg-white"
                    />
                    <button
                      onClick={() => handleResolveReturn(selectedOrder.returns![0].id, 'refunded')}
                      disabled={isResolvingReturn}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 size={14} /> Xác nhận đã nhận hàng & Hoàn tất hoàn tiền
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Customer & Shipping Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#FFF9F6] border border-[#FFE8EF] space-y-1">
                <span className="font-bold text-[#5A3A3A] block">Thông tin khách hàng:</span>
                <p>👤 <b>Tên:</b> {selectedOrder.customer_name}</p>
                <p>📞 <b>SĐT:</b> {selectedOrder.phone}</p>
                {selectedOrder.email && <p>✉️ <b>Email:</b> {selectedOrder.email}</p>}
                {selectedOrder.note && (
                  <p className="text-amber-800 bg-amber-50 p-2 rounded-lg mt-1 border border-amber-200">
                    📝 <b>Ghi chú:</b> {selectedOrder.note}
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FFF9F6] border border-[#FFE8EF] space-y-1">
                <span className="font-bold text-[#5A3A3A] block">Địa chỉ giao hàng (SPX):</span>
                <p className="text-[#5A3A3A]">{selectedOrder.address_detail}</p>
                <p className="font-bold text-[#F9739B]">
                  {selectedOrder.address_ward}, {selectedOrder.address_province}
                </p>
                <div className="pt-2">
                  <span className="px-2 py-0.5 rounded-full bg-pink-100 text-[#E24C7C] font-bold text-[10px]">
                    {selectedOrder.is_preorder ? '🌟 Đơn hàng Pre-order' : '⚡ Hàng có sẵn'}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#7D5C5C] uppercase tracking-wider block">
                Sản phẩm trong đơn ({selectedOrder.items?.length || 0})
              </span>
              <div className="divide-y divide-[#FFE8EF] border border-[#FFE8EF] rounded-2xl p-2 bg-[#FFF9F6]/40 max-h-40 overflow-y-auto">
                {selectedOrder.items?.map((it) => (
                  <div key={it.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#5A3A3A]">{it.product_name_snapshot}</p>
                      <p className="text-[11px] text-[#A39A9A]">Phân loại: {it.variant_name_snapshot}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#E24C7C]">
                        {it.unit_price.toLocaleString('vi-VN')}đ × {it.quantity}
                      </span>
                      <p className="font-bold text-xs text-[#5A3A3A]">
                        {it.line_total.toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-3 rounded-2xl bg-[#FFE8EF]/40 border border-[#F9739B]/20 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span>Tiền hàng:</span>
                <span className="font-bold">{selectedOrder.subtotal.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between">
                <span>Phí vận chuyển SPX:</span>
                <span className="font-bold">{selectedOrder.shipping_fee.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#F9739B]/30 font-bold text-sm">
                <span>Tổng đơn:</span>
                <span className="text-[#E24C7C] font-title text-base font-extrabold">
                  {selectedOrder.total.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <div className="text-[10px] text-[#7D5C5C]">
                Hình thức: <b>{selectedOrder.payment_method === 'cod' ? 'Thu COD' : 'Chuyển khoản VietQR'}</b> ({selectedOrder.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'})
              </div>
            </div>

            {/* 1-Click Status Transitions */}
            <div className="space-y-2 pt-2 border-t border-[#FFE8EF]">
              <span className="text-xs font-bold text-[#7D5C5C] uppercase tracking-wider block">
                Chuyển trạng thái 1 chạm:
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedOrder.status === 'new' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'confirmed')}
                    disabled={isUpdatingStatus}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-colors"
                  >
                    Xác nhận đơn
                  </button>
                )}
                {(selectedOrder.status === 'new' || selectedOrder.status === 'confirmed') && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'packing')}
                    disabled={isUpdatingStatus}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition-colors"
                  >
                    Chuyển đóng gói
                  </button>
                )}
                {selectedOrder.status === 'packing' && (
                  <button
                    onClick={() => setShowShippingModal(true)}
                    disabled={isUpdatingStatus}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors"
                  >
                    Giao hàng SPX (Nhập mã vận đơn)
                  </button>
                )}
                {selectedOrder.status === 'shipping' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                    disabled={isUpdatingStatus}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-green-600 text-white font-bold text-xs hover:bg-green-700 transition-colors"
                  >
                    Đánh dấu Hoàn thành
                  </button>
                )}
                {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                  <button
                    onClick={() => {
                      const reason = prompt('Nhập lý do hủy đơn:');
                      if (reason) {
                        handleUpdateStatus(selectedOrder.id, 'cancelled');
                      }
                    }}
                    disabled={isUpdatingStatus}
                    className="py-2.5 px-3 rounded-xl bg-gray-100 text-red-600 hover:bg-red-50 font-bold text-xs transition-colors"
                  >
                    Hủy đơn
                  </button>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-[#FFE8EF]">
              <Link
                href={`/admin/orders/${selectedOrder.id}/in-phieu`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black text-white font-bold text-xs hover:bg-gray-800 transition-colors"
              >
                <Printer size={14} /> In phiếu giao hàng
              </Link>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#7D5C5C] hover:bg-[#FFE8EF]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Prompt for Tracking Code when Shipping */}
      {showShippingModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-[#FFE8EF]">
            <h3 className="font-title text-base font-bold text-[#5A3A3A] flex items-center gap-2">
              <Truck size={18} className="text-[#F9739B]" /> Chuyển sang "Đang giao"
            </h3>
            <p className="text-xs text-[#7D5C5C]">
              Nhập mã vận đơn nhận được từ cổng SPX (ví dụ: SPXVN0392817281):
            </p>
            <input
              type="text"
              placeholder="Mã vận đơn SPX..."
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs font-mono uppercase"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowShippingModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#7D5C5C] hover:bg-[#FFE8EF]"
              >
                Hủy
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedOrder.id, 'shipping', trackingInput)}
                disabled={isUpdatingStatus}
                className="px-4 py-2 rounded-xl bg-[#F9739B] text-white font-bold text-xs hover:bg-[#E24C7C] transition-colors"
              >
                Xác nhận giao hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
