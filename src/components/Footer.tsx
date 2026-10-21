import React from 'react';
import Link from 'next/link';
import { Heart, MapPin, ShieldCheck, RefreshCw } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[#FFE8EF] bg-white/70 py-10 px-4 text-sm text-[#5A3A3A]">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Shop info */}
          <div className="space-y-3">
            <h3 className="font-title text-xl font-bold text-[#F9739B]">chocomino shop</h3>
            <p className="text-xs leading-relaxed text-[#7D5C5C]">
              Tiệm đồ chơi squishy mềm mịn, bồng bềnh, chậm tăng chuẩn xịn. Mang lại niềm vui và cảm giác thư giãn cho bạn mỗi ngày!
            </p>
            <div className="flex items-start gap-1.5 text-xs text-[#7D5C5C]">
              <MapPin size={14} className="shrink-0 mt-0.5 text-[#F9739B]" />
              <span>Đ. Số 2/38/32 Bình Đường 1, Khu Phố, Dĩ An, TP. Hồ Chí Minh</span>
            </div>
          </div>

          {/* Quick policies */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-[#5A3A3A]">Chính sách & Hỗ trợ</h4>
            <ul className="space-y-2 text-xs text-[#7D5C5C]">
              <li className="flex items-center gap-1.5">
                <RefreshCw size={12} className="text-[#9ADFC8]" />
                <span>Đổi trả trong 3 ngày (kèm video khui hàng)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-[#9ADFC8]" />
                <span>Bảo mật thông tin khách hàng</span>
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
                <span className="font-bold text-[#E24C7C]">18.000đ</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Tỉnh / Thành khác:</span>
                <span className="font-bold text-[#E24C7C]">22.000đ</span>
              </div>
              <p className="text-[10px] text-[#A39A9A] pt-1">
                Vận chuyển hỏa tốc an toàn qua đối tác SPX Express
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#FFE8EF] flex flex-col md:flex-row items-center justify-between text-xs text-[#A39A9A] gap-2">
          <p>© 2026 chocomino. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart size={12} className="text-[#F9739B] fill-[#F9739B]" /> for squishy lovers
          </p>
        </div>
      </div>
    </footer>
  );
}
