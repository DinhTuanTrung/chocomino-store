import type { Metadata } from 'next';
import { Baloo_2, Nunito } from 'next/font/google';
import './globals.css';

const baloo = Baloo_2({
  variable: '--font-baloo',
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
});

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'chocomino — Shop Squishy Siêu Dễ Thương',
  description: 'Thế giới squishy mềm mịn, đáng yêu. Đặt hàng nhanh chóng không cần đăng ký!',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${baloo.variable} ${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#FFF9F6] text-[#5A3A3A] selection:bg-[#FFE8EF] selection:text-[#E24C7C]">
        {children}
      </body>
    </html>
  );
}
