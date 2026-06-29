"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TAB_TYPES, TabType } from "@/lib/config";

const JANGBU_URL = process.env.NEXT_PUBLIC_JANGBU_URL;
const JEUNGBING_URL = process.env.NEXT_PUBLIC_JEUNGBING_URL;

export default function Page() {
  const router = useRouter();
  const [tab, setTab] = useState<TabType | null>(null);

  function handleTabSelect(t: TabType) {
    setTab(t);
    router.push(`/photo?tab=${encodeURIComponent(t)}`);
  }

  return (
    <div className="min-h-screen bg-tint-50 px-4 py-8">
      <div className="max-w-120 mx-auto bg-bg border border-border-200 rounded-xl py-7 px-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">

        {/* 헤더 */}
        <div className="flex justify-between items-center mb-9">
          <h1 className="text-[22px] font-semibold text-ink m-0">
            회계를 부탁해 😎
          </h1>
          <div className="flex gap-1.5">
            {JANGBU_URL && (
              <a href={JANGBU_URL} target="_blank" rel="noreferrer"
                className="text-[13px] text-primary-600 font-semibold no-underline border border-border-200 rounded-lg px-2.5 py-1.25 bg-bg">
                장부 ↗
              </a>
            )}
            {JEUNGBING_URL && (
              <a href={JEUNGBING_URL} target="_blank" rel="noreferrer"
                className="text-[13px] text-primary-600 font-semibold no-underline border border-border-200 rounded-lg px-2.5 py-1.25 bg-bg">
                증빙 ↗
              </a>
            )}
          </div>
        </div>

        {/* 구분 선택 */}
        <section>
          <p className="text-xs font-semibold text-muted mb-2">구분 선택</p>
          <div className="flex gap-2.5">
            {TAB_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => handleTabSelect(t)}
                className={`flex-1 py-3.5 rounded-[10px] border-[1.5px] text-base cursor-pointer transition-colors ${
                  tab === t
                    ? "border-primary-600 bg-primary text-primary-700 font-bold"
                    : "border-border-200 bg-bg text-ink font-normal"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
