'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Order, OrderItem } from '@/types/database';
import { Printer, ArrowLeft, Package, CheckCircle2 } from 'lucide-react';

interface OrderWithItems extends Order {
  items: OrderItem[];
}

export default function BatchPrintLabelsPage() {
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
            size: ${printSize === 'a7' ? '74mm 105mm' : printSize === 'a5' ? 'A5' : '100mm 150mm'};
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
            border-radius: 0 !important;
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

        {/* Size toggle */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setPrintSize('a7')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              printSize === 'a7' ? 'bg-[#E24C7C] text-white shadow-xs' : 'text-gray-600 hover:text-black'
            }`}
          >
            Khổ A7 (74×105mm)
          </button>
          <button
            onClick={() => setPrintSize('thermal_100x150')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              printSize === 'thermal_100x150' ? 'bg-[#E24C7C] text-white shadow-xs' : 'text-gray-600 hover:text-black'
            }`}
          >
            Tem nhiệt 100×150mm
          </button>
          <button
            onClick={() => setPrintSize('a5')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              printSize === 'a5' ? 'bg-[#E24C7C] text-white shadow-xs' : 'text-gray-600 hover:text-black'
            }`}
          >
            Khổ A5 (148×210mm)
          </button>
        </div>

        {/* Print Button */}
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E24C7C] text-white font-bold text-xs shadow-md hover:bg-[#F9739B] transition-all"
        >
          <Printer size={16} />
          <span>In tất cả ({orders.length} phiếu)</span>
        </button>
      </div>

      {/* Render All Selected Order Labels */}
      <div className="space-y-6 print:space-y-0">
        {orders.map((order, orderIdx) => {
          const isCOD = order.payment_method === 'cod';
          const codAmount = isCOD ? order.total : 0;

          return (
            <div
              key={order.id}
              className={`batch-label-item mx-auto bg-white border border-gray-400 p-4 shadow-md ${
                printSize === 'a7'
                  ? 'max-w-[74mm] min-h-[105mm] text-[10px]'
                  : printSize === 'a5'
                  ? 'max-w-[148mm] min-h-[210mm] text-xs'
                  : 'max-w-[100mm] min-h-[150mm] text-[11px]'
              }`}
            >
              {/* Header: Shop info & Barcode representation */}
              <div className="flex items-start justify-between border-b-2 border-black pb-2 mb-2">
                <div>
                  <h1 className="font-bold text-sm tracking-tight uppercase">chocomino squishy</h1>
                  <p className="text-[9px] text-gray-700">Đ. Số 2/38/32 Bình Đường 1, Dĩ An, TP.HCM</p>
                  <p className="text-[9px] text-gray-700">Hotline: 0900000000</p>
                </div>
                <div className="text-right">
                  <div className="border border-black px-2 py-0.5 font-mono font-bold text-xs inline-block">
                    {order.code}
                  </div>
                  <p className="text-[9px] font-bold text-gray-600 mt-0.5">SPX EXPRESS</p>
                </div>
              </div>

              {/* Receiver Section */}
              <div className="border-b-2 border-black pb-2 mb-2">
                <span className="text-[9px] uppercase font-bold text-gray-500 block">Người nhận:</span>
                <p className="font-bold text-xs uppercase">{order.customer_name}</p>
                <p className="font-bold text-xs tracking-wider">{order.phone}</p>
                <p className="mt-0.5 leading-tight">
                  {order.address_detail}, {order.address_ward}, {order.address_province}
                </p>
              </div>

              {/* Items List */}
              <div className="border-b-2 border-black pb-2 mb-2">
                <span className="text-[9px] uppercase font-bold text-gray-500 block mb-1">
                  Nội dung hàng ({order.items?.length || 0} món):
                </span>
                <ul className="space-y-0.5">
                  {order.items?.map((it, idx) => (
                    <li key={idx} className="flex justify-between items-center text-[10px]">
                      <span className="truncate pr-2">
                        • {it.product_name_snapshot} ({it.variant_name_snapshot})
                      </span>
                      <span className="font-bold shrink-0">x{it.quantity}</span>
                    </li>
                  ))}
                </ul>
                {order.note && (
                  <p className="mt-1 text-[9px] italic border-t border-dashed border-gray-300 pt-1">
                    Ghi chú khách: {order.note}
                  </p>
                )}
              </div>

              {/* COD Cash Collection - Highlighted Box */}
              <div className="border-2 border-black p-2 my-2 text-center bg-gray-50">
                <span className="text-[9px] uppercase font-bold block text-gray-700">
                  Tiền thu người nhận (COD):
                </span>
                <p className="font-mono text-base font-black tracking-wider text-black">
                  {isCOD ? `${codAmount.toLocaleString('vi-VN')} đ` : '0 đ (ĐÃ THANH TOÁN)'}
                </p>
                <p className="text-[8px] text-gray-600 mt-0.5">
                  {isCOD ? 'Thu tiền mặt trước khi giao gói hàng' : 'Không thu thêm tiền của người nhận'}
                </p>
              </div>

              {/* Footer / SPX Instructions */}
              <div className="text-[8px] text-gray-600 leading-tight space-y-0.5 mt-2">
                <p>• Không cho xem hàng | Cho phép đồng kiểm theo chính sách SPX.</p>
                <p>• Quay video toàn cảnh mở hộp khi nhận hàng để được đổi trả trong 3 ngày.</p>
                <div className="flex justify-between items-center pt-2 text-[8px] text-gray-500">
                  <span>Phiếu {orderIdx + 1}/{orders.length}</span>
                  <span>Ngày in: {new Date().toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
