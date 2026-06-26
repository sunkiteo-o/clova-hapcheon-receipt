"use client";
import { useState, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { TEAMS, Team } from "@/lib/config";

const SHEET_URL = process.env.NEXT_PUBLIC_SHEET_URL;

export default function UploadPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleTeamClick(t: Team) {
    setTeam(t);
    setPreview(null);
    setFile(null);
    setError("");
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError("");
  }

  async function handleAnalyze() {
    if (!team || !file) return;
    setLoading(true);
    setError("");
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 4,
        maxWidthOrHeight: 2048,
        useWebWorker: true,
      });
      const base64 = await toBase64(compressed);
      const format = compressed.type.split("/")[1] ?? "jpeg";

      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, format }),
      });

      const params = new URLSearchParams({ team });
      if (res.ok) {
        const data = await res.json();
        if (data.날짜) params.set("날짜", data.날짜);
        if (data.상호) params.set("상호", data.상호);
        if (data.금액) params.set("금액", data.금액);
        if (data.신뢰도) {
          params.set("conf_날짜", String(data.신뢰도.날짜));
          params.set("conf_상호", String(data.신뢰도.상호));
          params.set("conf_금액", String(data.신뢰도.금액));
        }
      }
      // OCR 실패해도 review 페이지로 이동 (빈 필드로)
      router.push(`/review?${params.toString()}`);
    } catch {
      setError("이미지 처리 중 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--tint-50)", padding: "32px 16px" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>

        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>영수증 입력</h1>
          {SHEET_URL && (
            <a
              href={SHEET_URL}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 13,
                color: "var(--primary-600)",
                fontWeight: 600,
                textDecoration: "none",
                border: "1px solid var(--border-200)",
                borderRadius: 8,
                padding: "6px 12px",
                background: "var(--bg)",
              }}
            >
              시트 바로가기 ↗
            </a>
          )}
        </div>

        {/* 팀 선택 */}
        <section style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10, fontWeight: 600 }}>
            팀 선택
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {TEAMS.map((t) => (
              <button
                key={t}
                onClick={() => handleTeamClick(t)}
                style={{
                  padding: "9px 18px",
                  borderRadius: 10,
                  border: "1.5px solid",
                  borderColor: team === t ? "var(--primary-600)" : "var(--border-200)",
                  background: team === t ? "var(--primary)" : "var(--bg)",
                  color: team === t ? "var(--primary-700)" : "var(--ink)",
                  fontWeight: team === t ? 700 : 400,
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* 이미지 업로드 */}
        <section>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10, fontWeight: 600 }}>
            영수증 사진
          </p>
          <div
            onClick={() => team && fileRef.current?.click()}
            style={{
              border: "2px dashed var(--border-200)",
              borderRadius: 12,
              background: "var(--bg)",
              minHeight: 200,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: team ? "pointer" : "not-allowed",
              opacity: team ? 1 : 0.5,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="영수증 미리보기"
                style={{ maxWidth: "100%", maxHeight: 360, objectFit: "contain" }}
              />
            ) : (
              <div style={{ textAlign: "center", color: "var(--muted)" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
                <p style={{ fontSize: 14 }}>
                  {team ? "클릭하여 사진 선택" : "팀을 먼저 선택하세요"}
                </p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </section>

        {/* 오류 */}
        {error && (
          <p style={{ color: "#d94f4f", fontSize: 13, marginTop: 12 }}>{error}</p>
        )}

        {/* 분석 버튼 */}
        {file && team && (
          <button
            onClick={handleAnalyze}
            disabled={loading}
            style={{
              marginTop: 20,
              width: "100%",
              padding: "13px",
              background: loading ? "var(--primary)" : "var(--primary-600)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "분석 중..." : "분석하기"}
          </button>
        )}
      </div>
    </div>
  );
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
