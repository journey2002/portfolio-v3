import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "public", "clients");

const sites = [
  { id: "jijistudio", url: "https://jijistudio.fr/en" },
  { id: "juliaparis", url: "https://juliaparis.fr/" },
  { id: "pokebowl", url: "https://www.lamaisondupokebowl.com/en/" },
  { id: "olara", url: "https://olara.fr/en" },
  { id: "quatrequarts", url: "https://quatrequarts.fr/" },
];

// Marketing/newsletter popup vendors — never needed for a screenshot. Blocking
// the scripts outright beats racing their delayed/scroll-triggered popups.
// (shop.app powers the "Claim with shop" signup card in Shopify Forms popups.)
const BLOCKED = /klaviyo|privy|omnisend|justuno|attentive|mailmunch|sumo|wisepops|shop\.app/i;

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  locale: "en-US",
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
});
await context.route(BLOCKED, (route) => route.abort());

// Walk the page so lazy media and scroll-reveal sections actually render
// before the capture, then park back at the top.
async function preScroll(page) {
  await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = "auto";
    const height = () =>
      Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
    const step = window.innerHeight * 0.7;
    for (let y = 0; y <= Math.min(height(), 6000); y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 200));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(900);
}

async function dismissOverlays(page) {
  // Grant consent via common cookie managers when possible
  await page.evaluate(() => {
    try {
      localStorage.setItem("cookieconsent_status", "allow");
      localStorage.setItem("cookie-consent", "true");
      document.cookie = "cookieyes-consent=yes; path=/; max-age=31536000";
    } catch {
      /* ignore */
    }
  });

  // Most modals close on Escape — cheapest first move.
  for (let i = 0; i < 2; i++) {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(250);
  }

  const clickables = [
    "button:has-text('Accept all')",
    "button:has-text('Accept All')",
    "button:has-text('ACCEPT ALL')",
    "button:has-text('Accept')",
    "button:has-text('Tout accepter')",
    "button:has-text('Accepter tout')",
    "button:has-text('Accepter')",
    "button:has-text('I agree')",
    "button:has-text('Got it')",
    "button:has-text('Allow all')",
    "button:has-text('Agree')",
    "#onetrust-accept-btn-handler",
    ".cc-btn.cc-dismiss",
    "[data-testid='uc-accept-all-button']",
    ".shopify-pc__banner__btn-accept",
    "#shopify-pc__banner__btn-accept",
    "button[aria-label='Close']",
    "button[aria-label='close']",
    "button[aria-label='Fermer']",
    "[class*='newsletter'] button[class*='close']",
    "[class*='popup'] button[class*='close']",
    "[class*='modal'] button[class*='close']",
    ".needsclick button:has-text('No thanks')",
    ".needsclick button:has-text('No Thanks')",
    "button:has-text('No thanks')",
    "button:has-text('Maybe later')",
    "button:has-text('Continuer sans')",
  ];

  for (let pass = 0; pass < 2; pass++) {
    for (const sel of clickables) {
      try {
        const loc = page.locator(sel).first();
        if (await loc.isVisible({ timeout: 200 })) {
          await loc.click({ timeout: 1000, force: true });
          await page.waitForTimeout(350);
        }
      } catch {
        /* ignore */
      }
    }
    // Generic: click any visible × close icons near top of modals
    try {
      await page.evaluate(() => {
        const candidates = Array.from(
          document.querySelectorAll(
            "button, [role='button'], a, span[class*='close'], div[class*='close']"
          )
        );
        for (const el of candidates) {
          const t = (el.textContent || "").trim();
          const aria = (el.getAttribute("aria-label") || "").toLowerCase();
          const cls = (el.className || "").toString().toLowerCase();
          if (
            t === "×" ||
            t === "✕" ||
            t === "x" ||
            t === "X" ||
            aria.includes("close") ||
            aria.includes("fermer") ||
            (cls.includes("close") && el.getBoundingClientRect().width < 60)
          ) {
            const r = el.getBoundingClientRect();
            if (r.width > 0 && r.height > 0 && r.top < 700) {
              el.click();
            }
          }
        }
      });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(400);
  }

  // Screenshot-only cleanup: hide known offenders by selector, then sweep the
  // geometry — any position:fixed layer that isn't the top nav/announcement
  // bar (modals, cookie bars, chat bubbles, sticky CTAs, backdrops, popup
  // iframes) has no business in a portfolio shot. Sticky elements are left
  // alone: they're in-flow content and render in place on a full-page shot.
  await page.evaluate(() => {
    const kill = (el) => {
      if (!el || !(el instanceof HTMLElement)) return;
      el.style.setProperty("display", "none", "important");
      el.style.setProperty("visibility", "hidden", "important");
      el.style.setProperty("pointer-events", "none", "important");
    };
    document
      .querySelectorAll(
        [
          "#onetrust-banner-sdk",
          "#onetrust-consent-sdk",
          ".cc-window",
          ".cookie-banner",
          "[id*='cookie']",
          "[class*='cookie-consent']",
          "[class*='CookieConsent']",
          "[class*='shopify-pc']",
          "[class*='privacy-banner']",
          ".needsclick",
          "[class*='klaviyo']",
          "[id*='klaviyo']",
          "[class*='newsletter-popup']",
          "[class*='popup-modal']",
          "[aria-modal='true']",
          "div[role='dialog']",
        ].join(",")
      )
      .forEach(kill);

    const vh = window.innerHeight;
    document.querySelectorAll("body *").forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      const s = getComputedStyle(el);
      if (s.position !== "fixed") return;
      if (s.display === "none" || s.visibility === "hidden") return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      // Keep header chrome: hangs from the top and is bar-sized.
      if (r.top <= 120 && r.height <= vh * 0.4) return;
      kill(el);
    });
  });
}

