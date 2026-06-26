"use client";
import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isValidTeam, Team } from "@/lib/config";

const CONF_THRESHOLD = 0.7;

function ReviewForm() {
  const router = useRouter();
  const params = useSearchParams();

  const team = params.get("team") ?? "";
  const initDate = params.get("날짜") ?? "";
  const initStore = params.get("상호") ?? "";
  const initPrice = params.get("금액") ?? "";
  const confDate = parseFloat(params.get("conf_날짜") ?? "1");
  const confStore = parseFloat(params.get("conf_상호") ?? "1");
  const confPrice = parseFloat(params.get("conf_금액") ?? "1");

  const [날짜, set날짜] = useState(initDate);
  const [상호, set상호] = useState(initStore);
  const [금액, set금액] = useState(initPrice);
  const [항목, set항목] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  const warnDate = !!initDate && confDate < CONF_THRESHOLD;
  const warnStore = !!initStore && confStore < CONF_THRESHOLD;
  const warnPrice = !!initPrice && confPrice < CONF_THRESHOLD;

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!isValidTeam(team as Team)) {
      setErrMsg("팀 정보가 없습니다. 처음으로 돌아가세요.");
      setStatus("error");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(날짜)) {
      setErrMsg("날짜 형식이 올바르지 않습니다. YYYY-MM-DD로 입력해 주세요. (예: 2026-06-27)");
      setStatus("error");
      return;
    }
    if (!/^\d+$/.test(금액.trim())) {
      setErrMsg("금액은 숫자만 입력해 주세요. (예: 15000)");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrMsg("");
    const res = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team, 날짜, 상호, 항목, 금액 }),
    });
    if (res.ok) {
      setStatus("ok");
    } else {
      const data = await res.json();
      setErrMsg(data.error ?? "저장 실패");
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <div style={centeredStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
              저장됨
            </p>
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>
              {team} · {상호} · {Number(금액).toLocaleString()}원
            </p>
            <button onClick={() => router.push("/")} style={primaryBtn}>
              새 영수증 입력
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={centeredStyle}>
      <div style={cardStyle}>
        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <button
            onClick={() => router.back()}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 20,
              color: "var(--muted)",
              padding: 0,
            }}
            aria-label="뒤로"
          >
            ←
          </button>
          <span
            style={{
              background: "var(--primary)",
              color: "var(--primary-700)",
              fontWeight: 700,
              fontSize: 13,
              padding: "4px 10px",
              borderRadius: 6,
            }}
          >
            {team}
          </span>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", margin: 0 }}>
            내용 확인 · 수정
          </h2>
        </div>

        <form onSubmit={handleSave}>
          <Field
            label="날짜"
            value={날짜}
            onChange={set날짜}
            warn={warnDate}
            type="date"
            required
          />
          <Field
            label="상호"
            value={상호}
            onChange={set상호}
            warn={warnStore}
            placeholder="상호명"
            required
          />
          <Field
            label="금액"
            value={금액}
            onChange={set금액}
            warn={warnPrice}
            placeholder="숫자만"
            inputMode="numeric"
            required
          />
          <Field
            label="항목"
            value={항목}
            onChange={set항목}
            warn={false}
            placeholder="사용 내용 (예: 식재료 구입)"
            required
          />

          {status === "error" && (
            <p style={{ color: "#d94f4f", fontSize: 13, marginBottom: 12 }}>{errMsg}</p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            style={{
              ...primaryBtn,
              width: "100%",
              marginTop: 8,
              opacity: status === "loading" ? 0.7 : 1,
              cursor: status === "loading" ? "not-allowed" : "pointer",
            }}
          >
            {status === "loading" ? "저장 중..." : "저장"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  warn,
  placeholder,
  inputMode,
  type,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  warn: boolean;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  type?: string;
  required?: boolean;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          fontWeight: 600,
          color: warn ? "var(--warn)" : "var(--muted)",
          marginBottom: 5,
        }}
      >
        {label}
        {warn && <span style={{ fontSize: 11 }}>⚠ 확인 필요</span>}
      </label>
      <input
        type={type ?? "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        required={required}
        style={{
          width: "100%",
          padding: "10px 12px",
          border: `1.5px solid ${warn ? "var(--warn)" : "var(--border-200)"}`,
          borderRadius: 8,
          fontSize: 15,
          color: "var(--ink)",
          background: warn ? "#fffbf0" : "var(--bg)",
          outline: "none",
        }}
      />
    </div>
  );
}

const centeredStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--tint-50)",
  padding: "32px 16px",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
};

const cardStyle: React.CSSProperties = {
  background: "var(--bg)",
  border: "1px solid var(--border-200)",
  borderRadius: 12,
  padding: "28px 24px",
  width: "100%",
  maxWidth: 480,
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
};

const primaryBtn: React.CSSProperties = {
  padding: "12px 24px",
  background: "var(--primary-600)",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
};

export default function ReviewPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "var(--muted)" }}>불러오는 중...</div>}>
      <ReviewForm />
    </Suspense>
  );
}
