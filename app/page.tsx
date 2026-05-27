import dynamic from "next/dynamic";
import Nav from "@/components/ui/Nav";
import SectionMenu from "@/components/ui/SectionMenu";
import Hero from "@/components/sections/Hero";

// Below-the-fold sections are lazy-loaded to keep the initial bundle lean.
const About = dynamic(() => import("@/components/sections/About"));
const Work = dynamic(() => import("@/components/sections/Work"));
const Stack = dynamic(() => import("@/components/sections/Stack"));
const Contact = dynamic(() => import("@/components/sections/Contact"));

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
