'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, ShoppingCart, User } from 'lucide-react';

const navLinks = [
  { name: 'HOME', href: '/' },
  { name: 'MENU', href: '/menu' },
  { name: 'ABOUT US', href: '/about' },
];

function NavbarLinkList({ pathname }: { pathname: string | null }) {
  return (
    <nav className="flex items-center space-x-6 text-xs md:text-sm font-semibold tracking-wider text-[#2B100C]">
      {navLinks.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={`relative py-1 transition-all ${
              isActive ? 'font-bold' : 'hover:opacity-70'
            }`}
          >
            {link.name}
            {isActive && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#2B100C] rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function ActiveNavbarLinks() {
  const pathname = usePathname();
  return <NavbarLinkList pathname={pathname} />;
}

export default function Navbar() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 bg-transparent transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {/* Đã giảm py từ py-6 xuống py-3.5 để thanh menu hẹp và thanh thoát hơn */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-3.5 flex items-center justify-between">
        {/* Brand Logo & Slogan */}
        <div className="flex flex-col">
          <Link href="/" className="text-xl md:text-2xl font-black tracking-tight text-[#2B100C] leading-none">
            Craft &amp; Grind
          </Link>
          <span className="text-[11px] text-[#2B100C] font-medium tracking-wide mt-1 opacity-85">
            Every cup tells the story of the bean
          </span>
        </div>

        {/* Links & Action Icons */}
        <div className="flex items-center space-x-6 md:space-x-8">
          <Suspense fallback={<NavbarLinkList pathname={null} />}>
            <ActiveNavbarLinks />
          </Suspense>

          <div className="flex items-center space-x-4 text-[#2B100C]">
            <button
              type="button"
              aria-label="Search"
              className="hover:opacity-70 transition-opacity cursor-pointer"
            >
              <Search className="w-4 h-4 md:w-5 md:h-5 stroke-[2]" />
            </button>
            <Link
              href="/cart"
              aria-label="Cart"
              className="hover:opacity-70 transition-opacity"
            >
              <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 stroke-[2]" />
            </Link>
            <Link
              href="/profile"
              aria-label="Profile"
              className="hover:opacity-70 transition-opacity"
            >
              <User className="w-4 h-4 md:w-5 md:h-5 stroke-[2]" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}