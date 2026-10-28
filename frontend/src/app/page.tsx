'use client';

import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import NewDrink from '@/components/newdrink';
import { apiRequest } from '@/libs/api';
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

function LoginSuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const showToast = searchParams.get('loginSuccess') === 'true';

  useEffect(() => {
    // Chỉ xử lý khi vừa đăng nhập thành công và được chuyển về Home.
    if (!showToast) return;

    // Gọi API lấy thông tin người dùng mới nhất từ backend.
    const fetchProfile = async () => {
      try {
        const data = await apiRequest('/auth/me');
        const name = data.username ?? data.name;
        if (typeof name === 'string') {
          setUserName(name);
        }
      } catch {
        const localUser = localStorage.getItem('user');
        if (localUser) {
          try {
            const parsed: unknown = JSON.parse(localUser);
            if (parsed && typeof parsed === 'object') {
              const cached = parsed as { username?: unknown; name?: unknown };
              const name = cached.username ?? cached.name;
              if (typeof name === 'string') setUserName(name);
            }
          } catch {
            // Bỏ qua cache lỗi định dạng; toast vẫn hiển thị bình thường.
          }
        }
      }
    };

    void fetchProfile();

    // Tự động đóng thông báo sau 4 giây bằng cách xóa query param.
    const timer = setTimeout(() => {
      router.replace('/');
    }, 4000);

    return () => clearTimeout(timer);
  }, [showToast, router]);

  if (!showToast) return null;

  return (
    <div className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-[#2B100C] px-5 py-3.5 text-white shadow-2xl transition-all border border-[#ebdcd0]/20 animate-fade-in">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
        ✓
      </span>
      <div className="text-sm font-medium">
        Đăng nhập thành công!{' '}
        {userName && (
          <span className="font-semibold text-[#f0d4b8]">
            Chào mừng {userName} quay trở lại.
          </span>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="w-full bg-[#F2ECE4] overflow-x-clip relative">
      <Suspense fallback={null}>
        <LoginSuccessToast />
      </Suspense>

      {/* SECTION 1: HERO SECTION */}
      <section className="w-full max-w-[1440px] mx-auto px-8 md:px-16 lg:px-24 pt-6 pb-16 min-h-[calc(100vh-100px)] grid grid-cols-1 lg:grid-cols-[4fr_6fr] items-center gap-6 relative">

        {/* CỘT TRÁI */}
        <div className="min-w-0 flex flex-col items-start z-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-[#2B100C] leading-[1.2]">
            <span className="block whitespace-nowrap">Pure Goodness,</span>
            <span className="block whitespace-nowrap">Ready When You Are</span>
          </h1>

          <div className="mt-12 flex flex-col items-start gap-3 w-fit">
            <div className="pl-10 md:pl-20">
              <button className="px-12 md:px-14 py-4 bg-[#2B100C] text-white text-2xl font-bold rounded-full hover:bg-[#3d1812] active:scale-[0.98] transition-all cursor-pointer">
                Get start
              </button>
            </div>

            <div className="flex items-center gap-6 sm:gap-10">
              {categoryIcons.map((icon) => (
                <div
                  key={icon.id}
                  className="w-16 h-16 flex items-center justify-center text-[#2B100C]/80 hover:text-[#2B100C] cursor-pointer transition-transform hover:scale-110 [&>svg]:w-full [&>svg]:h-full"
                  title={icon.alt}
                >
                  {icon.svg}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI */}
        <div className="w-full relative h-[540px] sm:h-[640px] lg:h-[800px] flex items-center justify-center">
          <Image
            src="/imghome/home3.png"
            alt="Awaken Your Senses With Every Sip - Craft Coffee"
            fill
            priority
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-contain object-center drop-shadow-[0_25px_35px_rgba(43,16,12,0.2)] lg:translate-x-10"
          />
        </div>
      </section>

      {/* SECTION 2: NEW DRINK SECTION */}
      <NewDrink />
    </div>
  );
}
