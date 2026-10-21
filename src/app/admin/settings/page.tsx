'use client';

import React, { useState } from 'react';
import { AdminNav } from '@/components/AdminNav';
import { Settings, Save, CheckCircle2, Truck, Store, CreditCard } from 'lucide-react';

export default function AdminSettingsPage() {
  const [shopName, setShopName] = useState('chocomino');
  const [shopPhone, setShopPhone] = useState('0900000000');
  const [pickupAddress, setPickupAddress] = useState(
    'Đ. Số 2/38/32 Bình Đường 1, Khu Phố, Dĩ An, Hồ Chí Minh, Việt Nam'
  );

  const [shipHcm, setShipHcm] = useState(18000);
  const [shipOther, setShipOther] = useState(22000);

  const [spxWeight, setSpxWeight] = useState(0.2);
  const [spxPayer, setSpxPayer] = useState('Người gửi trả');

  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F6] text-[#5A3A3A]">
      <AdminNav />

      <main className="max-w-4xl w-full mx-auto p-4 md:p-8 space-y-6">
        <div>
          <h1 className="font-title text-2xl md:text-3xl font-extrabold text-[#5A3A3A] flex items-center gap-2">
            <Settings className="text-[#F9739B]" size={28} /> Cài đặt Cửa hàng & Vận hành
          </h1>
          <p className="text-xs text-[#7D5C5C]">
            Tùy chỉnh thông tin cửa hàng, biểu phí ship và các thông số xuất đơn SPX Express mặc định.
          </p>
        </div>

        {saved && (
          <div className="p-4 rounded-2xl bg-[#FFE8EF] border border-[#F9739B]/30 text-xs font-bold text-[#E24C7C] flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 size={16} />
            <span>Đã lưu cài đặt cấu hình thành công!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* 1. Shop Info */}
          <div className="bg-white rounded-3xl border border-[#FFE8EF] p-5 space-y-4 shadow-xs">
            <h2 className="font-title text-base font-bold text-[#5A3A3A] flex items-center gap-2">
              <Store size={18} className="text-[#F9739B]" /> Thông tin Cửa hàng
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#7D5C5C]">Tên Shop</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs text-[#5A3A3A]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#7D5C5C]">Số điện thoại liên hệ</label>
                <input
                  type="text"
                  value={shopPhone}
                  onChange={(e) => setShopPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs text-[#5A3A3A]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#7D5C5C]">Địa chỉ lấy hàng SPX Express</label>
              <input
                type="text"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs text-[#5A3A3A]"
              />
            </div>
          </div>

          {/* 2. Shipping Fees */}
          <div className="bg-white rounded-3xl border border-[#FFE8EF] p-5 space-y-4 shadow-xs">
            <h2 className="font-title text-base font-bold text-[#5A3A3A] flex items-center gap-2">
              <Truck size={18} className="text-[#F9739B]" /> Biểu phí Vận chuyển SPX
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#7D5C5C]">
                  Khu vực TP. Hồ Chí Minh mới (168 phường/xã)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    value={shipHcm}
                    onChange={(e) => setShipHcm(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs text-[#5A3A3A]"
                  />
                  <span className="absolute right-4 text-xs text-[#A39A9A]">VNĐ</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#7D5C5C]">
                  Tỉnh / Thành phố khác toàn quốc
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    value={shipOther}
                    onChange={(e) => setShipOther(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs text-[#5A3A3A]"
                  />
                  <span className="absolute right-4 text-xs text-[#A39A9A]">VNĐ</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. SPX Default Parameters */}
          <div className="bg-white rounded-3xl border border-[#FFE8EF] p-5 space-y-4 shadow-xs">
            <h2 className="font-title text-base font-bold text-[#5A3A3A] flex items-center gap-2">
              <Truck size={18} className="text-[#9ADFC8]" /> Cấu hình File Excel SPX Mặc định
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#7D5C5C]">Trọng lượng mặc định mỗi món (kg)</label>
                <input
                  type="number"
                  step="0.05"
                  value={spxWeight}
                  onChange={(e) => setSpxWeight(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs text-[#5A3A3A]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#7D5C5C]">Hình thức thanh toán cước SPX</label>
                <select
                  value={spxPayer}
                  onChange={(e) => setSpxPayer(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs text-[#5A3A3A] bg-white font-bold"
                >
                  <option value="Người gửi trả">Người gửi trả (Shop thanh toán với SPX)</option>
                  <option value="Người nhận trả">Người nhận trả</option>
                </select>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FFF9F6] border border-[#FFE8EF] text-[11px] text-[#7D5C5C] space-y-1">
              <p className="font-bold text-[#5A3A3A]">Các cờ bắt buộc của SPX đã được cố định theo quyết định D25:</p>
              <p>• Giao hàng một phần: <b>N</b> | Cho phép thử hàng: <b>N</b> | Cho xem hàng: <b>N</b> | Bưu gửi giá trị cao: <b>N</b></p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#F9739B] text-white font-title text-sm font-bold shadow-md hover:bg-[#E24C7C] transition-all"
            >
              <Save size={16} /> Lưu cấu hình
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
