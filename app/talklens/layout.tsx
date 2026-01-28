import React from "react";
import type { Metadata } from "next";
import "./talklens-new.css";
import { Toaster } from "./_components/ui/toaster";

export const metadata: Metadata = {
  title: "ペアトーク相性診断 for LINE",
  description: "LINEのトーク履歴を分析して、二人の関係性を診断します",
  keywords: ["ペアトーク相性診断", "トーク相性診断", "LINE", "トーク分析", "会話分析", "相性診断", "Writter project"],
  authors: [{ name: "株式会社GOLDENBEAM" }],
  creator: "株式会社GOLDENBEAM",
  publisher: "株式会社GOLDENBEAM",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://writter-project.com"),
  alternates: {
    canonical: "/talklens",
  },
  openGraph: {
    title: "ペアトーク相性診断 for LINE",
    description: "LINEのトーク履歴を分析して、二人の関係性を診断します",
    url: "/talklens",
    siteName: "ペアトーク相性診断",
    locale: "ja_JP",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TalkLensLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Yomogi&display=swap" rel="stylesheet" />
      </head>
      {children}
      <Toaster />
    </>
  );
}
