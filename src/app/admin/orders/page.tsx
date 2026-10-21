'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AdminNav } from '@/components/AdminNav';
import {
  FileSpreadsheet,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Printer,
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';

const INITIAL_ORDERS = [
  {
    id: 'ord-101',
    code: 'CM7K2P9Q',
    customerName: 'Nguyễn Thị Hồng',
    phone: '0987654321',
    province: 'Thành phố Hồ Chí Minh',
    ward: 'Phường Dĩ An',
    addressDetail: '38/32 Đường Số 2',
    status: 'packing',
    paymentMethod: 'cod',
    paymentStatus: 'unpaid',
    total: 108000,
    itemsText: 'Squishy Bánh Mì Nướng (Vị Socola × 2)',
    isPreorder: false,
    createdAt: '21/10/2026 14:20',
  },
  {
    id: 'ord-102',
    code: 'CM8M4R2X',
    customerName: 'Trần Văn Nam',
    phone: '0912345678',
    province: 'Thành phố Hà Nội',
    ward: 'Phường Hàng Bạc',
    addressDetail: 'Số 12 Phố Hàng Bạc',
    status: 'packing',
    paymentMethod: 'bank_qr',
    paymentStatus: 'paid',
    total: 87000,
    itemsText: 'Squishy Mèo Béo Bánh Bao (Trắng × 1)',
    isPreorder: false,
    createdAt: '21/10/2026 15:45',
  },
  {
    id: 'ord-103',
    code: 'CM9P5T3Z',
    customerName: 'Lê Thùy Dung',
    phone: '0903344556',
    province: 'Thành phố Hồ Chí Minh',
    ward: 'Phường Bến Nghé',
    addressDetail: 'Số 10 Nguyễn Huệ',
    status: 'new',
    paymentMethod: 'cod',
    paymentStatus: 'unpaid',
    total: 70000,
    itemsText: 'Squishy Quả Dâu Tây (Hồng × 1)',
    isPreorder: false,
    createdAt: '21/10/2026 16:10',
  },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [filterStatus, setFilterStatus] = useState('all');
  const [exporting, setExporting] = useState(false);

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

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'all') return true;
    return o.status === filterStatus;
  });

  return (
    <div className="min-h-screen bg-[#FFF9F6] text-[#5A3A3A]">
      <AdminNav />
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-title text-2xl md:text-3xl font-extrabold text-[#5A3A3A]">
              Quản lý Đơn hàng Chocomino 📦
            </h1>
            <p className="text-xs text-[#7D5C5C]">
              Xem trạng thái, đổi trạng thái và xuất file Excel mẫu chuẩn giao hàng SPX.
            </p>
          </div>

          {/* SPX Export Action Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportSPX}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E24C7C] text-white font-title text-xs font-bold shadow-md hover:bg-[#F9739B] transition-all disabled:bg-[#A39A9A]"
            >
              <FileSpreadsheet size={16} />
              {exporting ? 'Đang xuất Excel...' : 'Xuất Excel SPX (Sheet Mới)'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-3xl border border-[#FFE8EF] p-4 flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="text-[#A39A9A] mr-2 flex items-center gap-1">
            <Filter size={14} /> Lọc theo:
          </span>
          {[
            { id: 'all', label: 'Tất cả đơn' },
            { id: 'new', label: 'Đơn mới' },
            { id: 'packing', label: 'Đang đóng gói' },
            { id: 'shipping', label: 'Đang giao' },
            { id: 'completed', label: 'Hoàn thành' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-full transition-colors ${
                filterStatus === tab.id
                  ? 'bg-[#5A3A3A] text-white'
                  : 'bg-[#FFF9F6] text-[#7D5C5C] hover:bg-[#FFE8EF]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-3xl border border-[#FFE8EF] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFF9F6] border-b border-[#FFE8EF] text-[#7D5C5C] uppercase text-[10px]">
                <tr>
                  <th className="p-4">Mã đơn</th>
                  <th className="p-4">Khách hàng</th>
                  <th className="p-4">Sản phẩm</th>
                  <th className="p-4">Khu vực</th>
                  <th className="p-4">Thanh toán</th>
                  <th className="p-4">Tổng tiền</th>
                  <th className="p-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FFE8EF]">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#FFF9F6]/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-[#F9739B]">
                      {ord.code}
                    </td>
                    <td className="p-4 space-y-0.5">
                      <p className="font-bold text-[#5A3A3A]">{ord.customerName}</p>
                      <p className="text-[11px] text-[#A39A9A]">{ord.phone}</p>
                    </td>
                    <td className="p-4 text-[11px] max-w-[200px] truncate text-[#7D5C5C]">
                      {ord.itemsText}
                    </td>
                    <td className="p-4 text-[11px] text-[#7D5C5C]">
                      {ord.ward}, {ord.province}
                    </td>
                    <td className="p-4">
                      <span className="block font-bold">
                        {ord.paymentMethod === 'cod' ? 'COD' : 'VietQR'}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          ord.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'
                        }`}
                      >
                        {ord.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa trả'}
                      </span>
                    </td>
                    <td className="p-4 font-title font-bold text-[#E24C7C]">
                      {ord.total.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          ord.status === 'packing'
                            ? 'bg-amber-100 text-amber-800'
                            : ord.status === 'new'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {ord.status === 'packing'
                          ? 'Đóng gói'
                          : ord.status === 'new'
                          ? 'Mới'
                          : 'Hoàn thành'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
