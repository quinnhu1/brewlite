"use client";
import { useState } from "react";

const tabs = ["Account", "Order Tracking", "Order History"] as const;

export default function AccountPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Account");

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-6 py-10 md:grid-cols-[280px_1fr]">
      {/* Sidebar */}
      <aside className="rounded-lg border border-[#2b140e] p-4">
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 rounded-full bg-white" />
          <div className="text-sm">
            <p>user1</p>
            <p>point: 86</p>
            <p>gold member</p>
          </div>
        </div>

        <nav className="mt-8 flex flex-col gap-3">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-2 text-left font-semibold ${
                tab === t ? "bg-[#2b140e] text-white" : ""
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
            {/* dùng lại AuthInput hoặc input bo tròn: Name, Phone number, Email, Password */}
            <div className="mt-8 flex justify-between">
              <button className="rounded-full bg-[#6b4a35] px-8 py-2 text-white">Save</button>
              <button className="rounded-full bg-[#6b4a35] px-8 py-2 text-white">Log out</button>
            </div>
          </>
        )}
        {tab === "Order Tracking" && <p>Order Tracking...</p>}
        {tab === "Order History" && <p>Order History...</p>}
      </section>
    </main>
  );
}