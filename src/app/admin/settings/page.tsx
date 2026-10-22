'use client';

import React, { useState, useEffect } from 'react';
import { AdminNav } from '@/components/AdminNav';
import {
  Settings,
  Save,
  CheckCircle2,
  Truck,
  Store,
  CreditCard,
  Share2,
  Copy,
  Check,
  Bell,
  Users,
  UserPlus,
  Ban,
  UserCheck,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [shopName, setShopName] = useState('chocomino');
  const [shopPhone, setShopPhone] = useState('0900000000');
  const [pickupAddress, setPickupAddress] = useState(
    'Đ. Số 2/38/32 Bình Đường 1, Khu Phố, Dĩ An, Hồ Chí Minh, Việt Nam'
  );

  // Bank Account & VietQR Settings (FR-C-41)
  const [bankName, setBankName] = useState('Techcombank');
  const [bankAccount, setBankAccount] = useState('');
  const [accountHolder, setAccountHolder] = useState('NGUYEN VAN TRUNG');
  const [qrTimeoutMinutes, setQrTimeoutMinutes] = useState(15);

  // Shipping Fees
  const [shipHcm, setShipHcm] = useState(18000);
  const [shipOther, setShipOther] = useState(22000);
  const [freeShipThreshold, setFreeShipThreshold] = useState<number>(0);

  // SPX Export Configuration
  const [spxWeight, setSpxWeight] = useState(0.2);
  const [spxPayer, setSpxPayer] = useState('Người gửi trả');

  // Staff Account Management State (FR-A-61)
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'staff' | 'owner'>('staff');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [userMsg, setUserMsg] = useState('');

  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://chocomino-store.vercel.app';

  // 1. Load Settings from Supabase on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json().catch(() => null);
        if (data?.success && data?.settings) {
          const s = data.settings;
          if (s.shop_info) {
            if (s.shop_info.name) setShopName(s.shop_info.name);
            if (s.shop_info.phone) setShopPhone(s.shop_info.phone);
            if (s.shop_info.address) setPickupAddress(s.shop_info.address);
          }
          if (s.shipping) {
            if (s.shipping.ship_hcm !== undefined) setShipHcm(Number(s.shipping.ship_hcm));
            if (s.shipping.ship_other !== undefined) setShipOther(Number(s.shipping.ship_other));
            if (s.shipping.free_ship_threshold !== undefined) {
              setFreeShipThreshold(Number(s.shipping.free_ship_threshold));
            }
          }
          if (s.bank_account) {
            if (s.bank_account.bank_name) setBankName(s.bank_account.bank_name);
            if (s.bank_account.account_number !== undefined && s.bank_account.account_number !== '') {
              setBankAccount(s.bank_account.account_number);
            }
            if (s.bank_account.account_holder) setAccountHolder(s.bank_account.account_holder);
            if (s.bank_account.qr_timeout_minutes) setQrTimeoutMinutes(Number(s.bank_account.qr_timeout_minutes));
          }
          if (s.spx_config) {
            if (s.spx_config.default_weight_kg) setSpxWeight(Number(s.spx_config.default_weight_kg));
            if (s.spx_config.payment_role) setSpxPayer(s.spx_config.payment_role);
          }
        } else if (typeof window !== 'undefined') {
          // Fallback to local storage if API didn't return
          const cached = localStorage.getItem('chocomino_shop_settings');
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (parsed.bank_account?.account_number) setBankAccount(parsed.bank_account.account_number);
              if (parsed.bank_account?.bank_name) setBankName(parsed.bank_account.bank_name);
              if (parsed.bank_account?.account_holder) setAccountHolder(parsed.bank_account.account_holder);
            } catch (e) {}
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải cấu hình:', err);
      }
    }
    loadSettings();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (e) {
      // silent
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleUserActive = async (email: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_active',
          email,
          isActive: !currentActive,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || 'Lỗi khi cập nhật trạng thái');
        return;
      }
      fetchUsers();
    } catch {
      alert('Lỗi kết nối khi cập nhật tài khoản');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingUser(true);
    setUserMsg('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          role: newUserRole,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || 'Không thể tạo tài khoản');
        return;
      }
      setShowAddUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setUserMsg('Đã tạo tài khoản nhân viên thành công!');
      fetchUsers();
    } catch {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleCopyLink = (url: string, channel: string) => {
    navigator.clipboard.writeText(url);
    setCopiedChannel(channel);
    setTimeout(() => setCopiedChannel(null), 2000);
  };

  // 2. Save settings to Supabase
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        shop_info: {
          name: shopName.trim(),
          phone: shopPhone.trim(),
          address: pickupAddress.trim(),
        },
        bank_account: {
          bank_name: bankName,
          account_number: bankAccount.trim(),
          account_holder: accountHolder.trim().toUpperCase(),
          qr_timeout_minutes: qrTimeoutMinutes || 15,
        },
        shipping: {
          ship_hcm: shipHcm,
          ship_other: shipOther,
          free_ship_threshold: freeShipThreshold,
        },
        spx_config: {
          default_weight_kg: spxWeight,
          payment_role: spxPayer,
        },
      };

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Lỗi từ máy chủ khi lưu cấu hình');
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('chocomino_shop_settings', JSON.stringify(payload));
        localStorage.setItem('chocomino_free_shipping_threshold', String(freeShipThreshold));
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Đã có lỗi xảy ra khi lưu cấu hình');
    } finally {
      setIsSaving(false);
    }
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
            Tùy chỉnh thông tin cửa hàng, tài khoản ngân hàng VietQR, biểu phí ship và thông số xuất đơn SPX Express.
          </p>
        </div>

        {saved && (
          <div className="p-4 rounded-2xl bg-[#FFE8EF] border border-[#F9739B]/30 text-xs font-bold text-[#E24C7C] flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 size={16} />
            <span>Đã lưu cài đặt cấu hình thành công vào hệ thống!</span>
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

          {/* 2. Bank Account & VietQR Settings (FR-C-41) */}
          <div className="bg-white rounded-3xl border border-[#FFE8EF] p-5 space-y-4 shadow-xs">
            <h2 className="font-title text-base font-bold text-[#5A3A3A] flex items-center gap-2">
              <CreditCard size={18} className="text-[#E24C7C]" /> Tài khoản Ngân hàng nhận VietQR (SePay)
            </h2>
            <p className="text-xs text-[#7D5C5C]">
              Thông tin tài khoản nhận tiền chuyển khoản tự động. Khách quét mã VietQR sẽ hiển thị đúng số tài khoản này.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#7D5C5C]">Ngân hàng</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs text-[#5A3A3A] bg-white font-medium cursor-pointer"
                >
                  <option value="Techcombank">Techcombank (Ngân hàng Kỹ Thương)</option>
                  <option value="Vietcombank">Vietcombank (Ngân hàng Ngoại Thương)</option>
                  <option value="MBBank">MBBank (Ngân hàng Quân Đội)</option>
                  <option value="ACB">ACB (Ngân hàng Á Châu)</option>
                  <option value="VPBank">VPBank (Ngân hàng Việt Nam Thịnh Vượng)</option>
                  <option value="TPBank">TPBank (Ngân hàng Tiên Phong)</option>
                  <option value="BIDV">BIDV (Ngân hàng Đầu tư & Phát triển)</option>
                  <option value="VietinBank">VietinBank (Ngân hàng Công Thương)</option>
                  <option value="Agribank">Agribank (Ngân hàng Nông nghiệp & PTNT)</option>
                  <option value="Sacombank">Sacombank (Ngân hàng Sài Gòn Thương Tín)</option>
                  <option value="VIB">VIB (Ngân hàng Quốc Tế)</option>
                  <option value="OCB">OCB (Ngân hàng Phương Đông)</option>
                  <option value="SeABank">SeABank (Ngân hàng Đông Nam Á)</option>
                  <option value="MSB">MSB (Ngân hàng Hàng Hải)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#7D5C5C]">Số tài khoản ngân hàng</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="VD: 19036578291012"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs text-[#5A3A3A] font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#7D5C5C]">Tên chủ tài khoản (In hoa không dấu)</label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                  placeholder="VD: NGUYEN VAN TRUNG"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs text-[#5A3A3A] font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#7D5C5C]">Thời gian chờ thanh toán VietQR (Phút)</label>
                <input
                  type="number"
                  value={qrTimeoutMinutes}
                  onChange={(e) => setQrTimeoutMinutes(Number(e.target.value))}
                  min={5}
                  max={60}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs text-[#5A3A3A]"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FFF9F6] border border-[#FFE8EF] text-[11px] text-[#7D5C5C] space-y-1">
              <p className="font-bold text-[#E24C7C]">💡 Lưu ý quan trọng khi đổi tài khoản ngân hàng:</p>
              <p>• Khi bạn bấm lưu cấu hình, mã QR hiển thị cho khách đặt hàng sẽ tự động đổi sang số tài khoản mới này.</p>
              <p>• Đồng thời, bạn cần đảm bảo tài khoản này đã được liên kết trong mục <b>Ngân hàng</b> trên cổng <b><a href="https://my.sepay.vn" target="_blank" rel="noreferrer" className="underline text-[#E24C7C]">my.sepay.vn</a></b> để SePay có thể đọc biến động số dư và tự động duyệt đơn cho shop.</p>
            </div>
          </div>

          {/* 3. Shipping Fees */}
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

          {/* 4. SPX Default Parameters */}
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

          {/* 5. Marketing UTM Campaign Links (FR-A-81) */}
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
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#FFE8EF] hover:border-[#F9739B] text-xs font-bold text-[#5A3A3A] transition-all self-end sm:self-auto cursor-pointer"
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

          {/* 6. Telegram Bot Notification (FR-A-71) */}
          <div className="bg-white rounded-3xl border border-[#FFE8EF] p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="font-title text-base font-bold text-[#5A3A3A] flex items-center gap-2">
                <Bell size={18} className="text-[#E24C7C]" /> Thông Báo Đơn Hàng Qua Telegram (FR-A-71)
              </h2>
            </div>
            <p className="text-xs text-[#7D5C5C]">
              Hệ thống đã tích hợp sẵn cơ chế gửi thông báo tự động về nhóm chat Telegram của chủ shop khi có: <b>Đơn hàng mới tạo</b>, <b>Thanh toán thành công</b> và <b>Yêu cầu đổi trả</b>.
            </p>
            <div className="p-4 rounded-2xl bg-[#FFF9F6] border border-[#FFE8EF] text-xs text-[#5A3A3A] space-y-2">
              <p className="font-bold text-[#E24C7C]">Hướng dẫn kích hoạt nhận thông báo Telegram:</p>
              <ol className="list-decimal list-inside space-y-1 text-[#7D5C5C]">
                <li>Mở Telegram, tìm <b>@BotFather</b> và gõ lệnh <code className="bg-white px-1.5 py-0.5 rounded border border-[#FFE8EF] font-mono text-[#E24C7C]">/newbot</code> để tạo Bot riêng cho shop.</li>
                <li>Lưu mã <b>Bot Token</b> (vd: <code className="bg-white px-1.5 py-0.5 rounded border border-[#FFE8EF] font-mono">7123456789:AA...</code>).</li>
                <li>Tạo một nhóm chat Telegram (nhóm nhân viên hoặc riêng bạn), thêm bot vào nhóm và lấy <b>Chat ID</b> (vd: <code className="bg-white px-1.5 py-0.5 rounded border border-[#FFE8EF] font-mono">-100123456789</code>).</li>
                <li>Thêm 2 biến môi trường vào Vercel Settings: <code className="bg-white px-1.5 py-0.5 rounded border border-[#FFE8EF] font-mono font-bold">TELEGRAM_BOT_TOKEN</code> và <code className="bg-white px-1.5 py-0.5 rounded border border-[#FFE8EF] font-mono font-bold">TELEGRAM_CHAT_ID</code>.</li>
              </ol>
            </div>
          </div>

          {/* 7. Staff & Admin Accounts Management (FR-A-61) */}
          <div className="bg-white rounded-3xl border border-[#FFE8EF] p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="font-title text-base font-bold text-[#5A3A3A] flex items-center gap-2">
                <Users size={18} className="text-[#F9739B]" /> Quản lý Tài khoản Quản trị & Nhân viên (FR-A-61)
              </h2>
              <button
                type="button"
                onClick={() => setShowAddUserModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFE8EF] text-[#E24C7C] font-bold text-xs hover:bg-[#F9739B] hover:text-white transition-all shadow-xs cursor-pointer self-start sm:self-auto"
              >
                <UserPlus size={14} /> Thêm nhân viên mới
              </button>
            </div>
            <p className="text-xs text-[#7D5C5C]">
              Chủ shop có quyền tạo hoặc vô hiệu hóa tài khoản nhân viên. Hệ thống đảm bảo <b>luôn duy trì ít nhất 1 tài khoản Chủ shop</b>.
            </p>

            {userMsg && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 size={15} /> <span>{userMsg}</span>
              </div>
            )}

            <div className="border border-[#FFE8EF] rounded-2xl overflow-hidden divide-y divide-[#FFE8EF] text-xs">
              {users.map((u, i) => (
                <div key={i} className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#5A3A3A]">{u.name}</span>
                      <span
                        className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                          u.role === 'owner' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {u.role === 'owner' ? '👑 Chủ shop' : 'Nhân viên'}
                      </span>
                      {u.is_root && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-[#7D5C5C] block">{u.email}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {u.is_active ? <UserCheck size={12} /> : <Ban size={12} />}
                      {u.is_active ? 'Đang hoạt động' : 'Đã vô hiệu'}
                    </span>

                    {!u.is_root && (
                      <button
                        type="button"
                        onClick={() => handleToggleUserActive(u.email, u.is_active)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          u.is_active
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {u.is_active ? 'Khóa tài khoản' : 'Kích hoạt lại'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add User Modal */}
          {showAddUserModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#FFE8EF] animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[#FFE8EF] pb-3">
                  <h3 className="font-title text-base font-bold text-[#5A3A3A] flex items-center gap-1.5">
                    <UserPlus size={18} className="text-[#F9739B]" /> Thêm tài khoản nhân viên mới
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="p-1 rounded-full text-[#A39A9A] hover:text-[#5A3A3A]"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-[#7D5C5C]">Họ và tên</label>
                    <input
                      type="text"
                      placeholder="VD: Nguyễn Văn B"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#7D5C5C]">Email nhân viên</label>
                    <input
                      type="email"
                      placeholder="VD: staff@chocomino.local"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#7D5C5C]">Vai trò</label>
                    <select
                      value={newUserRole}
                      onChange={(e: any) => setNewUserRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none bg-white font-medium"
                    >
                      <option value="staff">Nhân viên (Xem và xử lý đơn hàng, đóng gói SPX)</option>
                      <option value="owner">Chủ shop (Toàn quyền quản trị)</option>
                    </select>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddUserModal(false)}
                      className="px-4 py-2 rounded-xl font-bold text-[#7D5C5C] hover:bg-[#FFE8EF]"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateUser}
                      disabled={isSubmittingUser || !newUserName || !newUserEmail}
                      className="px-5 py-2 rounded-full bg-[#F9739B] text-white font-title font-bold hover:bg-[#E24C7C] transition-all disabled:bg-[#A39A9A]"
                    >
                      {isSubmittingUser ? 'Đang tạo...' : 'Tạo tài khoản'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#F9739B] text-white font-title text-sm font-bold shadow-md hover:bg-[#E24C7C] transition-all cursor-pointer disabled:opacity-50"
            >
              <Save size={16} /> {isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
