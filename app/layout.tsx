import type { Metadata, Viewport } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import dynamic from "next/dynamic";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import LenisProvider from "@/components/ui/LenisProvider";
import "./globals.css";

// Decorative client-only chrome — loaded after first paint so they don't
// gate hydration or block LCP.
const CustomCursor = dynamic(() => import("@/components/ui/CustomCursor"), {
  ssr: false,
});
const PageIntro = dynamic(() => import("@/components/ui/PageIntro"), {
  ssr: false,
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://worapat-portfolio.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Worapat Settapak — UX/UI Designer & Digital Artist",
    template: "%s — Worapat Settapak",
  },
  description:
    "Portfolio of Worapat Settapak — a UX/UI designer and digital artist crafting meaningful interfaces and digital experiences.",
  keywords: [
    "Worapat Settapak",
    "UX/UI Designer",
    "Digital Artist",
    "Portfolio",
    "Bangkok",
    "Thailand",
    "Figma",
    "Procreate",
  ],
  authors: [{ name: "Worapat Settapak" }],
  creator: "Worapat Settapak",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Worapat Settapak",
    title: "Worapat Settapak — UX/UI Designer & Digital Artist",
    description: "Designing experiences people actually love.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Worapat Settapak — UX/UI Designer & Digital Artist",
    description: "Designing experiences people actually love.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${dmSans.variable}`}>
      <body className="font-sans bg-base text-neutral-100 antialiased">
        <LenisProvider>
          <CustomCursor />
          <PageIntro />
          {children}
        </LenisProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
