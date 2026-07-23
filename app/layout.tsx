import type { Metadata, Viewport } from "next";
import {
  Schibsted_Grotesk,
  Space_Grotesk,
  DM_Sans,
  Caveat,
  JetBrains_Mono,
} from "next/font/google";
import dynamic from "next/dynamic";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import LenisProvider from "@/components/ui/LenisProvider";
import { PointerProvider } from "@/components/ui/PointerProvider";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { AccentProvider } from "@/components/ui/AccentProvider";
import { IntroProvider } from "@/components/ui/IntroProvider";
import MotionProvider from "@/components/ui/MotionProvider";
import PageIntro from "@/components/ui/PageIntro";
import "./globals.css";

// Runs synchronously during HTML parse — before first paint — so a stored light
// preference and accent choice both apply with no flash. Defaults: dark theme,
// emerald accent. Also stamps data-intro: "done" hides the SSR'd intro overlay
// before paint on repeat visits / reduced motion (see PageIntro + globals.css);
// the predicate must stay in sync with shouldSkipIntro() in IntroProvider.
const NO_FLASH_THEME = `(function(){try{var d=document.documentElement;var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark')t='dark';d.dataset.theme=t;var a=localStorage.getItem('accent');if(a!=='violet'&&a!=='emerald'&&a!=='sunset')a='emerald';d.dataset.accent=a;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',t==='light'?'#f6f5f3':'#080808');}catch(e){var d=document.documentElement;d.dataset.theme='dark';d.dataset.accent='emerald';}try{var i='pending';if(sessionStorage.getItem('intro-seen')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches)i='done';document.documentElement.dataset.intro=i;}catch(e2){document.documentElement.dataset.intro='pending';}})();`;

// Decorative client-only chrome — loaded after first paint so it doesn't
// gate hydration or block LCP. PageIntro is deliberately NOT dynamic: its
// pasteboard backdrop must be in the server HTML so a first visit's first
// paint is the intro, not a flash of the page before the overlay hydrates.
const CustomCursor = dynamic(() => import("@/components/ui/CustomCursor"), {
  ssr: false,
});

// Display face for headings — a clean, confident grotesque with just enough
// character to not read as a default. Deliberately NOT one of the AI-default
// header fonts (Inter / Geist / Space Grotesk / Instrument Serif).
// Preload only the two faces that paint above the fold (display + body).
const display = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
  preload: true,
});

// Space Grotesk is retained as the numeral face: standalone numerals site-wide
// (SectionLabel's giant outlines, the footer wordmark, index columns, counters,
// stat digits), whose characterful digits read better than the display face's
// plainer ones. Headings use --font-display (Schibsted).
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
  // Below-fold / decorative numerals — don't contend with LCP font fetch.
  preload: false,
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
  preload: true,
});

// Monospace face — used for live domains/URLs so they read like real addresses:
// technical and precise, the same clean vibe as the numerals but unmistakably
// code. JetBrains Mono over the AI-default monos (Geist Mono / Fira Code).
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
  preload: false,
});

// Handwriting face — used sparingly for marginalia, signatures, and asides so
// the otherwise-precise UI gains a human, hand-annotated layer.
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-caveat",
  display: "swap",
  preload: false,
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://worapat-portfolio.vercel.app";

// Structured data for the person behind the site, so search engines tie the
// name, role, location and profiles together instead of inferring them from
// body copy. Mirrors the metadata below and the Contact section — keep in sync.
// Instagram is deliberately absent until the placeholder link is replaced.
const PERSON_LD = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Worapat Settapak",
  url: siteUrl,
  jobTitle: "UX/UI Designer & Digital Artist",
  email: "mailto:worapat2002@gmail.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Bangkok",
    addressCountry: "TH",
  },
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "Thai-Nichi Institute of Technology",
  },
  sameAs: [
    "https://github.com/journey2002",
    "https://www.linkedin.com/in/worapat-settapak-562192212",
  ],
};

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
};

export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  // Extends the canvas under the iOS notch/home indicator so
  // env(safe-area-inset-*) resolves to real values (it's 0 without cover) —
  // the hero status bar and SectionMenu pad themselves clear of it.
  viewportFit: "cover",
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
      className={`${display.variable} ${spaceGrotesk.variable} ${dmSans.variable} ${mono.variable} ${caveat.variable}`}
    >
      <body className="font-sans bg-night text-ink-strong antialiased">
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_LD) }}
        />
        {/* Without JS the overlay could never animate away — hide it so the
            server-rendered page stays reachable. */}
        <noscript>
          <style>{`#page-intro{display:none}`}</style>
        </noscript>
        {/* First focusable element on every page — the nav pill is fixed and
            the sections are long, so without this a keyboard visitor tabs the
            whole header before reaching content. */}
        <a
          href="#main"
          className="sr-only rounded-full bg-accent-gradient px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200]"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <AccentProvider>
            <IntroProvider>
              <MotionProvider>
                <LenisProvider>
                  <PointerProvider>
                    <CustomCursor />
                    <PageIntro />
                    {children}
                  </PointerProvider>
                </LenisProvider>
              </MotionProvider>
            </IntroProvider>
          </AccentProvider>
        </ThemeProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
