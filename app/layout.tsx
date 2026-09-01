import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "الرقیۃ الشرعیۃ — مسنون علاج اور دم کی مکمل گائیڈ",
  description:
    "سحر، نظرِ بد، گھبراہٹ، جسمانی درد اور تمام بیماریوں سے شفاء کے لیے قرآنی آیات اور مسنون نبوی دعاؤں پر مشتمل جامع الرقیۃ الشرعیۃ گائیڈ۔",
  keywords: [
    "الرقیۃ الشرعیۃ",
    "دم",
    "علاج",
    "قرآنی آیات",
    "مسنون دعائیں",
    "سحر کا توڑ",
    "نظر بد",
    "شفاء"
  ],
  authors: [{ name: "Ruqyah Shariah Guide" }],
  openGraph: {
    title: "الرقیۃ الشرعیۃ — مسنون علاج اور دم کی مکمل گائیڈ",
    description:
      "سحر، نظرِ بد، گھبراہٹ، جسمانی درد اور تمام بیماریوں سے شفاء کے لیے قرآنی آیات اور مسنون نبوی دعاؤں پر مشتمل جامع گائیڈ۔",
    type: "website",
    locale: "ur_PK",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F4EC" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ur" dir="rtl" data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Noto+Nastaliq+Urdu:wght@400;700&family=Noto+Sans+Arabic:wght@400;600;700&family=Outfit:wght@400;500;600;700&family=Scheherazade+New:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
