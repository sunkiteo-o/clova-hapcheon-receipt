import { NextRequest, NextResponse } from "next/server";
import { uploadToDrive } from "@/lib/drive";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { image, mimeType, filename } = body ?? {};

  if (!image || !mimeType) {
    return NextResponse.json({ error: "image, mimeType 필드 필요" }, { status: 400 });
  }

  const buf = Buffer.from(image as string, "base64");
  if (buf.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "파일 너무 큼 (최대 10MB)" }, { status: 413 });
  }

  try {
    const result = await uploadToDrive(buf, mimeType as string, (filename as string) ?? "receipt.jpg");
    return NextResponse.json(result);
  } catch (e) {
    console.error("[/api/upload] Drive 업로드 실패:", e);
    const msg = e instanceof Error ? e.message : "업로드 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
