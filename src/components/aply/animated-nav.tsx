"use client";
/**
 * AnimatedNav - fixed header with burger toggle + drop-down nav.
 *
 * Adapted from uploaded code2. Uses GSAP for:
 * - Height animation on the drop-down panel (0 to auto)
 * - Staggered character-by-character text reveal
 * - Hover blur effect on non-hovered links
 * - Dark overlay that slides down
 *
 * Adapted to Aply: warm palette, Aply-specific links, no shop/cart.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { Icon } from "@/components/aply/icon";

const NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how" },
  { label: "Extension", href: "/#extension" },
  { label: "API", href: "/api-explorer" },
  { label: "Demo", href: "/dashboard" },
  { label: "Log in", href: "/login" },
  { label: "Sign up", href: "/signup" },
];

export function AnimatedNav() {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const labelMenuRef = useRef<HTMLParagraphElement>(null);
  const labelCloseRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const navBodyRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // Split nav link text into spans for staggered reveal
  useEffect(() => {
    const links = navBodyRef.current?.querySelectorAll(".nav-link");
    if (!links) return;

    links.forEach((link) => {
      const text = link.textContent || "";
      link.textContent = "";
      text.split("").forEach((char) => {
        const span = document.createElement("span");
        span.textContent = char === " " ? "\u00A0" : char;
        span.style.display = "inline-block";
        span.style.willChange = "transform, opacity";
        link.appendChild(span);
      });
    });

    const allChars = navBodyRef.current?.querySelectorAll(".nav-link span");
    const footerItems = footerRef.current?.querySelectorAll("li");
    if (!allChars || !footerItems) return;

    const ease = "power3.inOut";
    const tl = gsap.timeline({ paused: true });

    tl.to(navRef.current, { height: "auto", duration: 0.8, ease }, 0)
      .to(bgRef.current, { height: "100vh", duration: 0.8, ease }, 0)
      .to(labelMenuRef.current, { opacity: 0, duration: 0.3 }, 0)
      .to(labelCloseRef.current, { opacity: 1, duration: 0.3 }, 0)
      .to(ctaRef.current, { opacity: 0, duration: 0.3 }, 0)
      .to(
        allChars,
        { y: "0%", opacity: 1, duration: 0.8, ease, stagger: 0.015 },
        0.15
      )
      .to(
        footerItems,
        { y: "0%", opacity: 1, duration: 0.8, ease, stagger: 0.04 },
        0.3
      );

    // Set initial hidden states
    gsap.set(allChars, { y: "100%", opacity: 0 });
    gsap.set(footerItems, { y: "100%", opacity: 0 });

    tlRef.current = tl;
  }, []);

  const handleToggle = () => {
    if (!tlRef.current) return;
    const tl = tlRef.current;
    if (tl.reversed() || tl.progress() === 0) {
      setOpen(true);
      tl.play();
    } else {
      setOpen(false);
      tl.reverse();
    }
  };

  // Hover blur effect
  useEffect(() => {
    const body = navBodyRef.current;
    if (!body) return;

    const links = body.querySelectorAll(".nav-link");

    const onOver = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest(".nav-link");
      if (!link) return;

      links.forEach((other) => {
        const isHovered = other === link;
        gsap.to(other, {
          filter: isHovered ? "blur(0px)" : "blur(4px)",
          opacity: isHovered ? 1 : 0.5,
          duration: 0.3,
          overwrite: true,
        });
      });
    };

    const onLeave = () => {
      gsap.to(links, {
        filter: "blur(0px)",
        opacity: 1,
        duration: 0.3,
        overwrite: true,
      });
    };

    body.addEventListener("mouseover", onOver);
    body.addEventListener("mouseleave", onLeave);

    return () => {
      body.removeEventListener("mouseover", onOver);
      body.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <header ref={headerRef} className="fixed left-0 top-0 z-50 w-full px-3 py-2.5 sm:px-5 sm:py-4">
      <div className="flex items-center justify-center text-xs font-medium uppercase tracking-wide sm:text-sm">
        {/* Logo */}
        <Link href="/" className="absolute left-0 flex items-center gap-1.5 no-underline">
          <Icon name="rocket" size={18} className="text-primary" />
          <span className="font-heading text-sm font-semibold text-foreground">Aply</span>
        </Link>

        {/* Toggle */}
        <div
          onClick={handleToggle}
          className="flex cursor-pointer items-center gap-2"
          role="button"
          tabIndex={0}
        >
          <div className={`relative h-[1px] w-[22px] transition-all duration-700 ${open ? "rotate-45" : ""}`}>
            <span className="absolute left-0 top-[-4px] h-px w-full bg-foreground transition-all duration-700" style={{ transform: open ? "rotate(0deg) translateY(4px)" : "rotate(0deg)" }} />
            <span className="absolute left-0 top-[4px] h-px w-full bg-foreground transition-all duration-700" style={{ transform: open ? "rotate(0deg) translateY(-4px)" : "rotate(0deg)" }} />
          </div>
          <div className="relative flex items-center">
            <p ref={labelMenuRef} className="text-foreground">Menu</p>
            <p ref={labelCloseRef} className="absolute left-0 opacity-0 text-foreground">Close</p>
          </div>
        </div>

        {/* CTA (fades out when menu opens) */}
        <div ref={ctaRef} className="absolute right-0 flex items-center gap-2">
          <Link href="/login" className="hidden text-muted-foreground transition-colors hover:text-foreground sm:inline">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-accent sm:px-4 sm:text-sm"
          >
            Get started
          </Link>
        </div>
      </div>

      {/* Drop-down nav panel */}
      <div ref={navRef} className="overflow-hidden" style={{ height: 0 }}>
        <div className="mx-auto flex max-w-7xl gap-8 pb-20 pt-8">
          <div className="flex flex-1 flex-col justify-between">
            <div ref={navBodyRef} className="flex flex-wrap gap-x-6 gap-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="nav-link flex overflow-hidden font-heading text-2xl font-light text-foreground no-underline sm:text-4xl lg:text-5xl"
                  style={{ overflow: "hidden" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div ref={footerRef} className="mt-8 flex flex-wrap gap-4 text-xs uppercase text-muted-foreground">
              <ul className="list-none">
                <li style={{ overflow: "hidden" }}><span className="text-muted-foreground/60">Built with:</span> Next.js · Prisma · TypeScript</li>
              </ul>
              <ul className="list-none">
                <li style={{ overflow: "hidden" }}><span className="text-muted-foreground/60">Local-first:</span> No data leaves your machine</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Dark overlay */}
      <div
        ref={bgRef}
        className="absolute left-0 top-full w-full bg-black/40"
        style={{ height: 0, pointerEvents: "none" }}
      />
    </header>
  );
}
