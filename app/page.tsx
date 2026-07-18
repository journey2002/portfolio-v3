import dynamic from "next/dynamic";
import Nav from "@/components/ui/Nav";
import SectionMenu from "@/components/ui/SectionMenu";
import Hero from "@/components/sections/Hero";

// Below-the-fold sections are code-split so Hero's JS stays lean. `loading`
// is a zero-layout placeholder (no spinner) so the split is invisible.
// Work owns both movements — client sites + off-the-clock personal work.
const About = dynamic(() => import("@/components/sections/About"), {
  loading: () => null,
});
const Work = dynamic(() => import("@/components/sections/Work"), {
  loading: () => null,
});
const Stack = dynamic(() => import("@/components/sections/Stack"), {
  loading: () => null,
});
const Contact = dynamic(() => import("@/components/sections/Contact"), {
  loading: () => null,
});

export default function Home() {
  return (
    <main className="relative">
      <Nav />
      <Hero />
      <About />
      <Work />
      <Stack />
      <Contact />
      <SectionMenu />
    </main>
  );
}
