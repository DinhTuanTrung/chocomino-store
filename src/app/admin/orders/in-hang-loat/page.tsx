'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Order, OrderItem } from '@/types/database';
import { Printer, ArrowLeft } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

interface OrderWithItems extends Order {
  items: OrderItem[];
}

export default function BatchPrintLabelsPage() {
  const { shopInfo } = useSettings();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [printSize, setPrintSize] = useState<'a7' | 'thermal_100x150' | 'a5'>('a7');

  useEffect(() => {
    async function loadBatchOrders() {
      setLoading(true);
      try {
        let orderIds: string[] = [];

        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const idsParam = urlParams.get('ids');
          if (idsParam) {
            orderIds = idsParam.split(',').filter(Boolean);
          } else {
            const cached = sessionStorage.getItem('chocomino_print_batch_ids');
            if (cached) {
              orderIds = JSON.parse(cached);
            }
          }
        }

        if (orderIds.length === 0) {
          setOrders([]);
          setLoading(false);
          return;
        }

        const supabase = createClient();
        const { data, error } = await supabase
          .from('orders')
          .select('*, items:order_items(*)')
          .in('id', orderIds);

        if (data && data.length > 0) {
          setOrders(data as OrderWithItems[]);
        }
      } catch (err) {
        console.error('Lỗi khi tải đơn in hàng loạt:', err);
      } finally {
        setLoading(false);
      }
    }

    loadBatchOrders();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-[#7D5C5C] bg-[#FFF9F6]">
        Đang nạp danh sách {orders.length > 0 ? orders.length : ''} phiếu in giao hàng...
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-3 bg-[#FFF9F6]">
        <p className="font-bold text-sm text-[#5A3A3A]">Chưa có đơn hàng nào được chọn để in hàng loạt</p>
        <Link
          href="/admin/orders"
          className="px-4 py-2 rounded-full bg-[#FFE8EF] text-[#E24C7C] font-bold text-xs"
        >
          Quay lại danh sách Đơn hàng
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans text-black">
      {/* Dynamic Print CSS for Page Sizing and Multi-page Breaks */}
      <style jsx global>{`
        @media print {
          @page {
            size: ${printSize === 'a7' ? '76mm 130mm' : printSize === 'a5' ? 'A5' : '100mm 150mm'};
            margin: 0;
          }
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .batch-label-item {
            page-break-after: always !important;
            break-after: page !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-color: black !important;
          }
        }
      `}</style>

      {/* Action Controls - Hidden on Print */}
      <div className="max-w-3xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-black transition-colors"
        >
          <ArrowLeft size={15} /> Quay lại Quản lý đơn
        </Link>

        {/* Size Selection */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setPrintSize('a7')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              printSize === 'a7' ? 'bg-[#E24C7C] text-white shadow-xs' : 'text-gray-600 hover:text-black'
            }`}
          >
            Khổ A7 (76×130mm)
          </button>
          <button
            onClick={() => setPrintSize('thermal_100x150')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              printSize === 'thermal_100x150' ? 'bg-[#E24C7C] text-white shadow-xs' : 'text-gray-600 hover:text-black'
            }`}
          >
            Tem nhiệt 100×150mm
          </button>
          <button
            onClick={() => setPrintSize('a5')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              printSize === 'a5' ? 'bg-[#E24C7C] text-white shadow-xs' : 'text-gray-600 hover:text-black'
            }`}
          >
            Khổ A5 (148×210mm)
          </button>
        </div>

        {/* Print Button */}
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E24C7C] text-white font-bold text-xs shadow-md hover:bg-[#F9739B] transition-all cursor-pointer"
        >
          <Printer size={16} />
          <span>In tất cả ({orders.length} phiếu)</span>
        </button>
      </div>

      {/* Render All Selected Order Labels (Identical Layout to Single Print) */}
      <div className="space-y-6 print:space-y-0">
        {orders.map((order, orderIdx) => {
          const isCOD = order.payment_method === 'cod';
          const codAmount = isCOD ? order.total : 0;

          return (
            <div
              key={order.id}
              className={`batch-label-item mx-auto bg-white border-2 border-black shadow-md print:shadow-none print:border-black print:m-0 ${
                printSize === 'a7'
                  ? 'w-[287px] min-h-[491px] p-3 space-y-2 text-[10px] leading-tight'
                  : printSize === 'thermal_100x150'
                  ? 'w-[380px] min-h-[570px] p-4 space-y-3 text-[11px]'
                  : 'w-[560px] min-h-[790px] p-6 space-y-4 text-xs'
              }`}
            >
              {/* Header: Carrier & Brand */}
              <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-title font-extrabold tracking-tight ${
                      printSize === 'a7' ? 'text-base' : 'text-xl'
                    }`}
                  >
                    chocomino
                  </span>
                  <span className="text-[8px] font-bold border border-black px-1 py-0.2 rounded">
                    SQUISHY SHOP
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`font-extrabold tracking-wider uppercase ${
                      printSize === 'a7' ? 'text-xs' : 'text-sm'
                    }`}
                  >
                    SPX EXPRESS
                  </span>
                  <p className="text-[8px] font-mono">Phiếu giao hàng TMĐT</p>
                </div>
              </div>

              {/* Order Barcode / Code Area */}
              <div className="border-b-2 border-black pb-1.5 flex items-center justify-between">
                <div>
                  <span className="text-[8px] uppercase font-bold text-gray-600">Mã đơn hàng</span>
                  <p
                    className={`font-mono font-extrabold tracking-wider ${
                      printSize === 'a7' ? 'text-base' : 'text-xl'
                    }`}
                  >
                    {order.code}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[8px] uppercase font-bold text-gray-600">Ngày tạo</span>
                  <p className="font-mono text-[9px] font-bold">
                    {new Date(order.created_at).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>

              {/* Sender & Receiver Boxes */}
              <div className="grid grid-cols-2 gap-2 border-b-2 border-black pb-1.5">
                {/* Sender */}
                <div className="pr-1.5 border-r border-black space-y-0.5">
                  <span className="font-bold text-[8px] uppercase tracking-wider block text-gray-600">
                    Người gửi:
                  </span>
                  <p className="font-bold">{shopInfo.name || 'chocomino shop'}</p>
                  <p className="text-gray-700 leading-tight">
                    {shopInfo.address || 'Đ. Số 2/38/32 Bình Đường 1, Dĩ An, TP.HCM'}
                  </p>
                  <p className="font-mono font-bold">Hotline: {shopInfo.hotline || shopInfo.phone || '0900000000'}</p>
                </div>

                {/* Receiver */}
                <div className="pl-1 space-y-0.5">
                  <span className="font-bold text-[8px] uppercase tracking-wider block text-gray-600">
                    Người nhận:
                  </span>
                  <p className="font-bold text-[11px]">{order.customer_name}</p>
                  <p className="font-mono font-extrabold text-[10px]">{order.phone}</p>
                  <p className="text-gray-900 leading-tight">
                    {order.address_detail}, {order.address_ward}, {order.address_province}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="border-b-2 border-black pb-1.5 space-y-0.5">
                <span className="font-bold text-[8px] uppercase tracking-wider block text-gray-600">
                  Nội dung hàng ({order.items?.length || 0} món):
                </span>
                <div className="divide-y divide-gray-200">
                  {order.items?.map((it, idx) => (
                    <div key={idx} className="py-0.5 flex justify-between items-center">
                      <span className="font-medium truncate max-w-[180px]">
                        {idx + 1}. {it.product_name_snapshot} ({it.variant_name_snapshot})
                      </span>
                      <span className="font-mono font-bold shrink-0">SL: {it.quantity}</span>
                    </div>
                  ))}
                </div>
                {order.note && (
                  <p className="italic border-t border-dashed border-gray-300 pt-0.5 text-gray-700">
                    Ghi chú: {order.note}
                  </p>
                )}
              </div>

              {/* COD Collection Box - CRITICAL HIGHLIGHT */}
              <div className="border-2 border-black p-1.5 bg-gray-50 flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-[9px] uppercase block tracking-wider">
                    TIỀN THU NGƯỜI NHẬN (COD):
                  </span>
                  <span className="text-[8px] text-gray-600">
                    {isCOD ? 'Thu đúng số tiền ghi bên phải' : 'Đã thanh toán qua VietQR'}
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`font-title font-extrabold tracking-tight block ${
                      printSize === 'a7' ? 'text-lg' : 'text-2xl'
                    }`}
                  >
                    {isCOD ? `${codAmount.toLocaleString('vi-VN')} VNĐ` : '0 VNĐ'}
                  </span>
                  {!isCOD && (
                    <span className="text-[8px] font-extrabold text-green-700 border border-green-700 px-1 py-0.2 rounded">
                      ĐÃ THANH TOÁN
                    </span>
                  )}
                </div>
              </div>

              {/* Footer / Instructions */}
              <div className="pt-1 text-[8px] text-gray-600 space-y-0.5">
                <p>• Không cho xem hàng, không cho thử theo tiêu chuẩn SPX.</p>
                <p>• Khách hàng vui lòng <b>quay video mở hộp kiện hàng</b> để hỗ trợ đổi trả 3 ngày.</p>
                <div className="flex justify-between items-center pt-1 text-[8px] text-gray-500 font-mono">
                  <span>Phiếu {orderIdx + 1}/{orders.length}</span>
                  <span>Ngày in: {new Date().toLocaleDateString('vi-VN')}</span>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-2 grid grid-cols-2 gap-2 text-center text-[8px] border-t border-dashed border-gray-400">
                <div>
                  <span className="font-bold uppercase">Chữ ký người gửi</span>
                  <div className={printSize === 'a7' ? 'h-5' : 'h-8'}></div>
                </div>
                <div>
                  <span className="font-bold uppercase">Chữ ký người nhận</span>
                  <div className={printSize === 'a7' ? 'h-5' : 'h-8'}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
