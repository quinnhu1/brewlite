"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthInput from "@/components/account/input";
import { apiRequest } from "@/libs/api";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      // Gửi đúng các trường mà RegisterDto ở Backend yêu cầu
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, name, phone, password }),
      });

      alert("Đăng ký tài khoản thành công! Hãy đăng nhập nhé.");
      router.push("/signin");
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Đăng ký thất bại, vui lòng kiểm tra lại thông tin",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col gap-6 px-6 pt-32 pb-16">
      <h1 className="text-2xl font-bold">Sign up</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="text-sm font-medium text-red-500">{error}</p>}

        {/* Khớp với trường email trong RegisterDto */}
        <AuthInput label="Email" name="email" type="email" />

        {/* Khớp với trường name trong RegisterDto */}
        <AuthInput label="Full Name" name="name" type="text" />

        {/* Khớp với định dạng phone 10 số bắt đầu bằng 0 ở RegisterDto */}
        <AuthInput label="Phone number (10 digits)" name="phone" type="text" />

        {/* Khớp với trường password tối thiểu 6 ký tự */}
        <AuthInput label="Password" name="password" type="password" />

        <button
          type="submit"
          disabled={loading}
          className="mx-auto mt-2 w-48 rounded-full bg-[#2b140e] py-3 text-lg font-semibold text-white transition disabled:opacity-50"
        >
          {loading ? "Signing up..." : "Sign up"}
        </button>
      </form>

      <p className="text-center text-sm">
        You have an account?{" "}
        <Link href="/signin" className="font-bold">
          Sign in
        </Link>
      </p>
    </main>
  );
}
