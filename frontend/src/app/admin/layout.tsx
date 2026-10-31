'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'Products', href: '/admin/products' },
  { label: 'Order Tracking', href: null }, // chưa làm
  { label: 'Order History', href: null }, // chưa làm
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    // fixed + inset-0: phủ lên navbar và footer của trang khách, trang admin có giao diện riêng
    <div className="fixed inset-0 z-[100] overflow-auto bg-[#F2ECE4] text-[#2B100C]">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-3xl font-bold leading-tight">Craft &amp; Grind</p>
            <p className="text-xs">Every cup tells the story of the bean</p>
          </div>
          <p className="text-lg tracking-wide">ADMIN PORTAL</p>
          {/* TODO: hiển thị tên admin đang đăng nhập (vd "ADMIN: Quynh Nhu") */}
          <p className="text-lg">ADMIN</p>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
          <nav className="rounded-2xl border border-[#6F4E37]/60 p-4 md:min-h-[520px]">
            <ul className="flex flex-col gap-4 pt-4">
              {NAV_ITEMS.map((item) => {
                const active = item.href !== null && pathname.startsWith(item.href);
                const base = 'block rounded-full px-6 py-3 text-lg font-bold';
                if (!item.href) {
                  return (
                    <li key={item.label}>
                      <span className={`${base} cursor-not-allowed opacity-40`} title="Sắp có">
                        {item.label}
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={`${base} transition-colors ${
                        active ? 'bg-[#2B100C] text-[#F2ECE4]' : 'hover:bg-[#6F4E37]/15'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <main className="min-w-0 rounded-2xl border border-[#6F4E37]/60 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}