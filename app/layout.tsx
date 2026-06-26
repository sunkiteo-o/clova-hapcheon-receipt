import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "영수증 입력",
  description: "취사 영수증 OCR 입력 도구",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/static/pretendard.css"
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
