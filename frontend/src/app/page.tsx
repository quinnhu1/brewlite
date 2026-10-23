'use client';

import React from 'react';
import Image from 'next/image';
import NewDrink from '@/components/newdrink';

const categoryIcons = [
  {
    id: 1,
    alt: 'Takeaway Cup',
    svg: (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" className="w-14 h-14 sm:w-16 sm:h-16 stroke-[1.8]">
        <path d="M18 16h28l-3.5 38a4 4 0 0 1-4 3.6H25.5a4 4 0 0 1-4-3.6L18 16z" />
        <path d="M16 16h32M20 12h24v4H20z" />
        <path d="M22 28h20" strokeDasharray="2 2" />
      </svg>
    ),
  },
  {
    id: 2,
    alt: 'Coffee Beans',
    svg: (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" className="w-14 h-14 sm:w-16 sm:h-16 stroke-[1.8]">
        <ellipse cx="24" cy="34" rx="10" ry="14" transform="rotate(-25 24 34)" />
        <path d="M19 23c4 5 5 15 10 20" />
        <ellipse cx="40" cy="28" rx="9" ry="12" transform="rotate(35 40 28)" />
        <path d="M36 19c2 4 4 12 7 17" />
      </svg>
    ),
  },
  {
    id: 3,
    alt: 'Coffee Cup & Saucer',
    svg: (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" className="w-14 h-14 sm:w-16 sm:h-16 stroke-[1.8]">
        <path d="M14 26h28v12a14 14 0 0 1-14 14A14 14 0 0 1 14 38V26z" />
        <path d="M42 30h4a6 6 0 0 1 0 12h-4" />
        <path d="M8 54h40" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 4,
    alt: 'Espresso Machine',
    svg: (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" className="w-14 h-14 sm:w-16 sm:h-16 stroke-[1.8]">
        <path d="M18 12h24v40H18z" />
        <path d="M42 16h6v12h-6M42 22h4" />
        <rect x="38" y="44" width="10" height="8" rx="1" />
      </svg>
    ),
  },
];

export default function HomePage() {
  return (
    <div className="w-full bg-[#F2ECE4]">
      {/* SECTION 1: HERO SECTION */}
      <section className="w-full max-w-[1440px] mx-auto px-8 md:px-16 pt-10 md:pt-12 pb-16 flex flex-col lg:flex-row items-center justify-between gap-4 relative overflow-visible">
        
        {/* CỘT TRÁI: TIÊU ĐỀ, NÚT VÀ CÁC ICON ĐÃ PHÓNG TO */}
        <div className="w-full lg:w-[45%] flex flex-col items-start space-y-8 z-10">
          <div className="space-y-1">
            <h1 className="text-5xl sm:text-6xl lg:text-[4.8rem] font-bold tracking-tight text-[#2B100C] leading-[1.08]">
              Awaken Your <br />
              Senses With <br />
              Every Sip
            </h1>
          </div>

          {/* Nút Get start to và dịch phải */}
          <div className="pl-6 md:pl-10">
            <button className="px-14 sm:px-16 py-4 sm:py-5 bg-[#2B100C] text-[#F2ECE4] text-xl sm:text-2xl font-extrabold rounded-full shadow-lg hover:bg-[#3d1812] active:scale-[0.98] transition-all cursor-pointer">
              Get start
            </button>
          </div>

          {/* Dãy icon nét vẽ (đã tăng kích thước khung chứa và khoảng cách) */}
          <div className="flex items-center space-x-8 sm:space-x-10 pt-4">
            {categoryIcons.map((icon) => (
              <div
                key={icon.id}
                className="p-2 rounded-2xl flex items-center justify-center text-[#2B100C]/80 hover:bg-black/5 hover:text-[#2B100C] cursor-pointer transition-all transform hover:scale-110"
                title={icon.alt}
              >
                {icon.svg}
              </div>
            ))}
          </div>
        </div>

        {/* CỘT PHẢI: HÌNH ẢNH LY CÀ PHÊ PHÓNG CỰC ĐẠI VÀ ĐẨY LÊN CAO */}
        <div className="w-full lg:w-[55%] flex justify-center lg:justify-center items-center relative mt-6 lg:mt-0">
          {/* Tăng kích thước khung lên tối đa w-[900px] h-[950px] và nhô cao -mt-36 */}
          <div className="relative w-[480px] h-[520px] sm:w-[620px] sm:h-[680px] lg:w-[820px] lg:h-[880px] xl:w-[920px] xl:h-[980px] -mt-16 lg:-mt-36">
            <Image
              src="/home1.png"
              alt="Awaken Your Senses With Every Sip - Craft Coffee"
              fill
              priority
              className="object-contain drop-shadow-[0_30px_45px_rgba(43,16,12,0.22)]"
            />
          </div>
        </div>

      </section>

      {/* SECTION 2: NEW DRINK SECTION */}
      <NewDrink />
    </div>
  );
}
