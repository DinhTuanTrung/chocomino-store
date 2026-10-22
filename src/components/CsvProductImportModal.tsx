'use client';

import React, { useState } from 'react';
import type { Category } from '@/types/database';
import { FileSpreadsheet, Download, Upload, X, Check, AlertCircle, Loader2 } from 'lucide-react';

interface CsvProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSuccess: () => void;
}

interface ParsedVariant {
  name: string;
  sku: string;
  price: number;
  comparePrice: number | null;
  stockQty: number;
  weightKg: number;
  status: 'in_stock' | 'out_of_stock' | 'preorder';
  preorderEta: string | null;
}

interface ParsedProduct {
  name: string;
  categoryName: string;
  description: string;
  isFeatured: boolean;
  imageUrl: string;
  variants: ParsedVariant[];
}

export function CsvProductImportModal({
  isOpen,
  onClose,
  categories,
  onSuccess,
}: CsvProductImportModalProps) {
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  if (!isOpen) return null;

  // 1. Download CSV template with UTF-8 BOM
  const handleDownloadTemplate = () => {
    const headers = [
      'Tên sản phẩm',
      'Danh mục',
      'Mô tả',
      'Sản phẩm nổi bật (1/0)',
      'Link ảnh đại diện',
      'Tên biến thể',
      'Mã SKU',
      'Giá bán',
      'Giá so sánh',
      'Tồn kho ban đầu',
      'Khối lượng kg',
      'Trạng thái (in_stock/preorder)',
      'Dự kiến hàng về (ETA)',
    ];

    const sampleRows = [
      [
        '"Squishy Bánh Mì Nướng Bơ"',
        '"Squishy Bánh Ngọt"',
        '"Squishy bánh mì nướng bơ mềm mịn đàn hồi chậm thơm mùi bơ sữa"',
        '1',
        '"https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop"',
        '"Vàng Bơ Chuẩn"',
        '"BM-BO-01"',
        '85000',
        '95000',
        '20',
        '0.2',
        '"in_stock"',
        '""',
      ],
      [
        '"Squishy Bánh Mì Nướng Bơ"',
        '"Squishy Bánh Ngọt"',
        '"Squishy bánh mì nướng bơ mềm mịn đàn hồi chậm thơm mùi bơ sữa"',
        '1',
        '"https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop"',
        '"Cháy Cạnh Giòn"',
        '"BM-BO-02"',
        '89000',
        '99000',
        '15',
        '0.2',
        '"in_stock"',
        '""',
      ],
      [
        '"Squishy Mèo Béo Bánh Bao"',
        '"Squishy Thú Cưng"',
        '"Mèo tròn vo núng nính bóp cực êm tay xả stress"',
        '0',
        '"https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop"',
        '"Mèo Trắng Sữa"',
        '"MB-TR-01"',
        '69000',
        '79000',
        '25',
        '0.15',
        '"in_stock"',
        '""',
      ],
      [
        '"Squishy Bánh Donut Cầu Vồng (Pre-order)"',
        '"Squishy Bánh Ngọt"',
        '"Bộ sưu tập bánh Donut thỏ ngọc cao cấp sản xuất theo đợt"',
        '1',
        '"https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop"',
        '"Hồng Dâu")',
        '"DN-PRE-01"',
        '119000',
        '149000',
        '50',
        '0.25',
        '"preorder"',
        '"10/11/2026"',
      ],
    ];

    const csvContent =
      '\uFEFF' + [headers.join(','), ...sampleRows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Mau_Nhap_SanPham_Chocomino.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Simple CSV line parser handling quotes
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  // 2. Handle file upload and parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError('');
    setParsedProducts([]);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        if (!text) throw new Error('File rỗng');

        // Split lines
        const lines = text
          .replace(/^\uFEFF/, '') // remove BOM
          .split(/\r?\n/)
          .filter((l) => l.trim().length > 0);

        if (lines.length < 2) {
          throw new Error('File CSV phải chứa ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu');
        }

        const dataLines = lines.slice(1);
        const productMap: Map<string, ParsedProduct> = new Map();

        dataLines.forEach((line, idx) => {
          const cols = parseCSVLine(line);
          if (cols.length < 8) return; // skip malformed lines

          const [
            prodName,
            catName,
            desc,
            featured,
            imgUrl,
            varName,
            sku,
            priceStr,
            comparePriceStr,
            stockStr,
            weightStr,
            statusStr,
            preorderEta,
          ] = cols;

          if (!prodName) return;

          const price = parseInt(priceStr?.replace(/\D/g, '') || '0', 10);
          const comparePrice = comparePriceStr ? parseInt(comparePriceStr.replace(/\D/g, '') || '0', 10) : null;
          const stock = parseInt(stockStr?.replace(/\D/g, '') || '0', 10);
          const weight = parseFloat(weightStr || '0.2') || 0.2;
          const isFeatured = featured === '1' || featured?.toLowerCase() === 'true';
          const status = statusStr === 'preorder' ? 'preorder' : stock === 0 ? 'out_of_stock' : 'in_stock';

          const variant: ParsedVariant = {
            name: varName || 'Mặc định',
            sku: sku || '',
            price,
            comparePrice,
            stockQty: stock,
            weightKg: weight,
            status,
            preorderEta: preorderEta || null,
          };

          const key = prodName.trim().toLowerCase();
          if (productMap.has(key)) {
            productMap.get(key)!.variants.push(variant);
          } else {
            productMap.set(key, {
              name: prodName.trim(),
              categoryName: catName?.trim() || '',
              description: desc?.trim() || '',
              isFeatured,
              imageUrl: imgUrl?.trim() || '',
              variants: [variant],
            });
          }
        });

        const list = Array.from(productMap.values());
        if (list.length === 0) {
          throw new Error('Không phân tích được sản phẩm hợp lệ nào từ file CSV');
        }

        setParsedProducts(list);
      } catch (err: any) {
        setParseError(err.message || 'Lỗi khi đọc file CSV');
      }
    };

    reader.readAsText(file, 'utf-8');
  };

  // 3. Sequential batch import to API
  const handleConfirmImport = async () => {
    if (parsedProducts.length === 0) return;

    setIsImporting(true);
    setImportProgress({ current: 0, total: parsedProducts.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < parsedProducts.length; i++) {
      const prod = parsedProducts[i];
      setImportProgress({ current: i + 1, total: parsedProducts.length });

      // Match category
      let matchedCategoryId: string | null = null;
      if (prod.categoryName) {
        const found = categories.find(
          (c) => c.name.toLowerCase() === prod.categoryName.toLowerCase()
        );
        if (found) matchedCategoryId = found.id;
      }

      try {
        const res = await fetch('/api/admin/products/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: prod.name,
            categoryId: matchedCategoryId,
            description: prod.description || undefined,
            isFeatured: prod.isFeatured,
            imageUrl: prod.imageUrl || undefined,
            variants: prod.variants.map((v) => ({
              name: v.name,
              sku: v.sku || undefined,
              price: v.price,
              comparePrice: v.comparePrice,
              stockQty: v.stockQty,
              weightKg: v.weightKg,
              status: v.status,
              preorderEta: v.preorderEta,
            })),
          }),
        });

        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        failCount++;
      }
    }

    setIsImporting(false);
    alert(
      `Hoàn thành nhập hàng loạt!\n- Thành công: ${successCount} sản phẩm\n${failCount > 0 ? `- Thất bại: ${failCount} sản phẩm\n` : ''}`
    );
    onSuccess();
    onClose();
  };

  const totalVariantsCount = parsedProducts.reduce((sum, p) => sum + p.variants.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#FFE8EF] max-w-3xl w-full p-6 space-y-5 shadow-2xl my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#FFE8EF] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FFE8EF] text-[#E24C7C] flex items-center justify-center font-bold">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="font-title text-lg font-bold text-[#5A3A3A]">
                Nhập Sản Phẩm Hàng Loạt Từ File CSV
              </h2>
              <p className="text-xs text-[#7D5C5C]">
                Tạo nhanh 50–100 sản phẩm squishy cùng danh sách biến thể (FR-A-08)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isImporting}
            className="p-1.5 rounded-full text-[#A39A9A] hover:text-[#5A3A3A] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action: Download Template & Upload Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Download Template Box */}
          <div className="p-4 rounded-2xl bg-[#FFF9F6] border border-[#FFE8EF] space-y-2 flex flex-col justify-between">
            <div>
              <p className="font-bold text-xs text-[#5A3A3A]">Bước 1: Tải file mẫu chuẩn</p>
              <p className="text-[11px] text-[#7D5C5C] mt-0.5">
                File mẫu đã cấu hình sẵn tiếng Việt UTF-8 BOM, gồm các cột Tên, Danh mục, Giá, SKU, Tồn kho và Biến thể.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#FFE8EF] hover:border-[#F9739B] text-xs font-bold text-[#E24C7C] transition-all shadow-xs"
            >
              <Download size={14} />
              <span>Tải file mẫu (CSV)</span>
            </button>
          </div>

          {/* Upload File Box */}
          <div className="p-4 rounded-2xl bg-[#FFF9F6] border border-[#FFE8EF] space-y-2 flex flex-col justify-between">
            <div>
              <p className="font-bold text-xs text-[#5A3A3A]">Bước 2: Chọn file CSV đã điền</p>
              <p className="text-[11px] text-[#7D5C5C] mt-0.5">
                {fileName ? `Đã chọn: ${fileName}` : 'Chọn file CSV lưu từ Excel hoặc Google Sheets.'}
              </p>
            </div>
            <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#5A3A3A] hover:bg-[#3D2525] text-white text-xs font-bold transition-all shadow-xs cursor-pointer">
              <Upload size={14} />
              <span>{fileName ? 'Chọn file khác' : 'Chọn file từ máy tính'}</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                disabled={isImporting}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Error message */}
        {parseError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Preview parsed products */}
        {parsedProducts.length > 0 && (
          <div className="flex-1 overflow-hidden flex flex-col space-y-2 border border-[#FFE8EF] rounded-2xl p-4 bg-white">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#5A3A3A]">
                Xem trước: Tìm thấy <b>{parsedProducts.length}</b> sản phẩm (tổng <b>{totalVariantsCount}</b> biến thể)
              </span>
              <span className="text-[11px] text-[#A39A9A]">
                Các dòng cùng tên sản phẩm sẽ tự gộp thành phân loại
              </span>
            </div>

            <div className="overflow-y-auto flex-1 max-h-60 border border-[#FFE8EF] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF9F6] border-b border-[#FFE8EF] text-[#7D5C5C] text-[10px] uppercase sticky top-0">
                  <tr>
                    <th className="p-2.5">Sản phẩm</th>
                    <th className="p-2.5">Danh mục</th>
                    <th className="p-2.5">Số biến thể</th>
                    <th className="p-2.5">Giá thấp nhất</th>
                    <th className="p-2.5">Tổng tồn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FFE8EF]">
                  {parsedProducts.map((p, idx) => {
                    const minPrice = Math.min(...p.variants.map((v) => v.price));
                    const totalStock = p.variants.reduce((sum, v) => sum + v.stockQty, 0);
                    return (
                      <tr key={idx} className="hover:bg-[#FFF9F6]/50">
                        <td className="p-2.5 font-bold text-[#5A3A3A]">
                          {p.name}
                          {p.isFeatured && (
                            <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-[#FFE8EF] text-[#E24C7C] text-[9px] font-bold">
                              Nổi bật
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-[#7D5C5C]">{p.categoryName || 'Mặc định'}</td>
                        <td className="p-2.5 font-mono">{p.variants.length}</td>
                        <td className="p-2.5 font-bold text-[#E24C7C]">
                          {minPrice.toLocaleString('vi-VN')}đ
                        </td>
                        <td className="p-2.5 font-bold text-[#5A3A3A]">{totalStock} cái</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Progress indicator */}
        {isImporting && (
          <div className="space-y-1.5 p-3 rounded-2xl bg-amber-50 border border-amber-200">
            <div className="flex justify-between text-xs font-bold text-amber-800">
              <span className="flex items-center gap-1.5">
                <Loader2 size={14} className="animate-spin" />
                Đang tạo sản phẩm vào Supabase...
              </span>
              <span>
                {importProgress.current} / {importProgress.total}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-amber-200 overflow-hidden">
              <div
                className="h-full bg-amber-600 transition-all duration-200"
                style={{
                  width: `${(importProgress.current / importProgress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#FFE8EF]">
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#7D5C5C] hover:bg-[#FFE8EF] transition-colors"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={isImporting || parsedProducts.length === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#E24C7C] hover:bg-[#F9739B] text-white font-title text-xs font-bold shadow-md transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isImporting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Đang xử lý ({importProgress.current}/{importProgress.total})</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>Xác nhận nhập {parsedProducts.length} sản phẩm</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
