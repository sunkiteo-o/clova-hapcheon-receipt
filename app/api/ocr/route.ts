import { NextRequest, NextResponse } from "next/server";
import { recognizeReceipt } from "@/lib/clova";

const MAX_BYTES = 4.5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { image, format } = body ?? {};
  if (!image || !format) {
    return NextResponse.json({ error: "이미지 데이터 누락" }, { status: 400 });
  }
  if (Buffer.byteLength(image, "base64") > MAX_BYTES) {
    return NextResponse.json({ error: "이미지가 너무 큽니다 (최대 4.5MB)" }, { status: 413 });
  }
  try {
    const result = await recognizeReceipt(image, format);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "OCR 처리 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
