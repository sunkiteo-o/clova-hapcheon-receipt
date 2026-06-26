export interface OcrResult {
  날짜: string;
  상호: string;
  금액: string;
  신뢰도: { 날짜: number; 상호: number; 금액: number };
}

export async function recognizeReceipt(imageBase64: string, format: string): Promise<OcrResult> {
  const invokeUrl = process.env.CLOVA_INVOKE_URL;
  const secret = process.env.CLOVA_SECRET;
  if (!invokeUrl || !secret) throw new Error("CLOVA 환경변수 누락");

  const res = await fetch(invokeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-OCR-SECRET": secret,
    },
    body: JSON.stringify({
      version: "V2",
      requestId: `req-${Date.now()}`,
      timestamp: Date.now(),
      images: [{ format, name: "receipt", data: imageBase64 }],
    }),
  });

  if (!res.ok) throw new Error(`CLOVA 오류: ${res.status}`);

  const json = await res.json();
  const result = json.images?.[0]?.receipt?.result;
  if (!result) throw new Error("영수증 인식 실패");

  const storeText: string = result.storeInfo?.name?.text ?? "";
  const storeConf: number = result.storeInfo?.name?.confidenceScore ?? 0;

  const df = result.paymentInfo?.date?.formatted;
  const dateText = df
    ? `${df.year}-${String(df.month).padStart(2, "0")}-${String(df.day).padStart(2, "0")}`
    : "";
  const dateConf: number = result.paymentInfo?.date?.confidenceScore ?? 0;

  const priceRaw: string = result.totalPrice?.price?.formatted?.value ?? "";
  const priceText = priceRaw ? priceRaw.replace(/[^0-9]/g, "") : "";
  const priceConf: number = result.totalPrice?.price?.confidenceScore ?? 0;

  return {
    날짜: dateText,
    상호: storeText,
    금액: priceText,
    신뢰도: { 날짜: dateConf, 상호: storeConf, 금액: priceConf },
  };
}
