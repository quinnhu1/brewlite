"use client"; 

import { useState } from "react"; 
import { useRouter } from "next/navigation";
import Link from "next/link"; 
import AuthInput from "@/components/account/input"; 
import { apiRequest } from "@/libs/api"; 

export default function SignInPage() {
  // Khai báo router và state quản lý
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Hàm xử lý khi ấn nút Sign in
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Lấy dữ liệu trực tiếp từ các trường name="identifier" và name="password" của AuthInput
    const formData = new FormData(e.currentTarget);
    const identifier = formData.get("identifier");
    const password = formData.get("password");

    try {
      // Gửi request sang backend NestJS
      // (Đổi key 'email' nếu DTO backend dùng tên khác như 'identifier' hoặc 'username')
      const res = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: identifier,
          password: password,
        }),
      });

      // Lưu token và thông tin người dùng
      if (res.access_token || res.token) {
        localStorage.setItem("token", res.access_token || res.token);
      }
      if (res.user) {
        localStorage.setItem("user", JSON.stringify(res.user));
      }

      // Chuyển về trang home kèm cờ báo thành công
      router.push("/?loginSuccess=true");
    } catch (err: any) {
      setError(err.message || "Tài khoản hoặc mật khẩu không chính xác");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col gap-6 px-6 pt-32 pb-16">
      <h1 className="text-2xl font-bold">Sign in</h1>

      {/* Gắn onSubmit vào form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Hiển thị thông báo nếu có lỗi từ backend */}
        {error && <p className="text-sm text-red-500">{error}</p>}

        <AuthInput label="Email or phone" name="identifier" />
        <AuthInput label="Password" name="password" type="password" />

        {/* Thêm trạng thái loading cho nút bấm */}
        <button
          type="submit"
          disabled={loading}
          className="mx-auto w-48 rounded-full bg-[#2b140e] py-3 text-lg font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="text-center text-sm">
        Don’t have an account?{" "}
        <Link href="/signup" className="font-bold">
          Sign up
        </Link>
      </p>
    </main>
  );
}