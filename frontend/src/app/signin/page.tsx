"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthInput from "@/components/account/input";
import { apiRequest } from "@/libs/api";

export default function SignInPage() {
  // Khởi tạo router để điều hướng trang sau khi đăng nhập thành công
  const router = useRouter(); // Khởi tạo các trạng thái (state) lưu trữ lỗi và trạng thái đang tải (loading)

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Hàm xử lý sự kiện khi người dùng bấm nút Submit form đăng nhập

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // Công đoạn 1: Ngăn chặn trang web bị reload lại mặc định khi submit form
    e.preventDefault();
    setError("");
    setLoading(true); // Bật trạng thái đang tải để khóa nút bấm, tránh click nhiều lần
    // Công đoạn 2: Lấy dữ liệu người dùng nhập vào từ các ô input thông qua FormData

    const formData = new FormData(e.currentTarget);
    const identifier = String(formData.get("identifier") ?? "").trim(); // Email hoặc số điện thoại
    const password = String(formData.get("password") ?? "");

    try {
      // Công đoạn 3: Gửi yêu cầu POST chứa identifier và password lên endpoint /auth/login của Backend
      const res = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });
      //(Tùy chọn) Lưu trữ accessToken nhận được từ server vào localStorage nếu cần xác thực các trang sau
      if (res && res.accessToken) {
        localStorage.setItem("accessToken", res.accessToken);
      }
      //Công đoạn 4a (Thành công): Thông báo và chuyển hướng về trang chủ

      alert("Đăng nhập thành công!");
      router.push("/");
    } catch (err) {
      // Công đoạn 4b (Thất bại): Bắt lỗi từ Backend trả về (ví dụ: Sai tài khoản hoặc mật khẩu)
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Tài khoản hoặc mật khẩu không chính xác",
      );
    } finally {
      // Công đoạn 5: Tắt trạng thái đang tải dù thành công hay thất bại để mở khóa lại nút bấm
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col gap-6 px-6 pt-32 pb-16">
            <h1 className="text-2xl font-bold">Sign in</h1>     {" "}
      {/* Form đăng nhập tài khoản */}     {" "}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Hiển thị dòng thông báo lỗi màu đỏ nếu đăng nhập sai */}   
           {" "}
        {error && <p className="text-sm font-medium text-red-500">{error}</p>} 
             {" "}
        {/* Ô nhập Email hoặc Số điện thoại (Khớp với điều kiện kiểm tra @ ở Backend) */}
               {" "}
        <AuthInput label="Email or phone" name="identifier" type="text" />     
          {/* Ô nhập Mật khẩu */}
                <AuthInput label="Password" name="password" type="password" /> 
             {" "}
        {/* Nút bấm Submit form, bị vô hiệu hóa (disabled) khi đang loading */} 
             {" "}
        <button
          type="submit"
          disabled={loading}
          className="mx-auto mt-2 w-48 rounded-full bg-[#2b140e] py-3 text-lg font-semibold text-white transition disabled:opacity-50"
        >
                    {loading ? "Signing in..." : "Sign in"}       {" "}
        </button>
             {" "}
      </form>
           {" "}
      {/* Đường dẫn phụ chuyển sang trang đăng ký nếu chưa có tài khoản */}     {" "}
      <p className="text-center text-sm">
                Dont have an account?        {" "}
        <Link href="/signup" className="font-bold">
                    Sign up        {" "}
        </Link>
             {" "}
      </p>
         {" "}
    </main>
  );
}
