"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TAB_TYPES, TabType } from "@/lib/config";

const JANGBU_URL = process.env.NEXT_PUBLIC_SHEET_URL;
const JEUNGBING_URL = process.env.NEXT_PUBLIC_JEUNGBING_URL;

const INPUT_CLS =
  "block w-full px-3 py-2.5 border-[1.5px] border-border-200 rounded-lg text-base text-ink bg-bg outline-none";

type Step = "tab" | "form";

export default function Page() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("tab");
  const [tab, setTab] = useState<TabType | null>(null);

  const [지출일자, set지출일자] = useState("");
  const [항목, set항목] = useState("");
  const [금액, set금액] = useState("");
  const [비고, set비고] = useState("");

  const [items, setItems] = useState<string[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState("");

  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    if (!tab || tab === "취사") return;
    fetch(`/api/items?tab=${encodeURIComponent(tab)}`)
      .then((r) => r.json())
      .then((data) => {
        setItems(data.error ? [] : (data.items ?? []));
        if (data.error) setItemsError(data.error);
        setItemsLoading(false);
      })
      .catch((e) => {
        setItemsError(String(e));
        setItemsLoading(false);
      });
  }, [tab]);

  function handleTabSelect(t: TabType) {
    setTab(t);
    set항목("");
    setErrMsg("");
    setItems([]);
    setItemsError("");
    if (t !== "취사") setItemsLoading(true);
    setStep("form");
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tab) return;
    if (tab === "일반" && !항목) { setErrMsg("항목을 선택해 주세요."); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(지출일자)) { setErrMsg("날짜 형식 오류 (YYYY-MM-DD)"); return; }
    if (!/^\d+$/.test(금액.trim())) { setErrMsg("금액은 숫자만 입력하세요 (예: 15000)"); return; }

    setSaving(true);
    setErrMsg("");

    const res = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tab, 지출일자, 항목, 금액: 금액.trim(), 비고 }),
    });
    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      const qs = new URLSearchParams({
        no: String(data.no),
        tab,
        항목,
        금액: 금액.trim(),
      });
      router.push(`/done?${qs.toString()}`);
    } else {
      setErrMsg(data.error ?? "저장 실패");
    }
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
        <section className="mb-6">
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

        {/* 입력 폼 */}
        {step === "form" && tab && (
          <form onSubmit={handleSave}>
            {/* 지출일자 */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-muted mb-1.25">지출일자</label>
              <input
                type="date"
                value={지출일자}
                onChange={(e) => set지출일자(e.target.value)}
                required
                className={INPUT_CLS}
              />
            </div>

            {/* 항목 드롭다운 — 일반 탭만 */}
            {tab !== "취사" && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-muted mb-1.25">세부항목</label>
                {itemsLoading ? (
                  <div className="px-3 py-2.5 text-muted text-sm">항목 목록 로딩 중…</div>
                ) : itemsError ? (
                  <div className="px-3 py-2.5 text-error text-[13px] border-[1.5px] border-error rounded-lg">
                    항목 로드 실패: {itemsError}
                  </div>
                ) : (
                  <select
                    value={항목}
                    onChange={(e) => set항목(e.target.value)}
                    required
                    className={`${INPUT_CLS} appearance-none`}
                  >
                    <option value="">세부항목 선택 ({items.length}개)</option>
                    {items.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* 금액 */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-muted mb-1.25">금액 (원)</label>
              <input
                type="text"
                inputMode="numeric"
                value={금액}
                onChange={(e) => set금액(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="숫자만 입력"
                required
                className={INPUT_CLS}
              />
            </div>

            {/* 비고 */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-muted mb-1.25">비고 (선택)</label>
              <input
                type="text"
                value={비고}
                onChange={(e) => set비고(e.target.value)}
                placeholder="상호명, 메모 등"
                className={INPUT_CLS}
              />
            </div>

            {errMsg && <p className="text-error text-[13px] mb-3">{errMsg}</p>}

            <button
              type="submit"
              disabled={saving || itemsLoading}
              className={`w-full mt-2 py-3 px-6 bg-primary-600 text-white border-none rounded-[10px] text-[15px] font-bold transition-opacity ${
                saving ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {saving ? "저장 중…" : "저장"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
