'use client';

import React, { useState, useEffect } from 'react';
import { AdminNav } from '@/components/AdminNav';
import {
  History,
  Search,
  RefreshCw,
  Eye,
  X,
  ShieldAlert,
  Package,
  ShoppingBag,
  RotateCcw,
  KeyRound,
  FileText,
  User,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface AuditLogRecord {
  id: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  before_data: any;
  after_data: any;
  created_at: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/audit-logs?limit=100`;
      if (selectedEntity !== 'all') {
        url += `&entity=${selectedEntity}`;
      }
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Lỗi khi tải audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedEntity]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  // Humanize action labels
  const getActionLabel = (action: string) => {
    if (action.startsWith('order_status_')) {
      const status = action.replace('order_status_', '');
      const map: Record<string, string> = {
        new: 'Tạo đơn mới',
        confirmed: 'Xác nhận đơn',
        awaiting_stock: 'Chờ hàng về',
        packing: 'Đang đóng gói',
        shipping: 'Đang giao hàng',
        completed: 'Hoàn thành đơn',
        cancelled: 'Hủy đơn hàng',
        return_requested: 'Yêu cầu đổi trả',
        return_approved: 'Duyệt đổi trả',
        return_rejected: 'Từ chối đổi trả',
        refunded: 'Hoàn tiền',
      };
      return `Chuyển trạng thái: ${map[status] || status}`;
    }
    if (action === 'adjust_inventory') return 'Điều chỉnh tồn kho';
    if (action === 'create_product') return 'Tạo sản phẩm mới';
    if (action === 'admin_login') return 'Đăng nhập Admin';
    if (action.startsWith('resolve_return_')) return 'Xử lý khiếu nại đổi trả';
    if (action === 'block_customer') return 'Khóa khách hàng';
    if (action === 'unblock_customer') return 'Mở khóa khách hàng';
    return action;
  };

  // Entity icon and badge color
  const getEntityBadge = (entity: string) => {
    switch (entity) {
      case 'order':
        return {
          icon: ShoppingBag,
          label: 'Đơn hàng',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'product':
      case 'product_variant':
        return {
          icon: Package,
          label: entity === 'product' ? 'Sản phẩm' : 'Tồn kho biến thể',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'return_request':
        return {
          icon: RotateCcw,
          label: 'Đổi trả',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'auth':
        return {
          icon: KeyRound,
          label: 'Xác thực',
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      case 'customer':
        return {
          icon: User,
          label: 'Khách hàng',
          bg: 'bg-pink-50 text-pink-700 border-pink-200',
        };
      default:
        return {
          icon: FileText,
          label: entity,
          bg: 'bg-gray-50 text-gray-700 border-gray-200',
        };
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  // Metrics calculation
  const totalEvents = logs.length;
  const orderEvents = logs.filter((l) => l.entity === 'order').length;
  const stockEvents = logs.filter((l) => l.entity === 'product_variant' || l.entity === 'product').length;
  const authEvents = logs.filter((l) => l.entity === 'auth').length;

  return (
    <div className="min-h-screen bg-[#FFF9F6]">
      <AdminNav />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-title text-2xl font-bold text-[#5A3A3A] flex items-center gap-2">
              <History size={24} className="text-[#E24C7C]" />
              Nhật ký hoạt động hệ thống (Audit Logs)
            </h1>
            <p className="text-xs text-[#7D5C5C] mt-1">
              Ghi nhận minh bạch mọi thao tác quản trị: đổi trạng thái đơn, chỉnh tồn kho, thêm sản phẩm và đăng nhập (FR-A-62).
            </p>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#FFE8EF] bg-white text-xs font-bold text-[#5A3A3A] hover:bg-[#FFE8EF] hover:text-[#E24C7C] transition-all shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Làm mới nhật ký</span>
          </button>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-[#FFE8EF] shadow-xs">
            <span className="text-[11px] font-bold text-[#A39A9A]">Tổng sự kiện</span>
            <p className="font-title text-2xl font-extrabold text-[#5A3A3A] mt-1">{totalEvents}</p>
            <span className="text-[10px] text-gray-500">Bản ghi gần nhất</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#FFE8EF] shadow-xs">
            <span className="text-[11px] font-bold text-blue-600">Thao tác đơn hàng</span>
            <p className="font-title text-2xl font-extrabold text-blue-700 mt-1">{orderEvents}</p>
            <span className="text-[10px] text-gray-500">Chuyển trạng thái, SPX</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#FFE8EF] shadow-xs">
            <span className="text-[11px] font-bold text-emerald-600">Kho & Sản phẩm</span>
            <p className="font-title text-2xl font-extrabold text-emerald-700 mt-1">{stockEvents}</p>
            <span className="text-[10px] text-gray-500">Điều chỉnh tồn, tạo món</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#FFE8EF] shadow-xs">
            <span className="text-[11px] font-bold text-purple-600">Đăng nhập Admin</span>
            <p className="font-title text-2xl font-extrabold text-purple-700 mt-1">{authEvents}</p>
            <span className="text-[10px] text-gray-500">Phiên xác thực bảo mật</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#FFE8EF] shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter size={15} className="text-[#A39A9A] shrink-0" />
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#FFE8EF] text-xs font-bold text-[#5A3A3A] bg-white focus:outline-none focus:border-[#F9739B] w-full md:w-56"
            >
              <option value="all">Tất cả phân hệ</option>
              <option value="order">📦 Đơn hàng (order)</option>
              <option value="product_variant">🏷️ Biến thể & Tồn kho</option>
              <option value="product">🛍️ Sản phẩm (product)</option>
              <option value="return_request">↩️ Khiếu nại Đổi trả</option>
              <option value="auth">🔐 Đăng nhập (auth)</option>
              <option value="customer">👤 Khách hàng (customer)</option>
            </select>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <input
                type="text"
                placeholder="Tìm theo mã đơn, ID hoặc hành động..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#FFE8EF] text-xs text-[#5A3A3A] focus:outline-none focus:border-[#F9739B]"
              />
              <Search size={14} className="absolute left-3 top-2.5 text-[#A39A9A]" />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#5A3A3A] text-white text-xs font-bold hover:bg-[#3D2525] transition-all cursor-pointer shrink-0"
            >
              Tìm
            </button>
          </form>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-3xl border border-[#FFE8EF] shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-[#7D5C5C] space-y-2">
              <RefreshCw size={24} className="animate-spin text-[#F9739B] mx-auto" />
              <p>Đang tải dữ liệu nhật ký hệ thống...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#7D5C5C] space-y-2">
              <FileText size={32} className="text-[#A39A9A] mx-auto opacity-50" />
              <p className="font-bold text-[#5A3A3A]">Chưa có bản ghi hoạt động nào</p>
              <p className="text-[11px] text-[#A39A9A]">
                Các thao tác đổi trạng thái đơn hàng, điều chỉnh kho hoặc đăng nhập sẽ được ghi tự động vào đây.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#FFE8EF] bg-[#FFF9F6] text-[11px] font-bold text-[#7D5C5C]">
                    <th className="p-4">Thời gian</th>
                    <th className="p-4">Người thực hiện</th>
                    <th className="p-4">Phân hệ</th>
                    <th className="p-4">Hành động</th>
                    <th className="p-4">Đối tượng tác động</th>
                    <th className="p-4 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FFE8EF]">
                  {logs.map((log) => {
                    const badge = getEntityBadge(log.entity);
                    const Icon = badge.icon;
                    const actor = log.after_data?._actor || {};

                    return (
                      <tr key={log.id} className="hover:bg-[#FFF9F6]/60 transition-colors">
                        <td className="p-4 text-[#7D5C5C] whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            <Clock size={12} className="text-[#A39A9A]" />
                            {formatDate(log.created_at)}
                          </div>
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <span className="font-bold text-[#5A3A3A] block">
                              {actor.name || 'Trung (Chủ shop)'}
                            </span>
                            <span className="text-[10px] text-[#A39A9A] font-mono block">
                              {actor.email || 'admin@chocomino.local'}
                            </span>
                          </div>
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.bg}`}
                          >
                            <Icon size={12} />
                            {badge.label}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className="font-bold text-[#5A3A3A]">
                            {getActionLabel(log.action)}
                          </span>
                        </td>

                        <td className="p-4 font-mono text-[#E24C7C] font-bold whitespace-nowrap">
                          {log.entity_id || '—'}
                        </td>

                        <td className="p-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FFE8EF] text-[#E24C7C] font-bold text-[11px] hover:bg-[#F9739B] hover:text-white transition-all shadow-xs cursor-pointer"
                          >
                            <Eye size={12} /> Xem dữ liệu
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
      </main>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-[#FFE8EF] animate-fadeIn max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#FFE8EF] pb-3 shrink-0">
              <div>
                <h3 className="font-title text-base font-bold text-[#5A3A3A] flex items-center gap-1.5">
                  <History size={18} className="text-[#E24C7C]" />
                  Chi tiết bản ghi kiểm toán #{selectedLog.id.slice(0, 8)}
                </h3>
                <span className="text-[10px] text-[#A39A9A]">
                  Thời gian: {formatDate(selectedLog.created_at)}
                </span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-full text-[#A39A9A] hover:text-[#5A3A3A]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
              {/* Meta details */}
              <div className="grid grid-cols-2 gap-3 bg-[#FFF9F6] p-3.5 rounded-2xl border border-[#FFE8EF]">
                <div>
                  <span className="text-[10px] text-[#A39A9A] block">Hành động:</span>
                  <span className="font-bold text-[#5A3A3A]">{getActionLabel(selectedLog.action)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#A39A9A] block">Phân hệ:</span>
                  <span className="font-bold text-[#5A3A3A]">{selectedLog.entity}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#A39A9A] block">Đối tượng tác động:</span>
                  <span className="font-mono font-bold text-[#E24C7C]">{selectedLog.entity_id || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#A39A9A] block">Người thực hiện:</span>
                  <span className="font-bold text-[#5A3A3A]">
                    {selectedLog.after_data?._actor?.name || 'Trung (Chủ shop)'}
                  </span>
                </div>
              </div>

              {/* Before Data */}
              {selectedLog.before_data && (
                <div className="space-y-1.5">
                  <span className="font-bold text-[#7D5C5C] text-[11px] flex items-center gap-1">
                    <ArrowRight size={12} className="text-gray-400 rotate-180" />
                    Dữ liệu TRƯỚC khi thay đổi (Before):
                  </span>
                  <pre className="p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-[11px] text-gray-700 overflow-x-auto">
                    {JSON.stringify(selectedLog.before_data, null, 2)}
                  </pre>
                </div>
              )}

              {/* After Data */}
              {selectedLog.after_data && (
                <div className="space-y-1.5">
                  <span className="font-bold text-emerald-700 text-[11px] flex items-center gap-1">
                    <ArrowRight size={12} className="text-emerald-500" />
                    Dữ liệu SAU khi thay đổi (After):
                  </span>
                  <pre className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl font-mono text-[11px] text-emerald-900 overflow-x-auto">
                    {JSON.stringify(selectedLog.after_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#FFE8EF] flex justify-end shrink-0">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-full bg-[#5A3A3A] text-white font-title text-xs font-bold hover:bg-[#3D2525] transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
