import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./talklens-new.css";
import { Toaster } from "./_components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ペアトーク履歴診断 for LINE",
  description: "LINEのトーク履歴を分析して、二人の関係性をカンタン診断！",
  keywords: ["ペアトーク履歴診断", "ペアトーク診断", "LINE診断", "トーク履歴分析", "会話分析", "相性診断", "Writter project"],
  authors: [{ name: "株式会社GOLDENBEAM" }],
  creator: "株式会社GOLDENBEAM",
  publisher: "株式会社GOLDENBEAM",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://pairtalk.site"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ペアトーク履歴診断 for LINE",
    description: "LINEのトーク履歴を分析して、二人の関係性を診断します",
    url: "https://pairtalk.site",
    siteName: "ペアトーク履歴診断 for LINE",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: "/talklens/pairtalkOGP.png",
        width: 1200,
        height: 630,
        alt: "ペアトーク履歴診断 for LINE",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ペアトーク履歴診断 for LINE",
    description: "LINEのトーク履歴を分析して、二人の関係性を診断します",
    images: ["/talklens/pairtalkOGP.png"],
  },
  icons: {
    icon: "/talklens/fav.png",
    apple: "/talklens/fav.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "ペアトーク履歴診断 for LINE",
    "description": "LINEのトーク履歴を分析して、二人の関係性をカンタン診断！",
    "url": "https://pairtalk.site",
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "JPY"
    },
    "author": {
      "@type": "Organization",
      "name": "株式会社GOLDENBEAM",
      "url": "https://pairtalk.site"
    },
    "inLanguage": "ja",
    "featureList": [
      "LINEトーク履歴の分析",
      "二人の関係性診断",
      "メッセージ統計の可視化",
      "返信速度の分析",
      "よく使う言葉のランキング"
    ]
  };

  return (
    <html lang="ja">
      <head>
        <meta name="google-site-verification" content="i9njDcabqKr4_U4SunD--Dp4f7UDpV2dSOtTr5M7IfI" />
        <link href="https://fonts.googleapis.com/css2?family=Yomogi&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
