"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isValidTabType, TabType } from "@/lib/config";
import { getPendingImage, clearPendingImage } from "@/lib/image-store";

const INPUT_CLS =
  "block w-full px-3 py-2.5 border-[1.5px] border-border-200 rounded-lg text-base text-ink bg-bg outline-none";

function ReviewForm() {
  const router = useRouter();
  const params = useSearchParams();

  const tabParam = params.get("tab") ?? "";
  const tab: TabType | null = isValidTabType(tabParam) ? tabParam : null;

  const [pendingImage] = useState(() => getPendingImage());

  const [driveImageUrl, setDriveImageUrl] = useState("");
  const [driveViewUrl, setDriveViewUrl] = useState("");
  const [지출일자, set지출일자] = useState("");
  const [항목, set항목] = useState("");
  const [금액, set금액] = useState("");
  const [비고, set비고] = useState("");

  const [items, setItems] = useState<string[]>([]);
  const [itemsLoading, setItemsLoading] = useState(tab !== null && tab !== "취사");
  const [itemsError, setItemsError] = useState("");

  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");
  const [savedNo, setSavedNo] = useState<number | null>(null);

  useEffect(() => {
    setDriveImageUrl(sessionStorage.getItem("review_drive_image_url") ?? "");
    setDriveViewUrl(sessionStorage.getItem("review_drive_view_url") ?? "");
  }, []);

  useEffect(() => {
    if (!tab || tab === "취사") return;
    fetch(`/api/items?tab=${encodeURIComponent(tab)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          console.error("[items] API error:", data.error);
          setItemsError(data.error);
        } else {
          console.log("[items] loaded:", data.items);
          setItems(data.items ?? []);
        }
        setItemsLoading(false);
      })
      .catch((e) => {
        console.error("[items] fetch error:", e);
        setItemsError(String(e));
        setItemsLoading(false);
      });
  }, [tab]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tab) {
      setErrMsg("탭 정보 없음. 처음으로 돌아가세요.");
      setStatus("error");
      return;
    }
    if (tab === "일반" && !항목) {
      setErrMsg("항목을 선택해 주세요.");
      setStatus("error");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(지출일자)) {
      setErrMsg("날짜 형식 오류 (YYYY-MM-DD)");
      setStatus("error");
      return;
    }
    if (!/^\d+$/.test(금액.trim())) {
      setErrMsg("금액은 숫자만 입력하세요 (예: 15000)");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrMsg("");

    let finalImageUrl: string | undefined;
    if (pendingImage) {
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: pendingImage.base64,
          mimeType: pendingImage.mimeType,
          filename: pendingImage.filename,
        }),
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || uploadData.error) {
        setErrMsg(`사진 업로드 실패: ${uploadData.error ?? "알 수 없는 오류"}`);
        setStatus("error");
        return;
      }
      finalImageUrl = uploadData.imageUrl as string;
    }

    const res = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tab,
        지출일자,
        항목,
        금액: 금액.trim(),
        비고,
        driveImageUrl: finalImageUrl,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setSavedNo(data.no);
      setStatus("ok");
      clearPendingImage();
      ["review_tab", "review_ocr_날짜", "review_ocr_금액", "review_ocr_비고",
       "review_conf_날짜", "review_conf_금액"].forEach((k) => sessionStorage.removeItem(k));
    } else {
      setErrMsg(data.error ?? "저장 실패");
      setStatus("error");
    }
  }

  // ── 완료 화면 ──
  if (status === "ok") {
    return (
      <div className="min-h-screen bg-tint-50 px-4 py-8">
        <div className="max-w-120 mx-auto bg-bg border border-border-200 rounded-xl py-7 px-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="text-center pt-2 pb-4">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-lg font-bold text-ink mb-1.5">저장 완료</p>
            <p className="text-sm text-muted mb-1">
              No.{savedNo} · {tab}{항목 ? ` · ${항목}` : ""}
            </p>
            <p className="text-sm text-muted mb-6">
              {Number(금액).toLocaleString()}원
              {비고 ? ` · ${비고}` : ""}
            </p>
            <button
              onClick={() => router.push("/")}
              className="py-3 px-6 bg-primary-600 text-white border-none rounded-[10px] text-[15px] font-bold cursor-pointer"
            >
              새 영수증 입력
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 입력 폼 ──
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
            {tab}
          </span>
          <h2 className="text-[17px] font-bold text-ink m-0">
            내용 확인 · 수정
          </h2>
        </div>

        {/* 사진 미리보기 */}
        {(pendingImage || driveImageUrl) && (
          <div className="mb-5 rounded-lg overflow-hidden border border-border-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pendingImage ? `data:${pendingImage.mimeType};base64,${pendingImage.base64}` : driveImageUrl}
              alt="영수증"
              className="w-full max-h-60 object-contain block"
            />
            {driveViewUrl && (
              <a
                href={driveViewUrl}
                target="_blank"
                rel="noreferrer"
                className="block py-1.5 px-3 text-xs text-primary-600 no-underline"
              >
                원본 보기 ↗
              </a>
            )}
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

          {/* 항목 드롭다운 — 일반 탭만 표시 */}
          {tab !== "취사" && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-muted mb-1.25">세부항목</label>
              {itemsLoading ? (
                <div className="px-3 py-[10px] text-muted text-sm">항목 목록 로딩 중…</div>
              ) : itemsError ? (
                <div className="px-3 py-[10px] text-error text-[13px] border-[1.5px] border-error rounded-lg">
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

          {status === "error" && (
            <p className="text-error text-[13px] mb-3">{errMsg}</p>
          )}

          <button
            type="submit"
            disabled={status === "loading" || itemsLoading}
            className={`w-full mt-2 py-3 px-6 bg-primary-600 text-white border-none rounded-[10px] text-[15px] font-bold transition-opacity ${
              status === "loading" ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {status === "loading" ? "저장 중…" : "저장"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="p-10 text-muted">불러오는 중…</div>}>
      <ReviewForm />
    </Suspense>
  );
}
