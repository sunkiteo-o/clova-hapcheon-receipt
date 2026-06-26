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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--tint-50)",
      }}
    >
      <div
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border-200)",
          borderRadius: 12,
          padding: "40px 36px",
          width: 340,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--ink)",
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          영수증 입력 시스템
        </h1>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="비밀번호"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoFocus
            required
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1px solid var(--border-200)",
              borderRadius: 8,
              fontSize: 16,
              color: "var(--ink)",
              outline: "none",
              marginBottom: 12,
            }}
          />
          {error && (
            <p style={{ color: "#d94f4f", fontSize: 13, marginBottom: 12 }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "11px",
              background: loading ? "var(--primary)" : "var(--primary-600)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "확인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
