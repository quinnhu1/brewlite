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
    const identifier = formData.get("identifier");
    const username = formData.get("username");
    const password = formData.get("password");

    try {
      // Gửi trực tiếp thông tin đăng ký sang backend NestJS
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: identifier,
          username: username,
          password: password,
        }),
      });

      alert("Đăng ký tài khoản thành công! Hãy đăng nhập nhé.");
      // Chuyển hướng về trang đăng nhập
      router.push("/signin");
    } catch (err: any) {
      setError(err.message || "Đăng ký không thành công, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col gap-6 px-6 pt-32 pb-16">
      <h1 className="text-2xl font-bold">Sign up</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="text-sm font-medium text-red-500">{error}</p>}

        <AuthInput label="Email or phone" name="identifier" />
        <AuthInput label="Username" name="username" />
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