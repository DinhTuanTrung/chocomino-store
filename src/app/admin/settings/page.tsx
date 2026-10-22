'use client';

import React, { useState, useEffect } from 'react';
import { AdminNav } from '@/components/AdminNav';
import { Settings, Save, CheckCircle2, Truck, Store, CreditCard, Share2, Copy, Check, Bell } from 'lucide-react';

export default function AdminSettingsPage() {
  const [shopName, setShopName] = useState('chocomino');
  const [shopPhone, setShopPhone] = useState('0900000000');
  const [pickupAddress, setPickupAddress] = useState(
    'Đ. Số 2/38/32 Bình Đường 1, Khu Phố, Dĩ An, Hồ Chí Minh, Việt Nam'
  );

  const [shipHcm, setShipHcm] = useState(18000);
  const [shipOther, setShipOther] = useState(22000);
  const [freeShipThreshold, setFreeShipThreshold] = useState<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('chocomino_free_shipping_threshold');
      if (stored) setFreeShipThreshold(Number(stored));
    }
  }, []);

  const [spxWeight, setSpxWeight] = useState(0.2);
  const [spxPayer, setSpxPayer] = useState('Người gửi trả');

  const [saved, setSaved] = useState(false);
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://chocomino-store.vercel.app';

  const handleCopyLink = (url: string, channel: string) => {
    navigator.clipboard.writeText(url);
    setCopiedChannel(channel);
    setTimeout(() => setCopiedChannel(null), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('chocomino_free_shipping_threshold', String(freeShipThreshold));
    }
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

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-[#7D5C5C] flex items-center justify-between">
                  <span>Ngưỡng Miễn Phí Vận Chuyển (Freeship - FR-C-33)</span>
                  <span className="text-[10px] text-[#A39A9A]">Nhập 0đ để tắt freeship</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    value={freeShipThreshold}
                    onChange={(e) => setFreeShipThreshold(Number(e.target.value))}
                    placeholder="VD: 250000 (Đơn từ 250k miễn phí ship toàn quốc)"
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

          {/* 4. Marketing UTM Campaign Links (FR-A-81) */}
          <div className="bg-white rounded-3xl border border-[#FFE8EF] p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="font-title text-base font-bold text-[#5A3A3A] flex items-center gap-2">
                <Share2 size={18} className="text-[#E24C7C]" /> Bộ Link Tiếp Thị Mạng Xã Hội (UTM Marketing)
              </h2>
            </div>
            <p className="text-xs text-[#7D5C5C]">
              Dán các link mẫu này vào phần Tiểu sử (Bio) hoặc bài đăng trên mạng xã hội. Khi khách bấm vào mua hàng, hệ thống sẽ tự động ghi nhận nguồn đơn về đúng kênh:
            </p>

            <div className="divide-y divide-[#FFE8EF] border border-[#FFE8EF] rounded-2xl overflow-hidden text-xs">
              {[
                { channel: 'TikTok Bio', url: `${baseUrl}/?utm_source=tiktok`, color: 'bg-black text-white' },
                { channel: 'Facebook / Messenger', url: `${baseUrl}/?utm_source=facebook`, color: 'bg-blue-600 text-white' },
                { channel: 'Threads Bio', url: `${baseUrl}/?utm_source=threads`, color: 'bg-zinc-800 text-white' },
                { channel: 'Instagram Bio', url: `${baseUrl}/?utm_source=instagram`, color: 'bg-gradient-to-tr from-yellow-500 to-pink-600 text-white' },
                { channel: 'Zalo Chat', url: `${baseUrl}/?utm_source=zalo`, color: 'bg-blue-500 text-white' },
              ].map((item, idx) => (
                <div key={idx} className="p-3 bg-[#FFF9F6]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${item.color}`}>
                      {item.channel}
                    </span>
                    <span className="font-mono text-[11px] text-[#5A3A3A] truncate max-w-xs sm:max-w-md">
                      {item.url}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(item.url, item.channel)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#FFE8EF] hover:border-[#F9739B] text-xs font-bold text-[#5A3A3A] transition-all self-end sm:self-auto"
                  >
                    {copiedChannel === item.channel ? (
                      <>
                        <Check size={13} className="text-green-600" />
                        <span className="text-green-600">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Telegram Bot Notification (FR-A-71) */}
          <div className="bg-white rounded-3xl border border-[#FFE8EF] p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="font-title text-base font-bold text-[#5A3A3A] flex items-center gap-2">
                <Bell size={18} className="text-[#E24C7C]" /> Thông Báo Đơn Hàng Qua Telegram (FR-A-71)
              </h2>
            </div>
            <p className="text-xs text-[#7D5C5C]">
              Hệ thống đã tích hợp sẵn cơ chế gửi thông báo tự động về nhóm chat Telegram của chủ shop khi có: <b>Đơn hàng mới tạo</b> và <b>Yêu cầu đổi trả mới</b>.
            </p>
            <div className="p-4 rounded-2xl bg-[#FFF9F6] border border-[#FFE8EF] text-xs text-[#5A3A3A] space-y-2">
              <p className="font-bold text-[#E24C7C]">Hướng dẫn kích hoạt nhận thông báo Telegram:</p>
              <ol className="list-decimal list-inside space-y-1 text-[#7D5C5C]">
                <li>Mở Telegram, tìm <b>@BotFather</b> và gõ lệnh <code className="bg-white px-1.5 py-0.5 rounded border border-[#FFE8EF] font-mono text-[#E24C7C]">/newbot</code> để tạo Bot riêng cho shop.</li>
                <li>Lưu mã <b>Bot Token</b> (vd: <code className="bg-white px-1.5 py-0.5 rounded border border-[#FFE8EF] font-mono">7123456789:AA...</code>).</li>
                <li>Tạo một nhóm chat Telegram (nhóm nhân viên hoặc riêng bạn), thêm bot vào nhóm và lấy <b>Chat ID</b> (vd: <code className="bg-white px-1.5 py-0.5 rounded border border-[#FFE8EF] font-mono">-100123456789</code>).</li>
                <li>Thêm 2 biến môi trường vào Vercel Settings: <code className="bg-white px-1.5 py-0.5 rounded border border-[#FFE8EF] font-mono font-bold">TELEGRAM_BOT_TOKEN</code> và <code className="bg-white px-1.5 py-0.5 rounded border border-[#FFE8EF] font-mono font-bold">TELEGRAM_CHAT_ID</code>.</li>
              </ol>
              <p className="text-[11px] text-[#A39A9A] italic">
                * Lưu ý: Nếu chưa cấu hình Telegram, hệ thống vẫn tạo đơn hàng bình thường và không phát sinh bất kỳ lỗi nào (theo chuẩn an toàn FR-A-74).
              </p>
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
