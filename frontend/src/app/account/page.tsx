"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/libs/api";

const tabs = ["Account", "Order Tracking", "Order History"] as const;

interface UserProfile {
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  points?: number;
  tier?: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Account");
  
  // State quản lý thông tin người dùng
  const [user, setUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signin");
      return;
    }

    const fetchUserProfile = async () => {
      try {
        // Gọi API backend lấy thông tin người dùng
        const res = await apiRequest("/auth/me");
        const userData = res.user || res;
        setUser(userData);
        setFormData({
          name: userData.name || userData.username || "",
          phone: userData.phone || "",
          email: userData.email || "",
          password: "",
        });
      } catch {
        // Lấy dữ liệu từ localStorage đã lưu lúc đăng nhập
        const cachedUser = localStorage.getItem("user");
        if (cachedUser) {
          try {
            const parsed = JSON.parse(cachedUser);
            setUser(parsed);
            setFormData({
              name: parsed.name || parsed.username || "",
              phone: parsed.phone || "",
              email: parsed.email || "",
              password: "",
            });
          } catch {
            router.push("/signin");
          }
        } else {
          router.push("/signin");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/signin");
  };

  const handleSave = async () => {
    setMessage("");
    setUpdating(true);
    try {
      await apiRequest("/users/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          ...(formData.password ? { password: formData.password } : {}),
        }),
      });

      const updatedUser = { ...user, name: formData.name, phone: formData.phone };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setMessage("Cập nhật thông tin thành công!");
    } catch (err: any) {
      setMessage(err.message || "Cập nhật thất bại, vui lòng thử lại.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center">
        <p className="text-gray-600 font-medium">Đang tải thông tin tài khoản...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-6 py-10 md:grid-cols-[280px_1fr]">
      {/* Sidebar */}
      <aside className="rounded-lg border border-[#2b140e] p-4">
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center font-bold text-xl text-[#2b140e] border border-[#2b140e]/20 shadow-inner">
            {(user?.name || user?.username || "U").charAt(0).toUpperCase()}
          </div>
          <div className="text-sm">
            <p className="font-semibold">{user?.username || user?.name || "Member"}</p>
            <p className="text-gray-600">point: {user?.points ?? 0}</p>
            <p className="text-gray-600 capitalize">{user?.tier || "Bronze member"}</p>
          </div>
        </div>

        <nav className="mt-8 flex flex-col gap-3">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-2 text-left font-semibold transition ${
                tab === t ? "bg-[#2b140e] text-white" : "hover:bg-gray-100"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </aside>

      {/* Nội dung bên phải */}
      <section className="rounded-lg border border-[#2b140e] p-6">
        {tab === "Account" && (
          <>
            <h2 className="mb-4 text-center text-lg font-semibold">Account Details</h2>

            {message && (
              <p className={`mb-4 text-center text-sm font-medium ${message.includes("thành công") ? "text-emerald-700" : "text-red-500"}`}>
                {message}
              </p>
            )}

            {/* Các trường nhập chi tiết tài khoản */}
            <div className="flex flex-col gap-4 max-w-md mx-auto">
              <div>
                <label className="text-xs font-semibold text-gray-600">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your Name"
                  className="w-full rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-[#2b140e] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">Phone number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone number"
                  className="w-full rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-[#2b140e] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  placeholder="Email"
                  className="w-full rounded-full border border-gray-200 bg-gray-100 px-4 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">New Password (để trống nếu không đổi)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-[#2b140e] focus:outline-none"
                />
              </div>
            </div>

            {/* Các nút bấm thao tác */}
            <div className="mt-8 flex justify-between max-w-md mx-auto">
              <button
                type="button"
                onClick={handleSave}
                disabled={updating}
                className="rounded-full bg-[#6b4a35] px-8 py-2 text-white hover:opacity-90 transition disabled:opacity-50"
              >
                {updating ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-[#6b4a35] px-8 py-2 text-white hover:opacity-90 transition"
              >
                Log out
              </button>
            </div>
          </>
        )}
        {tab === "Order Tracking" && <p className="text-gray-600">Order Tracking...</p>}
        {tab === "Order History" && <p className="text-gray-600">Order History...</p>}
      </section>
    </main>
  );
}