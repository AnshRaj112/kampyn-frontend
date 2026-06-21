"use client";

import React, { useState } from "react";
import { signupSubAdmin } from "@/utils/apiUtils";

const TenantStudioSubadminSignup: React.FC = () => {
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await signupSubAdmin(form);
      if (res.data?.success) {
        setMessage({ text: "Sub-administrator registered successfully!", type: "success" });
        setForm({ fullName: "", email: "", phone: "", password: "" });
      } else {
        setMessage({ text: res.data?.message || "Failed to register sub-administrator", type: "error" });
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setMessage({ text: error.response?.data?.message || "An error occurred during registration", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-3">
      <div>
        <input
          type="text"
          placeholder="Full Name"
          required
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#01796f]"
        />
      </div>
      <div>
        <input
          type="email"
          placeholder="Email Address"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#01796f]"
        />
      </div>
      <div>
        <input
          type="text"
          placeholder="Phone Number"
          required
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#01796f]"
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="Password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#01796f]"
        />
      </div>

      {message && (
        <p className={`text-xs ${message.type === "success" ? "text-emerald-500" : "text-red-500"}`}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50"
      >
        {loading ? "Registering..." : "Register Sub-Administrator"}
      </button>
    </form>
  );
};

export default TenantStudioSubadminSignup;
