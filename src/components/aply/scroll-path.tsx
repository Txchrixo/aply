"use client";
/**
 * ScrollPath - animated SVG path that draws as you scroll.
 *
 * Adapted from uploaded code3. The path starts behind the hero preview
 * window and snakes down through each section, drawing progressively
 * as the user scrolls.
 *
 * Uses GSAP ScrollTrigger for the draw-on-scroll effect.
 */
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function ScrollPath() {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const path = pathRef.current;
    if (!path) return;

    const pathLength = path.getTotalLength();
    path.style.strokeDasharray = String(pathLength);
    path.style.strokeDashoffset = String(pathLength);

    const tween = gsap.to(path, {
      strokeDashoffset: 0,
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      },
    });

    return () => {
      tween.kill();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] hidden lg:block"
      aria-hidden
    >
      <svg
        viewBox="0 0 1378 2760"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMin meet"
        className="h-full w-full opacity-30"
      >
        <path
          ref={pathRef}
          d="M689 0
             C689 0 200 100 200 500
             C200 900 1178 600 1178 1300
             C1178 2000 100 1800 200 2300
             C300 2700 689 2600 689 2760"
          stroke="var(--primary)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
}
