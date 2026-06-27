"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { JANGBU_TABS, JEUNGBING_TABS, TabType } from "@/lib/config";

const JANGBU_URL = process.env.NEXT_PUBLIC_SHEET_URL;
const JEUNGBING_URL = process.env.NEXT_PUBLIC_JEUNGBING_URL;

function DoneContent() {
  const params = useSearchParams();
  const router = useRouter();

  const no = params.get("no");
  const tab = params.get("tab") as TabType | null;
  const 항목 = params.get("항목") ?? "";
  const 금액 = params.get("금액") ?? "0";

  if (!no || !tab) {
    return (
      <div className="min-h-screen bg-tint-50 flex items-center justify-center px-4">
        <p className="text-muted text-sm">잘못된 접근입니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tint-50 flex items-start justify-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-105 bg-bg border border-border-200 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden">

        {/* 완료 영역 (끝난 일) */}
        <div className="px-8 py-11 text-center">
          {/* 체크 배지 */}
          <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-8 w-8 text-green-600"
              aria-hidden="true"
            >
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <p className="text-[14px] font-semibold tracking-wide text-muted mb-2">
            장부 시트 저장 완료 ☝️
          </p>
          <h1 className="text-lg font-bold leading-snug text-ink mb-6">
            {JANGBU_TABS[tab]}
          </h1>

          {/* 저장 항목 요약 카드 */}
          <div className="rounded-xl bg-tint-50 border border-border-200 px-5 py-4 text-left">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] text-muted">
                No.{no} · {항목 || tab}
              </span>
              <span className="text-[15px] font-bold text-ink whitespace-nowrap">
                {Number(금액).toLocaleString()}원
              </span>
            </div>
          </div>

          {/* 보조 액션: 장부 확인 */}
          <a
            href={JANGBU_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center justify-center gap-1 text-[13px] font-semibold text-primary-600 no-underline hover:text-primary-700"
          >
            장부 시트에서 확인하기 🔗
          </a>
        </div>

        {/* 구분선 */}
        <div className="border-t border-dashed border-border-200" />

        {/* 다음 행동 영역 (할 일) */}
        <div className="px-8 pt-8 pb-10">
          <p className="text-[14px] font-semibold tracking-wide text-primary-600 text-center mb-5">
            다음 단계 ✌️
          </p>
          <p className="text-[15px] leading-relaxed text-ink text-center mb-10">
            증빙 시트{" "}
            <span className="font-semibold">[{JEUNGBING_TABS[tab]}]</span>에<br />
            <strong className="text-primary-700">No.{no}</strong> 영수증 사진을
            첨부해주세요
          </p>

          <div className="flex flex-col gap-3">
            <a
              href={JEUNGBING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block py-3.5 px-6 bg-primary-600 hover:bg-primary-700 text-white text-center rounded-xl text-[15px] font-bold no-underline transition-colors"
            >
              증빙 시트 바로가기  🔗
            </a>
            <button
              onClick={() => router.push("/")}
              className="py-3.5 px-6 bg-bg text-primary-600 border border-border-200 hover:bg-tint-50 rounded-xl text-[15px] font-bold cursor-pointer transition-colors"
            >
              홈으로
            </button>
          </div>
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