"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthInput from "@/components/account/input";
import { apiRequest } from "@/libs/api";

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("registered") === "1") {
      setNotice("Đăng ký thành công! Hãy đăng nhập bằng email hoặc số điện thoại vừa đăng ký.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const identifier = String(formData.get("identifier") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const res = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });

      // Backend hiện trả về accessToken (camelCase). Hỗ trợ thêm các tên cũ để tương thích.
      const token = res.accessToken ?? res.access_token ?? res.token;
      if (typeof token !== "string" || token.length === 0) {
        throw new Error("Đăng nhập phản hồi thành công nhưng không có token. Vui lòng kiểm tra API backend.");
      }

      localStorage.setItem("token", token);
      if (res.user) localStorage.setItem("user", JSON.stringify(res.user));

      router.replace("/account");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Email/số điện thoại hoặc mật khẩu không chính xác.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col gap-6 px-6 pt-32 pb-16">
      <h1 className="text-2xl font-bold">Sign in</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}

        <AuthInput label="Email or phone" name="identifier" placeholder="Email or phone number" required autoComplete="username" />
        <AuthInput label="Password" name="password" type="password" required autoComplete="current-password" />

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
        <Link href="/signup" className="font-bold">Sign up</Link>
      </p>
    </main>
  );
}
