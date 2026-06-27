"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    setLoading(false);
    if (res.ok) {
      router.replace("/");
    } else {
      const data = await res.json();
      setError(data.error ?? "오류가 발생했습니다.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-tint-50">
      <div className="bg-bg border border-border-200 rounded-xl py-10 px-9 w-85 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <h1 className="text-[20px] font-semibold text-ink mb-6 text-center">
          회계를 부탁해 😎
        </h1>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="비밀번호"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoFocus
            required
            className="w-full px-3.5 py-2.5 border border-border-200 rounded-lg text-base text-ink outline-none mb-3"
          />
          {error && (
            <p className="text-error text-[13px] mb-3">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.75 text-white border-none rounded-lg text-[15px] font-semibold ${
              loading ? "bg-primary cursor-not-allowed" : "bg-primary-600 cursor-pointer"
            }`}
          >
            {loading ? "확인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
