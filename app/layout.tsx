import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { checkEnvOnStartup } from "@/lib/security/env";

const inter = Inter({ subsets: ["latin"] });

// 起動時の環境変数チェック
if (typeof window === "undefined") {
  checkEnvOnStartup();
}

export const metadata: Metadata = {
  title: "メールくん - メルアポAIエージェント",
  description: "メルアポ用AIエージェント管理システム",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
