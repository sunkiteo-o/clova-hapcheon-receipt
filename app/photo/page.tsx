"use client";
import { Suspense, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { isValidTabType } from "@/lib/config";

function PhotoContent() {
  const params = useSearchParams();
  const router = useRouter();
  const tab = params.get("tab") ?? "";
  const fileRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  if (!isValidTabType(tab)) {
    return (
      <div className="min-h-screen bg-tint-50 flex items-center justify-center px-4">
        <p className="text-muted text-sm">잘못된 접근입니다.</p>
      </div>
    );
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setErrMsg("");
  }

  async function handleUploadAndNext() {
    if (!file) return;
    setUploading(true);
    setErrMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "업로드 실패");
      const qs = new URLSearchParams({ tab, imageUrl: data.url });
      router.push(`/form?${qs.toString()}`);
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : "업로드 실패");
      setUploading(false);
    }
  }

  function handleSkip() {
    router.push(`/form?tab=${encodeURIComponent(tab)}`);
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
            {tab}
          </span>
          <h2 className="text-[17px] font-bold text-ink m-0">영수증 사진</h2>
        </div>

        {/* 사진 영역 */}
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-border-200 rounded-xl bg-bg min-h-52 flex flex-col items-center justify-center cursor-pointer overflow-hidden mb-5"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="영수증 미리보기" className="max-w-full max-h-80 object-contain" />
          ) : (
            <div className="text-center text-muted p-6">
              <div className="text-5xl mb-3">📷</div>
              <p className="text-sm font-medium">영수증 사진 찍기 또는 선택</p>
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

        {errMsg && <p className="text-error text-[13px] mb-3">{errMsg}</p>}

        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleUploadAndNext}
            disabled={!file || uploading}
            className={`w-full py-3.25 bg-primary-600 text-white border-none rounded-[10px] text-[15px] font-bold transition-opacity ${
              !file || uploading ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {uploading ? "업로드 중…" : "다음"}
          </button>
          <button
            onClick={handleSkip}
            disabled={uploading}
            className="w-full py-3.25 bg-bg text-ink border-[1.5px] border-border-200 rounded-[10px] text-[15px] font-medium cursor-pointer"
          >
            사진 없이 진행
          </button>
        </div>

      </div>
    </div>
  );
}

export default function PhotoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-tint-50" />}>
      <PhotoContent />
    </Suspense>
  );
}
