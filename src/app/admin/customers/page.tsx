'use client';

import React, { useState, useEffect } from 'react';
import { AdminNav } from '@/components/AdminNav';
import { createClient } from '@/lib/supabase/client';
import type { Customer, Order } from '@/types/database';
import {
  Users,
  Search,
  RefreshCw,
  Phone,
  Mail,
  ShoppingBag,
  AlertTriangle,
  Ban,
  CheckCircle2,
  X,
  Save,
  Clock,
  ShieldAlert,
  UserCheck,
  ExternalLink,
} from 'lucide-react';

interface CustomerWithOrders extends Customer {
  orders?: Order[];
  cancelCount?: number;
  completedCount?: number;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithOrders[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithOrders | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [customerNote, setCustomerNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isUpdatingBlock, setIsUpdatingBlock] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      // Fetch both customers and orders to compute full stats
      const [custRes, ordRes] = await Promise.all([
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
      ]);

      const allOrders = (ordRes.data as Order[]) || [];
      const rawCustomers = (custRes.data as Customer[]) || [];

      // Map orders to customers or create virtual customer records from orders if CRM is new
      const customerMap: Map<string, CustomerWithOrders> = new Map();

      // First add registered CRM customers
      rawCustomers.forEach((c) => {
        customerMap.set(c.phone.trim(), {
          ...c,
          orders: [],
          cancelCount: 0,
          completedCount: 0,
        });
      });

      // Then aggregate from actual orders
      allOrders.forEach((o) => {
        const cleanPhone = o.phone.trim();
        let cust = customerMap.get(cleanPhone);
        if (!cust) {
          cust = {
            id: `c_${cleanPhone}`,
            phone: cleanPhone,
            name: o.customer_name,
            email: o.email || null,
            first_source: o.source || 'direct',
            total_orders: 0,
            total_spent: 0,
            note: null,
            is_blocked: false,
            created_at: o.created_at,
            updated_at: o.created_at,
            orders: [],
            cancelCount: 0,
            completedCount: 0,
          };
          customerMap.set(cleanPhone, cust);
        }

        cust.orders = cust.orders || [];
        cust.orders.push(o);
        cust.total_orders = cust.orders.length;

        if (o.status !== 'cancelled' && o.status !== 'return_rejected' && o.status !== 'refunded') {
          cust.total_spent += o.total || 0;
        }

        if (o.status === 'cancelled' || o.status === 'returned' || o.status === 'refunded') {
          cust.cancelCount = (cust.cancelCount || 0) + 1;
        }

        if (o.status === 'completed') {
          cust.completedCount = (cust.completedCount || 0) + 1;
        }
      });

      const list = Array.from(customerMap.values()).sort(
        (a, b) => (b.total_orders || 0) - (a.total_orders || 0)
      );
      setCustomers(list);
    } catch (err) {
      console.warn('Lỗi khi tải dữ liệu khách hàng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenDetail = (cust: CustomerWithOrders) => {
    setSelectedCustomer(cust);
    setCustomerOrders(cust.orders || []);
    setCustomerNote(cust.note || '');
  };

  const handleSaveNote = async () => {
    if (!selectedCustomer) return;
    setIsSavingNote(true);
    try {
      const supabase = createClient();
      await supabase
        .from('customers')
        .update({
          note: customerNote.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('phone', selectedCustomer.phone);

      setSelectedCustomer((prev) => (prev ? { ...prev, note: customerNote.trim() } : null));
      setCustomers((prev) =>
        prev.map((c) =>
          c.phone === selectedCustomer.phone ? { ...c, note: customerNote.trim() } : c
        )
      );
      alert('Đã lưu ghi chú nội bộ về khách hàng thành công!');
    } catch (e) {
      alert('Không thể lưu ghi chú');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!selectedCustomer) return;
    const nextBlocked = !selectedCustomer.is_blocked;
    const confirmMsg = nextBlocked
      ? `Bạn có chắc chắn muốn CHẶN khách hàng này?\nKhách có SĐT ${selectedCustomer.phone} sẽ không thể tạo thêm đơn hàng COD hay QR.`
      : `Mở chặn cho khách hàng ${selectedCustomer.phone}?`;

    if (!confirm(confirmMsg)) return;

    setIsUpdatingBlock(true);
    try {
      const supabase = createClient();
      await supabase
        .from('customers')
        .update({
          is_blocked: nextBlocked,
          updated_at: new Date().toISOString(),
        })
        .eq('phone', selectedCustomer.phone);

      setSelectedCustomer((prev) => (prev ? { ...prev, is_blocked: nextBlocked } : null));
      setCustomers((prev) =>
        prev.map((c) =>
          c.phone === selectedCustomer.phone ? { ...c, is_blocked: nextBlocked } : c
        )
      );
      alert(nextBlocked ? 'Đã chặn khách hàng!' : 'Đã mở chặn cho khách hàng!');
    } catch (e) {
      alert('Không thể cập nhật trạng thái chặn');
    } finally {
      setIsUpdatingBlock(false);
    }
  };

  // Filter customers by search query
  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchName = c.name?.toLowerCase().includes(q);
    const matchPhone = c.phone.includes(q);
    const matchEmail = c.email?.toLowerCase().includes(q);
    return matchName || matchPhone || matchEmail;
  });

  const totalSpentAll = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
  const blockedCount = customers.filter((c) => c.is_blocked).length;
  const repeatCount = customers.filter((c) => (c.total_orders || 0) >= 2).length;

  return (
    <div className="min-h-screen bg-[#FFF9F6]">
      <AdminNav />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-title text-2xl font-bold text-[#5A3A3A] flex items-center gap-2">
              <Users size={24} className="text-[#E24C7C]" />
              Quản Lý Khách Hàng (CRM)
            </h1>
            <p className="text-xs text-[#7D5C5C] mt-1">
              Hồ sơ tự động theo SĐT, lịch sử đặt đơn, phòng chống bom hàng COD và ghi chú nội bộ (FR-A-30..34)
            </p>
          </div>

          <button
            onClick={fetchCustomers}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-white border border-[#FFE8EF] hover:border-[#F9739B] text-xs font-bold text-[#5A3A3A] transition-all shadow-xs self-start sm:self-auto cursor-pointer"
            title="Tải lại danh sách"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>
        </div>

        {/* 3 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl border border-[#FFE8EF] p-5 shadow-xs space-y-1">
            <span className="text-xs font-bold text-[#7D5C5C]">Tổng số khách hàng</span>
            <p className="font-title text-2xl font-bold text-[#5A3A3A]">{customers.length}</p>
            <p className="text-[11px] text-[#A39A9A]">Tự động ghi nhận theo số điện thoại</p>
          </div>

          <div className="bg-white rounded-3xl border border-[#FFE8EF] p-5 shadow-xs space-y-1">
            <span className="text-xs font-bold text-[#7D5C5C]">Khách mua lại (≥ 2 đơn)</span>
            <p className="font-title text-2xl font-bold text-[#E24C7C]">{repeatCount}</p>
            <p className="text-[11px] text-green-600 font-bold">
              {customers.length > 0 ? Math.round((repeatCount / customers.length) * 100) : 0}% tỷ lệ quay lại
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-[#FFE8EF] p-5 shadow-xs space-y-1">
            <span className="text-xs font-bold text-[#7D5C5C]">Khách bị chặn bom hàng</span>
            <p className="font-title text-2xl font-bold text-rose-600">{blockedCount}</p>
            <p className="text-[11px] text-[#A39A9A]">Khóa quyền đặt đơn COD/QR</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-3xl border border-[#FFE8EF] p-4 flex items-center justify-between shadow-xs">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Tìm theo tên khách, số điện thoại hoặc email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FFF9F6] border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs text-[#5A3A3A]"
            />
            <Search size={15} className="absolute left-3 top-2.5 text-[#A39A9A]" />
          </div>
        </div>

        {/* Customer Table */}
        <div className="bg-white rounded-3xl border border-[#FFE8EF] overflow-hidden shadow-xs">
          {loading ? (
            <div className="text-center py-20 text-xs text-[#7D5C5C]">
              Đang tải danh sách khách hàng...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-16 p-6 text-xs text-[#7D5C5C]">
              Không tìm thấy khách hàng nào phù hợp.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF9F6] border-b border-[#FFE8EF] text-[#7D5C5C] text-[10px] uppercase">
                  <tr>
                    <th className="p-4">Khách hàng</th>
                    <th className="p-4">Số điện thoại</th>
                    <th className="p-4">Số đơn</th>
                    <th className="p-4">Tổng chi tiêu</th>
                    <th className="p-4">Kênh đầu tiên</th>
                    <th className="p-4">Cảnh báo / Tình trạng</th>
                    <th className="p-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FFE8EF]">
                  {filteredCustomers.map((cust) => {
                    const hasHighRisk = (cust.cancelCount || 0) >= 2;
                    return (
                      <tr key={cust.phone} className="hover:bg-[#FFF9F6]/50 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-[#5A3A3A]">{cust.name}</p>
                          {cust.email && (
                            <p className="text-[10px] text-[#A39A9A]">{cust.email}</p>
                          )}
                        </td>
                        <td className="p-4 font-mono font-bold text-[#5A3A3A]">{cust.phone}</td>
                        <td className="p-4 font-bold">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] ${
                              (cust.total_orders || 0) >= 2
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {cust.total_orders} đơn
                          </span>
                        </td>
                        <td className="p-4 font-title font-bold text-[#E24C7C]">
                          {(cust.total_spent || 0).toLocaleString('vi-VN')}đ
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full bg-[#FFE8EF] text-[#E24C7C] text-[10px] font-bold">
                            {cust.first_source || 'direct'}
                          </span>
                        </td>
                        <td className="p-4">
                          {cust.is_blocked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">
                              <Ban size={11} /> Đã chặn
                            </span>
                          ) : hasHighRisk ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] animate-pulse">
                              <AlertTriangle size={11} /> Đã hủy {cust.cancelCount} đơn
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 font-bold text-[10px]">
                              <CheckCircle2 size={11} /> Uy tín ({cust.completedCount || 0} đã giao)
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleOpenDetail(cust)}
                            className="px-3 py-1.5 rounded-xl bg-[#FFF9F6] border border-[#FFE8EF] hover:border-[#F9739B] text-xs font-bold text-[#5A3A3A] transition-colors cursor-pointer"
                          >
                            Chi tiết & Lịch sử
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Customer Detail & Orders History Modal (FR-A-32) */}
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-[#FFE8EF] max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#FFE8EF] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FFE8EF] text-[#E24C7C] flex items-center justify-center font-bold">
                    <Users size={20} />
                  </div>
                  <div>
                    <h2 className="font-title text-lg font-bold text-[#5A3A3A]">
                      {selectedCustomer.name}
                    </h2>
                    <p className="text-xs text-[#7D5C5C] font-mono">
                      {selectedCustomer.phone} • {selectedCustomer.email || 'Không có email'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 rounded-full text-[#A39A9A] hover:text-[#5A3A3A] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* CRM Info & Block Button */}
              <div className="p-4 rounded-2xl bg-[#FFF9F6] border border-[#FFE8EF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-[#5A3A3A]">
                    Tổng cộng: <b>{selectedCustomer.total_orders}</b> đơn hàng • Đã chi tiêu:{' '}
                    <b className="text-[#E24C7C]">
                      {(selectedCustomer.total_spent || 0).toLocaleString('vi-VN')}đ
                    </b>
                  </p>
                  <p className="text-[11px] text-[#7D5C5C] mt-0.5">
                    Nguồn vào đầu tiên: <b className="uppercase">{selectedCustomer.first_source || 'Trực tiếp'}</b>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleBlock}
                  disabled={isUpdatingBlock}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCustomer.is_blocked
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  {selectedCustomer.is_blocked ? (
                    <>
                      <UserCheck size={14} />
                      <span>Mở chặn khách hàng</span>
                    </>
                  ) : (
                    <>
                      <Ban size={14} />
                      <span>Chặn khách (Bom hàng COD)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Shop Internal Note (FR-A-32) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5A3A3A] flex items-center justify-between">
                  <span>Ghi chú nội bộ của shop về khách này:</span>
                  <span className="text-[10px] text-[#A39A9A] font-normal">Chỉ shop nhìn thấy</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ví dụ: Khách quen TikTok, thích squishy thơm bơ, đóng gói cẩn thận..."
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs text-[#5A3A3A]"
                  />
                  <button
                    onClick={handleSaveNote}
                    disabled={isSavingNote}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5A3A3A] text-white text-xs font-bold hover:bg-[#3D2525] transition-all cursor-pointer"
                  >
                    <Save size={13} />
                    <span>Lưu</span>
                  </button>
                </div>
              </div>

              {/* Past Orders History */}
              <div className="flex-1 overflow-hidden flex flex-col space-y-2">
                <p className="text-xs font-bold text-[#5A3A3A]">
                  Lịch sử các đơn hàng đã đặt ({customerOrders.length}):
                </p>

                <div className="overflow-y-auto max-h-56 border border-[#FFE8EF] rounded-xl">
                  {customerOrders.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[#A39A9A]">
                      Chưa có lịch sử đơn hàng
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FFF9F6] border-b border-[#FFE8EF] text-[#7D5C5C] text-[10px] uppercase sticky top-0">
                        <tr>
                          <th className="p-2.5">Mã đơn</th>
                          <th className="p-2.5">Ngày đặt</th>
                          <th className="p-2.5">Thanh toán</th>
                          <th className="p-2.5">Tổng tiền</th>
                          <th className="p-2.5">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#FFE8EF]">
                        {customerOrders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-[#FFF9F6]/40">
                            <td className="p-2.5 font-mono font-bold text-[#F9739B]">{ord.code}</td>
                            <td className="p-2.5 text-[11px] text-[#7D5C5C]">
                              {new Date(ord.created_at).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="p-2.5 font-bold uppercase text-[10px]">
                              {ord.payment_method === 'cod' ? 'COD' : 'VietQR'}
                            </td>
                            <td className="p-2.5 font-bold text-[#5A3A3A]">
                              {ord.total.toLocaleString('vi-VN')}đ
                            </td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                                {ord.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end pt-3 border-t border-[#FFE8EF]">
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="px-5 py-2 rounded-xl bg-[#5A3A3A] text-white text-xs font-bold hover:bg-[#3D2525] transition-all cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
