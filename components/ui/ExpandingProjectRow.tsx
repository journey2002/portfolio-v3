"use client";

import { useState } from "react";
import ProjectCard from "@/components/ui/ProjectCard";

type Project = {
  title: string;
  description: string;
  tags: string[];
};

export default function ExpandingProjectRow({
  projects,
  locked,
}: {
  projects: Project[];
  locked: boolean;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  // When locked, ignore hover so the cards keep their equal split.
  const active = locked ? null : hovered;

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      {projects.map((project, i) => {
        const isHovered = active === i;
        const isOther = active !== null && !isHovered;
        // flex-grow only redistributes width on the md row; in the mobile
        // column the container height is auto, so it has no effect.
        const grow = active === null ? 1 : isHovered ? 2 : 0.75;

        return (
          <div
            key={project.title}
            className="min-w-0 transition-[flex-grow] duration-500 ease-out-expo"
            style={{ flexBasis: 0, flexGrow: grow }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
          >
            <ProjectCard {...project} expanded={isHovered} dimmed={isOther} />
          </div>
        );
      })}
    </div>
  );
}
