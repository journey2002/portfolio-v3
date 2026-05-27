import type { Metadata } from "next";
import Nav from "@/components/ui/Nav";
import Resume from "@/components/sections/Resume";

export const metadata: Metadata = {
  title: "Resume",
  description:
    "The experience, education, and skills behind Worapat Settapak — a UX/UI designer and digital artist based in Bangkok, Thailand.",
};

export default function ResumePage() {
  return (
    <main className="relative">
      <Nav />
      <Resume />
    </main>
  );
}
