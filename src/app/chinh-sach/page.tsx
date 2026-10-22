import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  RefreshCw,
  Truck,
  ShieldCheck,
  Video,
  CheckCircle2,
  Clock,
  Ban,
  ArrowRight,
  HeartHandshake,
} from 'lucide-react';

export const metadata = {
  title: 'Chính sách Bán hàng & Đổi trả | chocomino shop',
  description: 'Chính sách đổi trả trong 3 ngày kèm video khui hàng, biểu phí giao hàng SPX Express và cam kết bảo mật thông tin tại chocomino.',
};

export default function PolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F6]">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* Page Hero */}
        <div className="text-center space-y-2">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FFE8EF] text-[#E24C7C]">
            Quy định minh bạch — Quyền lợi khách hàng
          </span>
          <h1 className="font-title text-3xl md:text-4xl font-extrabold text-[#5A3A3A]">
            Chính sách Bán hàng & Dịch vụ 💖
          </h1>
          <p className="text-xs text-[#7D5C5C] max-w-xl mx-auto leading-relaxed">
            Tiệm chocomino luôn nỗ lực để mang lại trải nghiệm mua sắm squishy dễ thương, an tâm và hài lòng nhất cho bạn!
          </p>
        </div>

        {/* 1. Return Policy (D14) */}
        <section className="bg-white rounded-3xl border border-[#FFE8EF] p-6 md:p-8 space-y-4 shadow-xs">
          <div className="flex items-center gap-3 border-b border-[#FFE8EF] pb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#FFE8EF] text-[#E24C7C] flex items-center justify-center shrink-0">
              <RefreshCw size={20} />
            </div>
            <div>
              <h2 className="font-title text-lg font-bold text-[#5A3A3A]">
                1. Chính sách Đổi trả & Hoàn hàng (Chuẩn D14)
              </h2>
              <p className="text-xs text-[#7D5C5C]">
                Áp dụng trong vòng 3 ngày kể từ khi bạn nhận được gói hàng từ SPX Express
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs text-[#5A3A3A] leading-relaxed">
            {/* Unboxing Video Highlight */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                <Video size={18} className="text-amber-600 shrink-0" />
                <span>Yêu cầu bắt buộc: Video khui kiện hàng (Unboxing Video)</span>
              </div>
              <p className="text-amber-800 text-xs">
                Để bảo vệ quyền lợi tối đa cho cả bạn và tiệm, bạn vui lòng quay <b>1 video liền mạch, không cắt ghép chỉnh sửa</b> từ lúc gói hàng còn nguyên vẹn tem niêm phong bưu phẩm SPX Express cho tới khi mở và kiểm tra món squishy bên trong.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2 p-4 rounded-2xl bg-[#FFF9F6] border border-[#FFE8EF]">
                <h3 className="font-bold text-[#E24C7C] flex items-center gap-1.5">
                  <CheckCircle2 size={16} /> Trường hợp tiệm hỗ trợ đổi mới 100%:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-[#7D5C5C] pl-1">
                  <li>Sản phẩm bị lỗi sản xuất (rách bẹp, nứt form, lem màu nặng).</li>
                  <li>Tiệm gửi sai mẫu mã, sai số lượng so với đơn đặt hàng.</li>
                  <li>Kiện hàng bị hư hỏng, dập nát do quá trình vận chuyển của SPX Express.</li>
                </ul>
              </div>

              <div className="space-y-2 p-4 rounded-2xl bg-[#FFF9F6] border border-[#FFE8EF]">
                <h3 className="font-bold text-[#5A3A3A] flex items-center gap-1.5">
                  <HeartHandshake size={16} className="text-[#F9739B]" /> Chi phí vận chuyển đổi hàng:
                </h3>
                <p className="text-[#7D5C5C]">
                  Nếu đúng lỗi thuộc về tiệm hoặc đơn vị vận chuyển, <b>chocomino sẽ chịu 100% chi phí bưu tá SPX lấy hàng và gửi lại đơn mới</b> cho bạn. Bạn không cần phải trả thêm bất kỳ khoản phí nào.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-[#FFE8EF]">
              <span className="text-xs text-[#7D5C5C]">
                Bạn có đơn hàng cần yêu cầu đổi trả?
              </span>
              <Link
                href="/tra-cuu"
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#F9739B] text-white font-title text-xs font-bold hover:bg-[#E24C7C] transition-all shadow-xs"
              >
                <span>Gửi yêu cầu tại trang Tra cứu</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </section>

        {/* 2. Shipping Policy */}
        <section className="bg-white rounded-3xl border border-[#FFE8EF] p-6 md:p-8 space-y-4 shadow-xs">
          <div className="flex items-center gap-3 border-b border-[#FFE8EF] pb-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Truck size={20} />
            </div>
            <div>
              <h2 className="font-title text-lg font-bold text-[#5A3A3A]">
                2. Chính sách Giao hàng & Cước phí SPX Express
              </h2>
              <p className="text-xs text-[#7D5C5C]">
                Đồng hành cùng đối tác vận chuyển hỏa tốc chuyên nghiệp SPX Express
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#FFF9F6] border border-[#FFE8EF] space-y-2">
              <h3 className="font-bold text-[#5A3A3A]">Biểu phí cước vận chuyển chuẩn:</h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-[#FFE8EF]">
                  <span className="text-[#7D5C5C]">Nội thành & Ngoại thành TP.HCM:</span>
                  <span className="font-bold text-[#E24C7C]">18.000đ</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#FFE8EF]">
                  <span className="text-[#7D5C5C]">Các Tỉnh & Thành phố khác toàn quốc:</span>
                  <span className="font-bold text-[#E24C7C]">22.000đ</span>
                </div>
                <div className="flex justify-between py-1 text-emerald-700 font-bold">
                  <span>Miễn phí vận chuyển:</span>
                  <span>Tự động áp dụng khi đạt ngưỡng</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFF9F6] border border-[#FFE8EF] space-y-2">
              <h3 className="font-bold text-[#5A3A3A]">Thời gian nhận hàng dự kiến:</h3>
              <ul className="space-y-1.5 text-[#7D5C5C]">
                <li className="flex items-center gap-2">
                  <Clock size={14} className="text-[#F9739B] shrink-0" />
                  <span><b>TP. Hồ Chí Minh:</b> 1 – 2 ngày làm việc.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock size={14} className="text-[#F9739B] shrink-0" />
                  <span><b>Miền Tây, Miền Trung, Miền Bắc:</b> 2 – 4 ngày làm việc.</span>
                </li>
                <li className="text-[11px] text-[#A39A9A] pt-1">
                  Mã bưu gửi SPX sẽ được cập nhật trên trang Tra cứu để bạn dễ dàng theo dõi trực tiếp lộ trình gói hàng.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. Cancellation Policy (D16) */}
        <section className="bg-white rounded-3xl border border-[#FFE8EF] p-6 md:p-8 space-y-4 shadow-xs">
          <div className="flex items-center gap-3 border-b border-[#FFE8EF] pb-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Ban size={20} />
            </div>
            <div>
              <h2 className="font-title text-lg font-bold text-[#5A3A3A]">
                3. Chính sách Hủy đơn hàng (Quy định D16)
              </h2>
              <p className="text-xs text-[#7D5C5C]">
                Quyền lợi tự hủy đơn linh hoạt cho khách hàng trước khi tiệm chuẩn bị hàng
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-[#5A3A3A] leading-relaxed">
            <p>
              • <b>Đơn hàng mới tạo (chưa thanh toán):</b> Bạn có thể tự thao tác hủy đơn trực tiếp trên trang Tra cứu đơn hàng hoàn toàn miễn phí mà không cần liên hệ tiệm.
            </p>
            <p>
              • <b>Đơn hàng đã thanh toán hoặc đã đóng gói / bàn giao bưu tá:</b> Vui lòng liên hệ ngay với tiệm qua Zalo hoặc Hotline để nhân viên hỗ trợ giữ lại đơn hoặc hoàn tiền nếu bưu tá chưa xuất kho.
            </p>
          </div>
        </section>

        {/* 4. Privacy Commitment (D17) */}
        <section className="bg-white rounded-3xl border border-[#FFE8EF] p-6 md:p-8 space-y-4 shadow-xs">
          <div className="flex items-center gap-3 border-b border-[#FFE8EF] pb-4">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="font-title text-lg font-bold text-[#5A3A3A]">
                4. Cam kết Bảo mật Thông tin Khách hàng (D17)
              </h2>
              <p className="text-xs text-[#7D5C5C]">
                Tự động ẩn danh dữ liệu cá nhân sau 90 ngày để bảo vệ quyền riêng tư tuyệt đối
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-[#7D5C5C] leading-relaxed">
            <p>
              • <b>Không bắt buộc tạo tài khoản:</b> Khách hàng có thể đặt hàng trực tiếp chỉ với Tên và Số điện thoại nhận hàng.
            </p>
            <p>
              • <b>Quy chế xóa vết dữ liệu:</b> Toàn bộ thông tin định danh nhạy cảm (SĐT, địa chỉ chi tiết) sẽ được hệ thống tự động ẩn danh hóa sau <b>90 ngày</b> kể từ khi đơn hàng kết thúc.
            </p>
            <p>
              • Tiệm cam kết <b>không bao giờ chia sẻ</b> thông tin cá nhân của bạn cho bất kỳ đơn vị quảng cáo hoặc bên thứ ba nào ngoài đối tác vận chuyển SPX Express.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
