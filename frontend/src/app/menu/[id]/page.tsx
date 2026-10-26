'use client';

import { Suspense } from 'react';
import ProductDetail from '@/components/menu/product-detail';
import { useParams, useRouter } from 'next/navigation';

function ProductDetailPageContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  return (
    <div className="w-full bg-[#F2ECE4] min-h-screen pb-10">
      <ProductDetail
        productId={params.id}
        onBack={() => router.push('/menu')}
      />
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense
      fallback={(
        <div className="w-full bg-[#F2ECE4] min-h-screen pb-10 flex items-center justify-center text-[#6F4E37]">
          Đang tải trang sản phẩm...
        </div>
      )}
    >
      <ProductDetailPageContent />
    </Suspense>
  );
}
