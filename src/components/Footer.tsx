'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, MapPin, ShieldCheck, RefreshCw, Phone, Mail } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

export function Footer() {
  const { shopInfo, shipping } = useSettings();

  const shopName = shopInfo.name || 'chocomino shop';
  const description =
    shopInfo.description ||
    'Tiệm đồ chơi squishy mềm mịn, bồng bềnh, chậm tăng chuẩn xịn. Mang lại niềm vui và cảm giác thư giãn cho bạn mỗi ngày!';
  const address =
    shopInfo.address || 'Đ. Số 2/38/32 Bình Đường 1, Khu Phố, Dĩ An, TP. Hồ Chí Minh';
  const hotline = shopInfo.hotline || shopInfo.phone || '0900000000';
  const cleanPhone = hotline.replace(/[^0-9+]/g, '');

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  return (
    <footer className="mt-auto border-t border-[#FFE8EF] bg-white/70 py-10 px-4 text-sm text-[#5A3A3A]">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Shop info */}
          <div className="space-y-3">
            <h3 className="font-title text-xl font-bold text-[#F9739B]">{shopName}</h3>
            <p className="text-xs leading-relaxed text-[#7D5C5C]">{description}</p>
            <div className="space-y-1.5 pt-1 text-xs text-[#7D5C5C]">
              <div className="flex items-start gap-1.5">
                <MapPin size={14} className="shrink-0 mt-0.5 text-[#F9739B]" />
                <span>{address}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone size={14} className="shrink-0 text-[#F9739B]" />
                <a
                  href={`tel:${cleanPhone}`}
                  className="font-medium hover:text-[#E24C7C] transition-colors"
                >
                  Hotline: {hotline}
                </a>
              </div>
              {shopInfo.email && (
                <div className="flex items-center gap-1.5">
                  <Mail size={14} className="shrink-0 text-[#F9739B]" />
                  <a
                    href={`mailto:${shopInfo.email}`}
                    className="hover:text-[#E24C7C] transition-colors"
                  >
                    {shopInfo.email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Quick policies */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-[#5A3A3A]">Chính sách & Hỗ trợ</h4>
            <ul className="space-y-2 text-xs text-[#7D5C5C]">
              <li>
                <Link
                  href="/chinh-sach"
                  className="flex items-center gap-1.5 hover:text-[#F9739B] transition-colors"
                >
                  <RefreshCw size={12} className="text-[#9ADFC8]" />
                  <span>Đổi trả 3 ngày (kèm video khui)</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/chinh-sach"
                  className="flex items-center gap-1.5 hover:text-[#F9739B] transition-colors"
                >
                  <ShieldCheck size={12} className="text-[#9ADFC8]" />
                  <span>Bảo mật dữ liệu sau 90 ngày</span>
                </Link>
              </li>
              <li>
                <Link href="/tra-cuu" className="hover:text-[#F9739B] transition-colors">
                  Tra cứu tình trạng đơn hàng
                </Link>
              </li>
            </ul>
          </div>

          {/* Shipping commitment */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-[#5A3A3A]">Giao hàng toàn quốc</h4>
            <div className="bg-[#FFE8EF]/60 p-3 rounded-2xl space-y-1.5 text-xs">
              <div className="flex justify-between font-medium">
                <span>TP. Hồ Chí Minh:</span>
                <span className="font-bold text-[#E24C7C]">
                  {formatPrice(shipping.ship_hcm || 18000)}
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Tỉnh / Thành khác:</span>
                <span className="font-bold text-[#E24C7C]">
                  {formatPrice(shipping.ship_other || 22000)}
                </span>
              </div>
              <p className="text-[10px] text-[#A39A9A] pt-1">
                Vận chuyển hỏa tốc an toàn qua đối tác SPX Express
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#FFE8EF] flex flex-col md:flex-row items-center justify-between text-xs text-[#A39A9A] gap-2">
          <p>© 2026 {shopName}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/login"
              className="hover:text-[#F9739B] transition-colors text-[11px]"
            >
              🔒 Quản trị viên
            </Link>
            <p className="flex items-center gap-1">
              Made with <Heart size={12} className="text-[#F9739B] fill-[#F9739B]" /> for squishy lovers
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
