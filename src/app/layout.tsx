import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 툴메이커 핸즈온",
  description: "생성형 AI로 나만의 업무·학업·사업 자동화 도구를 만드는 핸즈온 교육 워크스페이스",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
