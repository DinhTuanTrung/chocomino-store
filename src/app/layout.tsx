import type { Metadata } from 'next';
import { Baloo_2, Nunito } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { FloatingContact } from '@/components/FloatingContact';

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
  description: 'Thế giới squishy mềm mịn, bồng bềnh, chậm tăng chuẩn xịn. Mua sắm dễ dàng, không cần tạo tài khoản!',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'chocomino — Shop Squishy Siêu Dễ Thương',
    description: 'Thế giới squishy mềm mịn, bồng bềnh, chậm tăng chuẩn xịn. Giao hàng hỏa tốc toàn quốc SPX!',
    siteName: 'chocomino shop',
    locale: 'vi_VN',
    type: 'website',
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
        <Providers>
          {children}
          <FloatingContact />
        </Providers>
      </body>
    </html>
  );
}
