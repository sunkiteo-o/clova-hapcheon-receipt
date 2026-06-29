"use client";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { isValidTabType, TabType } from "@/lib/config";

const INPUT_CLS =
  "block w-full px-3 py-2.5 border-[1.5px] border-border-200 rounded-lg text-base text-ink bg-bg outline-none";

function FormContent() {
  const params = useSearchParams();
  const router = useRouter();

  const tab = params.get("tab") ?? "";
  const imageUrl = params.get("imageUrl") ?? "";

  const [지출일자, set지출일자] = useState("");
  const [항목, set항목] = useState("");
  const [금액, set금액] = useState("");
  const [비고, set비고] = useState("");

  const [items, setItems] = useState<string[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState("");

  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const validTab = isValidTabType(tab) ? (tab as TabType) : null;

  useEffect(() => {
    if (!validTab || validTab === "취사") return;
    setItemsLoading(true);
    fetch(`/api/items?tab=${encodeURIComponent(validTab)}`)
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
  }, [validTab]);

  if (!validTab) {
    return (
      <div className="min-h-screen bg-tint-50 flex items-center justify-center px-4">
        <p className="text-muted text-sm">잘못된 접근입니다.</p>
      </div>
    );
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (validTab === "일반" && !항목) { setErrMsg("항목을 선택해 주세요."); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(지출일자)) { setErrMsg("날짜 형식 오류 (YYYY-MM-DD)"); return; }
    if (!/^\d+$/.test(금액.trim())) { setErrMsg("금액은 숫자만 입력하세요 (예: 15000)"); return; }

    setSaving(true);
    setErrMsg("");

    const res = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tab: validTab, 지출일자, 항목, 금액: 금액.trim(), 비고, imageUrl: imageUrl || undefined }),
    });
    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      const qs = new URLSearchParams({ no: String(data.no), tab: validTab as string, 항목, 금액: 금액.trim() });
      router.push(`/done?${qs.toString()}`);
    } else {
      setErrMsg(data.error ?? "저장 실패");
    }
  }

  return (
    <div className="min-h-screen bg-tint-50 px-4 py-8">
      <div className="max-w-120 mx-auto bg-bg border border-border-200 rounded-xl py-7 px-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">

        {/* 헤더 */}
        <div className="flex items-center gap-2.5 mb-6">
          <button
            onClick={() => router.back()}
            className="bg-transparent border-none cursor-pointer text-[20px] text-muted p-0 leading-none"
            aria-label="뒤로"
          >
            ←
          </button>
          <span className="bg-primary text-primary-700 font-bold text-xs px-2.25 py-0.75 rounded-md">
            {validTab}
          </span>
          <h2 className="text-[17px] font-bold text-ink m-0">내용 입력</h2>
        </div>

        {/* 사진 미리보기 */}
        {imageUrl && (
          <div className="mb-5 rounded-lg overflow-hidden border border-border-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="영수증" className="w-full max-h-52 object-contain block" />
          </div>
        )}

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

          {/* 항목 — 일반 탭만 */}
          {validTab !== "취사" && (
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

      </div>
    </div>
  );
}

export default function FormPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-tint-50" />}>
      <FormContent />
    </Suspense>
  );
}
