"use client";

/**
 * Scroll-scrubbed SVG stroke (codescroll-style).
 * Starts mid-preview (emerges from behind it), swings through the page,
 * then slips behind the footer and continues downward.
 */
import { useEffect, useRef } from "react";
import { useScroll, useMotionValueEvent } from "framer-motion";

type ScrollStrokePathProps = {
  containerRef: React.RefObject<HTMLElement | null>;
};

/**
 * Trajectory in viewBox 1000×4200:
 * - starts mid-preview (hidden behind it)
 * - swings through the page
 * - ends centered under the footer underlap (hidden behind footer)
 */
const PATH_D = [
  "M500 220",
  "C500 220 500 260 480 300",
  "C420 380 160 360 110 480",
  "C50 640 860 520 930 760",
  "C990 1000 70 920 60 1280",
  "C50 1680 940 1500 960 1900",
  "C980 2300 80 2140 70 2540",
  "C60 2940 920 2780 940 3180",
  "C960 3480 280 3360 360 3680",
  "C420 3880 500 3800 500 4120",
].join(" ");

export function ScrollStrokePath({ containerRef }: ScrollStrokePathProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const lengthRef = useRef(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 35%", "end end"],
  });

  const applyProgress = (v: number) => {
    const path = pathRef.current;
    const length = lengthRef.current;
    if (!path || !length) return;
    path.style.strokeDashoffset = `${length * (1 - v)}`;
  };

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const measure = () => {
      const length = path.getTotalLength();
      lengthRef.current = length;
      path.style.strokeDasharray = `${length}`;
      applyProgress(scrollYProgress.get());
    };

    measure();
    const t = window.setTimeout(measure, 200);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
  }, [scrollYProgress]);

  useMotionValueEvent(scrollYProgress, "change", applyProgress);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <svg
        viewBox="0 0 1000 4200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        <path
          d={PATH_D}
          stroke="var(--primary)"
          strokeLinecap="round"
          className="opacity-[0.1] max-md:opacity-[0.07] [stroke-width:100px] sm:[stroke-width:140px] lg:[stroke-width:180px]"
          vectorEffect="nonScalingStroke"
        />
        <path
          ref={pathRef}
          d={PATH_D}
          stroke="var(--primary)"
          strokeLinecap="round"
          className="opacity-[0.34] max-md:opacity-[0.3] [stroke-width:72px] sm:[stroke-width:100px] lg:[stroke-width:128px]"
          vectorEffect="nonScalingStroke"
        />
      </svg>
    </div>
  );
}
