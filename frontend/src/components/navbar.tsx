'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, ShoppingCart, User } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';

export default function Navbar() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const cartCount = useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));

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

  const navLinks = [
    { name: 'HOME', href: '/' },
    { name: 'MENU', href: '/menu' },
    { name: 'ABOUT US', href: '/about' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 bg-transparent transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
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
              aria-label={`Cart, ${cartCount} items`}
              className="relative pb-1 transition-opacity hover:opacity-70"
            >
              <ShoppingCart className="h-4 w-4 stroke-[2] md:h-5 md:w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2B100C] px-1 text-[9px] font-bold text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
              {pathname === '/cart' && <span aria-hidden="true" className="absolute -bottom-1 -left-2 -right-2 h-[2px] bg-[#2B100C]" />}
            </Link>
            <Link
              href="/account"
              aria-label="Account"
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