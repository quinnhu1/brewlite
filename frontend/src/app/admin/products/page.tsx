'use client';

import React, { useEffect, useState } from 'react';
import {
  AdminProduct,
  PRODUCT_CATEGORIES,
  ProductInput,
  createProduct,
  fetchAdminProducts,
  updateProduct,
} from '@/libs/admin-api';

const PLACEHOLDER_IMAGE = '/images/espresso.jpg';

type StatusFilter = '' | 'active' | 'inactive' | 'out_of_stock';

function statusOf(p: AdminProduct) {
  if (!p.isActive) return { label: 'Inactive', className: 'bg-gray-200 text-gray-600' };
  if (p.stock <= 0) return { label: 'Out of stock', className: 'bg-red-100 text-red-700' };
  return { label: 'Active', className: 'bg-green-100 text-green-700' };
}

interface FormState {
  productName: string;
  categories: string;
  basePrice: string;
  stock: string;
  imageUrl: string;
  description: string;
  isActive: boolean;
}

function ProductForm({
  product,
  onClose,
  onSaved,
}: {
  product: AdminProduct | null; // null = thêm mới
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [form, setForm] = useState<FormState>(() => ({
    productName: product?.productName ?? '',
    categories:
      PRODUCT_CATEGORIES.find(
        (c) => c.toLowerCase() === (product?.categories ?? '').trim().toLowerCase(),
      ) ?? PRODUCT_CATEGORIES[0],
    basePrice: product ? String(Number(product.basePrice)) : '',
    stock: product ? String(product.stock) : '0',
    imageUrl: product?.imageUrl ?? '',
    description: product?.description ?? '',
    isActive: product?.isActive ?? true,
  }));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const price = Number(form.basePrice);
    const stock = Number(form.stock);
    if (!form.productName.trim()) {
      setFormError('Nhập tên sản phẩm.');
      return;
    }
    if (form.basePrice === '' || !Number.isInteger(price) || price < 0) {
      setFormError('Giá phải là số nguyên không âm.');
      return;
    }
    if (form.stock === '' || !Number.isInteger(stock) || stock < 0) {
      setFormError('Tồn kho phải là số nguyên không âm.');
      return;
    }

    const input: ProductInput = {
      productName: form.productName.trim(),
      categories: form.categories,
      basePrice: price,
      stock,
      imageUrl: form.imageUrl.trim(),
      description: form.description.trim(),
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      if (product) {
        await updateProduct(product.productId, input);
        onSaved('Đã cập nhật sản phẩm.');
      } else {
        await createProduct(input);
        onSaved('Đã thêm sản phẩm mới.');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không lưu được sản phẩm.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-[#6F4E37]/40 bg-white px-3 py-2 text-sm outline-none focus:border-[#2B100C]';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-[#F2ECE4] p-6 shadow-xl"
      >
        <h2 className="mb-4 text-xl font-bold">{product ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h2>

        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium">
            Tên sản phẩm
            <input
              className={inputClass}
              value={form.productName}
              maxLength={50}
              onChange={(e) => setField('productName', e.target.value)}
            />
          </label>

          <label className="text-sm font-medium">
            Danh mục
            <select
              className={inputClass}
              value={form.categories}
              onChange={(e) => setField('categories', e.target.value)}
            >
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-medium">
              Giá (đ)
              <input
                type="number"
                min={0}
                step={1}
                className={inputClass}
                value={form.basePrice}
                onChange={(e) => setField('basePrice', e.target.value)}
              />
            </label>
            <label className="text-sm font-medium">
              Tồn kho
              <input
                type="number"
                min={0}
                step={1}
                className={inputClass}
                value={form.stock}
                onChange={(e) => setField('stock', e.target.value)}
              />
            </label>
          </div>

          <label className="text-sm font-medium">
            Đường dẫn ảnh (để trống sẽ dùng ảnh tạm)
            <input
              className={inputClass}
              placeholder={PLACEHOLDER_IMAGE}
              value={form.imageUrl}
              onChange={(e) => setField('imageUrl', e.target.value)}
            />
          </label>

          <label className="text-sm font-medium">
            Mô tả
            <textarea
              rows={3}
              maxLength={500}
              className={inputClass}
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
            />
          </label>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#2B100C]"
              checked={form.isActive}
              onChange={(e) => setField('isActive', e.target.checked)}
            />
            Đang bán (bỏ chọn để ngừng bán, món sẽ không hiện ở menu của khách)
          </label>
        </div>

        {formError && <p className="mt-4 text-sm text-red-600">{formError}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full border border-[#6F4E37] px-5 py-2 text-sm font-bold hover:bg-[#6F4E37]/10 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[#2B100C] px-6 py-2 text-sm font-bold text-[#F2ECE4] hover:bg-[#3d1812] disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<StatusFilter>('');

  const [editing, setEditing] = useState<AdminProduct | 'new' | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  // Chờ người dùng ngừng gõ 300ms rồi mới tìm, tránh gọi API mỗi phím
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    fetchAdminProducts({ search: debouncedSearch, category, status }, controller.signal)
      .then((data) => {
        setProducts(data);
        setError(null);
      })
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [debouncedSearch, category, status, reloadKey]);

  const handleSaved = (message: string) => {
    setEditing(null);
    setNotice(message);
    setReloadKey((k) => k + 1);
    setTimeout(() => setNotice(null), 3000);
  };

  const controlClass =
    'rounded-lg border border-[#6F4E37]/40 bg-white px-3 py-2 text-sm outline-none focus:border-[#2B100C]';

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="rounded-full bg-[#2B100C] px-5 py-2 text-sm font-bold text-[#F2ECE4] hover:bg-[#3d1812] active:scale-[0.98]"
        >
          + add product
        </button>

        <label className="flex items-center gap-2 text-sm font-bold">
          search:
          <input
            className={controlClass}
            placeholder="Tên sản phẩm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <label className="flex items-center gap-2 text-sm font-bold">
          filter:
          <select className={controlClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Tất cả danh mục</option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className={controlClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
          >
            <option value="">Mọi trạng thái</option>
            <option value="active">Active</option>
            <option value="out_of_stock">Out of stock</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>

      {notice && <p className="mb-3 text-sm font-medium text-green-700">{notice}</p>}

      <div className="overflow-x-auto rounded-2xl border border-[#6F4E37]/60 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[#6F4E37]/60 text-left">
              <th className="px-4 py-3 font-medium">Image</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center animate-pulse">
                  Đang tải...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-red-600">
                  {error}
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  Không có sản phẩm nào.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const st = statusOf(p);
                return (
                  <tr key={p.productId} className="border-b border-[#6F4E37]/20 last:border-0">
                    <td className="px-4 py-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.imageUrl || PLACEHOLDER_IMAGE}
                        alt={p.productName}
                        className="h-12 w-12 rounded-lg object-cover"
                        onError={(e) => {
                          // link ảnh hỏng thì dùng ảnh tạm, onerror = null để không lặp vô hạn
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = PLACEHOLDER_IMAGE;
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{p.productName}</td>
                    <td className="px-4 py-3">{p.categories ?? '—'}</td>
                    <td className="px-4 py-3">{Number(p.basePrice).toLocaleString('vi-VN')}</td>
                    <td className="px-4 py-3">
                      {p.stock}{' '}
                      <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${st.className}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setEditing(p)}
                        className="rounded-full border border-[#6F4E37] px-4 py-1 text-xs font-bold hover:bg-[#6F4E37]/10"
                      >
                        edit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <ProductForm
          // key để form được khởi tạo lại khi đổi sang sản phẩm khác
          key={editing === 'new' ? 'new' : editing.productId}
          product={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}