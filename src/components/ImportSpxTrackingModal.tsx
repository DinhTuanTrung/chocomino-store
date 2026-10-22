'use client';

import React, { useState } from 'react';
import type { Order } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { Truck, X, Upload, Check, AlertCircle, Loader2, FileSpreadsheet } from 'lucide-react';

interface ImportSpxTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onSuccess: () => void;
}

interface ParsedTrackingItem {
  orderCode: string;
  trackingCode: string;
  orderId?: string;
  customerName?: string;
  matched: boolean;
}

export function ImportSpxTrackingModal({
  isOpen,
  onClose,
  orders,
  onSuccess,
}: ImportSpxTrackingModalProps) {
  const [inputText, setInputText] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedTrackingItem[]>([]);
  const [autoSetShipping, setAutoSetShipping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parseError, setParseError] = useState('');

  if (!isOpen) return null;

  // Parse text or CSV content
  const handleParseContent = (content: string) => {
    setParseError('');
    if (!content.trim()) {
      setParsedItems([]);
      return;
    }

    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const results: ParsedTrackingItem[] = [];

    lines.forEach((line) => {
      // Split by comma, tab, semicolon or space
      const parts = line.split(/[,\t;\s]+/).filter(Boolean);
      if (parts.length >= 2) {
        const orderCode = parts[0].trim().toUpperCase();
        const trackingCode = parts[1].trim();

        // Match with existing orders
        const matchedOrder = orders.find(
          (o) => o.code.toUpperCase() === orderCode || o.code.toUpperCase() === `CM${orderCode}`
        );

        results.push({
          orderCode,
          trackingCode,
          orderId: matchedOrder?.id,
          customerName: matchedOrder?.customer_name,
          matched: Boolean(matchedOrder),
        });
      }
    });

    if (results.length === 0) {
      setParseError('Không tìm thấy dòng dữ liệu nào khớp với định dạng: [Mã đơn website] [Mã vận đơn SPX]');
    }

    setParsedItems(results);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setInputText(text);
      handleParseContent(text);
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleApplyTracking = async () => {
    const validItems = parsedItems.filter((it) => it.matched && it.orderId);
    if (validItems.length === 0) {
      alert('Không có mã vận đơn nào khớp với đơn hàng trên hệ thống!');
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    let updatedCount = 0;

    try {
      for (const item of validItems) {
        const updatePayload: any = {
          shipment_code: item.trackingCode,
          updated_at: new Date().toISOString(),
        };

        if (autoSetShipping) {
          updatePayload.status = 'shipping';
        }

        const { error } = await supabase
          .from('orders')
          .update(updatePayload)
          .eq('id', item.orderId!);

        if (!error) {
          updatedCount++;
          // Also log to status history if status changed
          if (autoSetShipping) {
            await supabase.from('order_status_history').insert({
              order_id: item.orderId!,
              to_status: 'shipping',
              changed_by: 'admin',
              reason: `Cập nhật mã vận đơn SPX hàng loạt: ${item.trackingCode}`,
            });
          }
        }
      }

      alert(`Đã cập nhật mã vận đơn thành công cho ${updatedCount} đơn hàng!`);
      onSuccess();
      onClose();
    } catch (err) {
      alert('Đã có lỗi trong quá trình cập nhật mã vận đơn');
    } finally {
      setIsSubmitting(false);
    }
  };

  const matchedCount = parsedItems.filter((i) => i.matched).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#FFE8EF] max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#FFE8EF] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FFE8EF] text-[#E24C7C] flex items-center justify-center font-bold">
              <Truck size={20} />
            </div>
            <div>
              <h2 className="font-title text-lg font-bold text-[#5A3A3A]">
                Nhập Mã Vận Đơn SPX Hàng Loạt (FR-A-45)
              </h2>
              <p className="text-xs text-[#7D5C5C]">
                Cập nhật mã vận đơn trả về từ SPX và tự động chuyển trạng thái sang "Đang giao"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-full text-[#A39A9A] hover:text-[#5A3A3A] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Input Options: Paste or Upload file */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-[#5A3A3A]">
              Dán danh sách mã hoặc tải file kết quả từ SPX:
            </label>
            <label className="inline-flex items-center gap-1.5 text-xs text-[#E24C7C] font-bold cursor-pointer hover:underline">
              <Upload size={13} />
              <span>Tải file (.txt/.csv)</span>
              <input
                type="file"
                accept=".txt,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <textarea
            rows={5}
            placeholder={`Ví dụ định dạng mỗi dòng:\nCM284910 SPXVN01928301\nCM749201 SPXVN01928302\n(Có thể phân cách bằng dấu cách, phẩy hoặc tab)`}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              handleParseContent(e.target.value);
            }}
            className="w-full p-3.5 rounded-2xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none font-mono text-xs text-[#5A3A3A] bg-[#FFF9F6]"
          />
        </div>

        {parseError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{parseError}</span>
          </div>
        )}

        {/* Options */}
        <label className="flex items-center gap-2.5 text-xs font-bold text-[#5A3A3A] cursor-pointer">
          <input
            type="checkbox"
            checked={autoSetShipping}
            onChange={(e) => setAutoSetShipping(e.target.checked)}
            className="rounded border-[#FFE8EF] text-[#E24C7C] focus:ring-[#F9739B]"
          />
          <span>Tự động chuyển các đơn khớp mã sang trạng thái "Đang giao" (Shipping)</span>
        </label>

        {/* Parsed Preview Table */}
        {parsedItems.length > 0 && (
          <div className="space-y-2 border border-[#FFE8EF] rounded-2xl p-3.5 bg-white">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#5A3A3A]">
                Tìm thấy {parsedItems.length} dòng (Khớp hợp lệ:{' '}
                <b className="text-green-600">{matchedCount}</b> đơn)
              </span>
            </div>

            <div className="max-h-44 overflow-y-auto border border-[#FFE8EF] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF9F6] border-b border-[#FFE8EF] text-[#7D5C5C] text-[10px] uppercase sticky top-0">
                  <tr>
                    <th className="p-2">Mã đơn</th>
                    <th className="p-2">Khách hàng</th>
                    <th className="p-2">Mã SPX</th>
                    <th className="p-2">Khớp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FFE8EF]">
                  {parsedItems.map((item, idx) => (
                    <tr key={idx} className={item.matched ? 'bg-green-50/30' : 'bg-rose-50/30'}>
                      <td className="p-2 font-mono font-bold text-[#5A3A3A]">{item.orderCode}</td>
                      <td className="p-2 text-[#7D5C5C] truncate max-w-[120px]">
                        {item.customerName || 'Không tìm thấy'}
                      </td>
                      <td className="p-2 font-mono text-[#E24C7C] font-bold">{item.trackingCode}</td>
                      <td className="p-2">
                        {item.matched ? (
                          <span className="text-green-600 font-bold text-[10px]">✓ Hợp lệ</span>
                        ) : (
                          <span className="text-rose-500 font-bold text-[10px]">✕ Sai mã</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#FFE8EF]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#7D5C5C] hover:bg-[#FFE8EF] transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleApplyTracking}
            disabled={isSubmitting || matchedCount === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#E24C7C] hover:bg-[#F9739B] text-white font-title text-xs font-bold shadow-md transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Đang ghi nhận...</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>Cập nhật cho {matchedCount} đơn</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
