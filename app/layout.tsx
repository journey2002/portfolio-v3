import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk, Space_Grotesk, DM_Sans, Caveat } from "next/font/google";
import dynamic from "next/dynamic";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import LenisProvider from "@/components/ui/LenisProvider";
import { PointerProvider } from "@/components/ui/PointerProvider";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { AccentProvider } from "@/components/ui/AccentProvider";
import "./globals.css";

// Runs synchronously during HTML parse — before first paint — so a stored light
// preference and accent choice both apply with no flash. Defaults: dark theme,
// emerald accent.
const NO_FLASH_THEME = `(function(){try{var d=document.documentElement;var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark')t='dark';d.dataset.theme=t;var a=localStorage.getItem('accent');if(a!=='violet'&&a!=='emerald'&&a!=='sunset')a='emerald';d.dataset.accent=a;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',t==='light'?'#f6f5f3':'#080808');}catch(e){var d=document.documentElement;d.dataset.theme='dark';d.dataset.accent='emerald';}})();`;

// Decorative client-only chrome — loaded after first paint so they don't
// gate hydration or block LCP.
const CustomCursor = dynamic(() => import("@/components/ui/CustomCursor"), {
  ssr: false,
});
const PageIntro = dynamic(() => import("@/components/ui/PageIntro"), {
  ssr: false,
});

// Display face for headings — a clean, confident grotesque with just enough
// character to not read as a default. Deliberately NOT one of the AI-default
// header fonts (Inter / Geist / Space Grotesk / Instrument Serif).
const display = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

// Space Grotesk is retained only for the giant section numerals (SectionLabel),
// whose characterful digits read better as big hollow outlines than the display
// face's plainer numerals. Headings use --font-display (Schibsted).
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

// Handwriting face — used sparingly for marginalia, signatures, and asides so
// the otherwise-precise UI gains a human, hand-annotated layer.
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-caveat",
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
    "Portfolio of Worapat Settapak, a UX/UI designer and digital artist based in Bangkok. UX/UI, illustration, and interaction design.",
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
    <html
      lang="en"
      // The no-flash script sets data-theme on <html> before hydration, so the
      // client tree differs from the server's. This is expected — suppress the
      // one-level attribute mismatch warning for <html> only.
      suppressHydrationWarning
      className={`${display.variable} ${spaceGrotesk.variable} ${dmSans.variable} ${caveat.variable}`}
    >
      <body className="font-sans bg-night text-ink-strong antialiased">
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME }} />
        <ThemeProvider>
          <AccentProvider>
            <LenisProvider>
              <PointerProvider>
                <CustomCursor />
                <PageIntro />
                {children}
              </PointerProvider>
            </LenisProvider>
          </AccentProvider>
        </ThemeProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