for (const site of sites) {
  const page = await context.newPage();
  console.log("Capturing", site.id, site.url);
  try {
    await page.goto(site.url, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.waitForTimeout(3500);
    await preScroll(page);
    // Give delayed/scroll-triggered popups time to show before killing them.
    await page.waitForTimeout(2000);
    await dismissOverlays(page);
    await page.waitForTimeout(1200);
    await dismissOverlays(page);

    // Full-page capture, then crop in-browser: pin to the viewport width
    // (some sites let a carousel bleed sideways, which used to widen the
    // capture and leave a white gutter beside the page) and cap the height
    // against pathological pages. The cap is generous — the hover pan rides
    // to the image's end, so a capture cut mid-page would make the pan land
    // on a chopped section instead of the site's footer. Neither crop can be
    // done at capture time — screenshot({clip}) intersects with the
    // viewport, and clamping html/body height never worked (scrollHeight
    // ignores overflow clipping). PNG in, one JPEG encode out.
    const png = await page.screenshot({ type: "png", fullPage: true });
    const dataUrl = await page.evaluate(
      async ({ b64, width, maxHeight }) => {
        const img = new Image();
        img.src = "data:image/png;base64," + b64;
        await img.decode();
        const canvas = document.createElement("canvas");
        canvas.width = Math.min(width, img.naturalWidth);
        canvas.height = Math.min(maxHeight, img.naturalHeight);
        canvas.getContext("2d").drawImage(img, 0, 0);
        return canvas.toDataURL("image/jpeg", 0.84);
      },
      { b64: png.toString("base64"), width: 1440, maxHeight: 8000 }
    );

    const file = path.join(outDir, `${site.id}.jpg`);
    fs.writeFileSync(file, Buffer.from(dataUrl.split(",")[1], "base64"));

    const kb = Math.round(fs.statSync(file).size / 1024);
    console.log(`  OK ${site.id}.jpg (${kb}KB)`);
  } catch (e) {
    console.error(`  FAIL ${site.id}:`, e.message);
  } finally {
    await page.close();
  }
}

await browser.close();
console.log("Done");
