import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "file 필드 누락" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "파일 너무 큼 (최대 10MB)" }, { status: 413 });
  }

  const ext = file.type.split("/")[1] ?? "jpg";
  const filename = `receipts/${Date.now()}.${ext}`;

  try {
    const blob = await put(filename, file, { access: "public" });
    return NextResponse.json({ url: blob.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "업로드 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
