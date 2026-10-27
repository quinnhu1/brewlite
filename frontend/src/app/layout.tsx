import type { Metadata } from 'next';
import { Suspense } from 'react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'Craft & Grind',
  description: 'Every cup tells the story of the bean',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f3ede5] text-[#2c1810] flex flex-col justify-between">
        {/* Navbar xuất hiện cố định ở trên cùng mọi trang */}
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>

        {/* Nội dung thay đổi theo từng trang */}
        <main className="flex-1 flex flex-col">
          {children}
        </main>

        {/* Footer xuất hiện cố định ở dưới cùng mọi trang */}
        <Footer />
      </body>
    </html>
  );
}