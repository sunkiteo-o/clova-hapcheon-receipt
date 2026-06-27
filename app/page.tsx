"use client";
import { useState, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { TAB_TYPES, TabType } from "@/lib/config";
import { setPendingImage } from "@/lib/image-store";

const JANGBU_URL = process.env.NEXT_PUBLIC_SHEET_URL;
const JEUNGBING_URL = process.env.NEXT_PUBLIC_JEUNGBING_URL;

type Step = "tab" | "photo";
type LoadingState = "idle" | "compressing" | "uploading" | "ocr" | "done";

export default function UploadPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<TabType | null>(null);
  const [step, setStep] = useState<Step>("tab");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [error, setError] = useState("");

  function handleTabSelect(t: TabType) {
    setTab(t);
    setStep("photo");
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
    if (!tab || !file) return;
    setError("");

    try {
      setLoadingState("compressing");
      const compressed = await imageCompression(file, {
        maxSizeMB: 4,
        maxWidthOrHeight: 2048,
        useWebWorker: true,
        exifOrientation: -1,
      });

      const base64 = await toBase64(compressed);
      const mimeType = compressed.type || "image/jpeg";
      const ext = mimeType.split("/")[1] ?? "jpg";
      const filename = `receipt_${Date.now()}.${ext}`;

      setPendingImage({ base64, mimeType, filename });
      sessionStorage.setItem("review_tab", tab);
      setLoadingState("done");
      router.push(`/review?tab=${encodeURIComponent(tab)}`);
    } catch {
      setError("사진 처리 중 오류가 발생했습니다.");
      setLoadingState("idle");
    }
  }

  function handleManualEntry() {
    if (!tab) return;
    sessionStorage.setItem("review_tab", tab);
    router.push(`/review?tab=${encodeURIComponent(tab)}`);
  }

  const isLoading = loadingState !== "idle" && loadingState !== "done";
  const loadingLabel =
    loadingState === "compressing"
      ? "사진 압축 중..."
      : loadingState === "uploading"
        ? "업로드 중..."
        : loadingState === "ocr"
          ? "OCR 분석 중..."
          : "처리 중...";

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

        {/* Step 1: 탭 선택 */}
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

        {/* Step 2: 사진 업로드 */}
        {step === "photo" && (
          <section>
            <p className="text-xs font-semibold text-muted mb-2">영수증 사진</p>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border-200 rounded-xl bg-bg min-h-45 flex flex-col items-center justify-center cursor-pointer overflow-hidden mb-4"
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="영수증 미리보기"
                  className="max-w-full max-h-85 object-contain"
                />
              ) : (
                <div className="text-center text-muted p-6">
                  <div className="text-4xl mb-2">📷</div>
                  <p className="text-sm">클릭하여 사진 선택</p>
                </div>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {error && (
              <p className="text-error text-[13px] mb-3">{error}</p>
            )}

            <div className="flex flex-col gap-2.5">
              {file && (
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className={`w-full py-3.25 bg-primary-600 text-white border-none rounded-[10px] text-[15px] font-bold transition-opacity ${
                    isLoading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  {isLoading ? loadingLabel : "지출 내역 입력하기"}
                </button>
              )}
              <button
                onClick={handleManualEntry}
                disabled={isLoading}
                className="w-full py-3.25 bg-bg text-ink border-[1.5px] border-border-200 rounded-[10px] text-[15px] font-medium cursor-pointer"
              >
                직접 입력
              </button>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

async function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
