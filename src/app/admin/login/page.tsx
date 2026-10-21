'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ Email và Mật khẩu');
      return;
    }

    if (password.length < 10) {
      setErrorMessage('Mật khẩu quản trị phải có ít nhất 10 ký tự');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || 'Email hoặc mật khẩu không chính xác');
        setLoading(false);
        return;
      }

      // Login success -> redirect to Admin Orders
      router.push('/admin/orders');
    } catch (err) {
      setErrorMessage('Lỗi kết nối máy chủ, vui lòng thử lại');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F6] flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 md:p-8 border border-[#FFE8EF] shadow-lg space-y-6 animate-fadeIn">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#E24C7C] text-white mx-auto flex items-center justify-center font-bold shadow-sm">
            <Sparkles size={22} />
          </div>
          <h1 className="font-title text-2xl font-bold text-[#5A3A3A]">
            chocomino <span className="text-xs bg-[#FFE8EF] text-[#E24C7C] px-2 py-0.5 rounded-full">Admin</span>
          </h1>
          <p className="text-xs text-[#7D5C5C]">
            Đăng nhập bảng điều khiển quản lý đơn hàng & sản phẩm
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-[#FFE8EF] border border-[#F9739B]/40 text-xs font-bold text-[#E24C7C] flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#7D5C5C]">Email Quản trị viên</label>
            <div className="relative flex items-center">
              <input
                type="email"
                required
                placeholder="admin@chocomino.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs text-[#5A3A3A]"
              />
              <Mail size={15} className="absolute left-3 text-[#A39A9A]" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-[#7D5C5C]">Mật khẩu</label>
              <span className="text-[10px] text-[#A39A9A]">Tối thiểu 10 ký tự</span>
            </div>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs text-[#5A3A3A]"
              />
              <Lock size={15} className="absolute left-3 text-[#A39A9A]" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-[#A39A9A] hover:text-[#5A3A3A]"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-full bg-[#F9739B] text-white font-title text-sm font-bold shadow-md hover:bg-[#E24C7C] transition-all disabled:bg-[#A39A9A] flex items-center justify-center gap-2"
          >
            {loading ? <span>Đang xác thực...</span> : <><span>Đăng nhập hệ thống</span> <ArrowRight size={15} /></>}
          </button>
        </form>

        {/* Demo Credentials Hint */}
        <div className="p-3.5 rounded-2xl bg-[#FFF9F6] border border-[#FFE8EF] text-[11px] text-[#7D5C5C] space-y-1">
          <p className="font-bold text-[#5A3A3A] flex items-center gap-1">
            <ShieldCheck size={14} className="text-[#9ADFC8]" /> Tài khoản mặc định ban đầu:
          </p>
          <p>• Email: <code className="bg-white px-1.5 py-0.5 rounded border border-[#FFE8EF] font-bold text-[#E24C7C]">admin@chocomino.local</code></p>
          <p>• Mật khẩu: <code className="bg-white px-1.5 py-0.5 rounded border border-[#FFE8EF] font-bold text-[#E24C7C]">Chocomino2026!</code></p>
        </div>

        {/* Back to Home */}
        <div className="text-center pt-2">
          <Link
            href="/"
            className="text-xs font-bold text-[#7D5C5C] hover:text-[#F9739B] transition-colors"
          >
            ← Quay lại trang chủ bán hàng
          </Link>
        </div>
      </div>
    </div>
  );
}
