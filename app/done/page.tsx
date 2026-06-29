"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { TabType } from "@/lib/config";

const JANGBU_URL = process.env.NEXT_PUBLIC_JANGBU_URL;
const JEUNGBING_URL = process.env.NEXT_PUBLIC_JEUNGBING_URL;

function DoneContent() {
  const params = useSearchParams();
  const router = useRouter();

  const no = params.get("no");
  const tab = params.get("tab") as TabType | null;
  const 항목Raw = params.get("항목") ?? "";
  const 금액 = params.get("금액") ?? "0";
  const 지출일자 = params.get("지출일자") ?? "";
  const 비고 = params.get("비고") ?? "";

  const 항목 = tab === "취사" ? "취사비" : 항목Raw;

  if (!no || !tab) {
    return (
      <div className="min-h-screen bg-tint-50 flex items-center justify-center px-4">
        <p className="text-muted text-sm">잘못된 접근입니다.</p>
      </div>
    );
  }

  const rows: { label: string; value: string }[] = [
    { label: "No.", value: no },
    { label: "지출일자", value: 지출일자 },
    { label: "항목", value: 항목 },
    { label: "금액", value: `${Number(금액).toLocaleString()}원` },
    { label: "비고", value: 비고 || "-" },
  ];

  return (
    <div className="min-h-screen bg-tint-50 flex items-start justify-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-96 bg-bg border border-border-200 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.07)] overflow-hidden">

        {/* 상단 완료 */}
        <div className="px-7 pt-9 pb-6 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-green-600" aria-hidden="true">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-[18px] font-bold text-ink">저장 완료!</p>
          <p className="text-[13px] text-muted mt-1">장부·증빙 시트에 기록했어요</p>
        </div>

        {/* 내용 확인 테이블 */}
        <div className="mx-6 mb-6 rounded-xl border border-border-200 overflow-hidden">
          {rows.map((row, i) => (
            <div
              key={row.label}
              className={`flex items-center px-4 py-3 gap-4 ${i !== rows.length - 1 ? "border-b border-border-200" : ""}`}
            >
              <span className="text-[12px] font-semibold text-muted w-14 shrink-0">{row.label}</span>
              <span className="text-[14px] font-medium text-ink">{row.value}</span>
            </div>
          ))}
        </div>

        {/* 시트 링크 (소형) */}
        <div className="flex justify-center gap-4 mb-7">
          {JANGBU_URL && (
            <a href={JANGBU_URL} target="_blank" rel="noopener noreferrer"
              className="text-[12px] font-semibold text-primary-600 no-underline hover:underline">
              장부 🔗
            </a>
          )}
          {JEUNGBING_URL && (
            <a href={JEUNGBING_URL} target="_blank" rel="noopener noreferrer"
              className="text-[12px] font-semibold text-primary-600 no-underline hover:underline">
              증빙 🔗
            </a>
          )}
        </div>

        {/* CTA */}
        <div className="px-6 pb-7">
          <button
            onClick={() => router.push("/")}
            className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white border-none rounded-xl text-[15px] font-bold cursor-pointer transition-colors"
          >
            영수증 또 등록하기
          </button>
        </div>

      </div>
    </div>
  );
}

export default function DonePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-tint-50" />}>
      <DoneContent />
    </Suspense>
  );
}
