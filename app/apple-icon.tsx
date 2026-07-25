import { ImageResponse } from "next/og";

// Edge, not Node — see the note in app/icon.tsx.
export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Apple touch icon — same planet mark as icon.tsx, larger canvas so the mark
// isn't cramped under iOS's home-screen rounding.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="140" height="140" viewBox="0 0 24 24" fill="none">
          <path
            d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z"
            stroke="#6ee7b7"
            strokeWidth="1.6"
          />
          <path
            d="M17.8486 6.19085C19.8605 5.81929 21.3391 5.98001 21.8291 6.76327C22.8403 8.37947 19.2594 12.0342 13.8309 14.9264C8.40242 17.8185 3.18203 18.8529 2.17085 17.2367C1.63758 16.3844 2.38148 14.9651 4 13.3897"
            stroke="#22d3ee"
            strokeWidth="1.6"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
