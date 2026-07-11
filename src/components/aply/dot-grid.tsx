"use client";
/**
 * DotGrid - interactive dot grid background.
 * Dots react to mouse proximity (color shift) and mouse speed (impulse push).
 * Click creates a shockwave.
 *
 * Adapted from the uploaded code1 component.
 * Uses warm palette colors instead of purple.
 */
import { useEffect, useRef } from "react";

interface DotGridProps {
  dotSize?: number;
  gap?: number;
  baseColor?: string;
  activeColor?: string;
  proximity?: number;
  speedTrigger?: number;
  shockRadius?: number;
  shockStrength?: number;
  maxSpeed?: number;
  resistance?: number;
  returnDuration?: number;
  className?: string;
}

export function DotGrid({
  dotSize = 4,
  gap = 18,
  baseColor = "#E5D5B5",
  activeColor = "#C65D00",
  proximity = 120,
  speedTrigger = 100,
  shockRadius = 250,
  shockStrength = 5,
  maxSpeed = 5000,
  resistance = 750,
  returnDuration = 1.5,
  className,
}: DotGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = containerRef.current;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!root || !canvas || !wrap) return;

    // Helper: parse number with fallback
    const num = (v: number, fallback: number) => (Number.isFinite(v) ? v : fallback);

    // Helper: hex to rgb
    const hexToRgb = (hex: string) => {
      const m = String(hex).trim().match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
      if (!m) return { r: 0, g: 0, b: 0 };
      return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
    };

    const baseRgb = hexToRgb(baseColor);
    const activeRgb = hexToRgb(activeColor);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dots: Array<{ cx: number; cy: number; xOffset: number; yOffset: number; vx: number; vy: number }> = [];
    const pointer = { x: 0, y: 0, vx: 0, vy: 0, speed: 0, lastTime: 0, lastX: 0, lastY: 0 };

    let dpr = 1;
    let w = 1;
    let h = 1;
    let proxSq = proximity * proximity;
    let circlePath: Path2D | null = null;

    const buildGrid = () => {
      const rect = wrap.getBoundingClientRect();
      dpr = Math.max(1, window.devicePixelRatio || 1);
      w = rect.width;
      h = rect.height;

      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      proxSq = proximity * proximity;

      circlePath = null;
      if (window.Path2D) {
        const p = new Path2D();
        p.arc(0, 0, dotSize / 2, 0, Math.PI * 2);
        circlePath = p;
      }

      const cols = Math.floor((w + gap) / (dotSize + gap));
      const rows = Math.floor((h + gap) / (dotSize + gap));
      const cell = dotSize + gap;
      const gridW = cell * cols - gap;
      const gridH = cell * rows - gap;
      const extraX = w - gridW;
      const extraY = h - gridH;
      const startX = extraX / 2 + dotSize / 2;
      const startY = extraY / 2 + dotSize / 2;

      dots.length = 0;
      for (let yy = 0; yy < rows; yy++) {
        for (let xx = 0; xx < cols; xx++) {
          const cx = startX + xx * cell;
          const cy = startY + yy * cell;
          dots.push({ cx, cy, xOffset: 0, yOffset: 0, vx: 0, vy: 0 });
        }
      }
    };

    const setPointer = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = clientX - rect.left;
      pointer.y = clientY - rect.top;
    };

    const applyImpulse = (dot: { vx: number; vy: number }, ix: number, iy: number) => {
      dot.vx += ix;
      dot.vy += iy;
    };

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dtMs = Math.min(32, now - last);
      last = now;
      const dt = dtMs / 1000;

      ctx.clearRect(0, 0, w, h);

      const px = pointer.x;
      const py = pointer.y;
      const omega = 8 / Math.max(0.05, returnDuration);
      const k = omega * omega;
      const c = 2 * omega;
      const drag = Math.exp(-dtMs / Math.max(60, resistance));

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        dot.vx += (-k * dot.xOffset - c * dot.vx) * dt;
        dot.vy += (-k * dot.yOffset - c * dot.vy) * dt;
        dot.vx *= drag;
        dot.vy *= drag;
        dot.xOffset += dot.vx * dt;
        dot.yOffset += dot.vy * dt;

        const ox = dot.cx + dot.xOffset;
        const oy = dot.cy + dot.yOffset;
        const dx = dot.cx - px;
        const dy = dot.cy - py;
        const dsq = dx * dx + dy * dy;

        let style = baseColor;
        if (dsq <= proxSq) {
          const dist = Math.sqrt(dsq);
          const t = 1 - dist / proximity;
          const r = Math.round(baseRgb.r + (activeRgb.r - baseRgb.r) * t);
          const g = Math.round(baseRgb.g + (activeRgb.g - baseRgb.g) * t);
          const b = Math.round(baseRgb.b + (activeRgb.b - baseRgb.b) * t);
          style = `rgb(${r},${g},${b})`;
        }

        ctx.save();
        ctx.translate(ox, oy);
        ctx.fillStyle = style;
        if (circlePath) ctx.fill(circlePath);
        else {
          ctx.beginPath();
          ctx.arc(0, 0, dotSize / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    };

    // Throttle mousemove
    let lastMove = 0;
    const onMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastMove < 16) return;
      lastMove = now;

      const dt = pointer.lastTime ? now - pointer.lastTime : 16;
      const dx = e.clientX - pointer.lastX;
      const dy = e.clientY - pointer.lastY;
      let vx = (dx / dt) * 1000;
      let vy = (dy / dt) * 1000;
      let sp = Math.hypot(vx, vy);
      if (sp > maxSpeed) {
        const s = maxSpeed / sp;
        vx *= s;
        vy *= s;
        sp = maxSpeed;
      }

      pointer.lastTime = now;
      pointer.lastX = e.clientX;
      pointer.lastY = e.clientY;
      pointer.vx = vx;
      pointer.vy = vy;
      pointer.speed = sp;
      setPointer(e.clientX, e.clientY);

      if (sp <= speedTrigger) return;

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        const dist = Math.hypot(dot.cx - pointer.x, dot.cy - pointer.y);
        if (dist < proximity) {
          const fall = Math.max(0, 1 - dist / proximity);
          const pushX = (dot.cx - pointer.x + vx * 0.01) * fall;
          const pushY = (dot.cy - pointer.y + vy * 0.01) * fall;
          applyImpulse(dot, pushX * 12, pushY * 12);
        }
      }
    };

    const onClick = (e: MouseEvent) => {
      setPointer(e.clientX, e.clientY);
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        const dist = Math.hypot(dot.cx - pointer.x, dot.cy - pointer.y);
        if (dist < shockRadius) {
          const falloff = Math.max(0, 1 - dist / shockRadius);
          const pushX = (dot.cx - pointer.x) * shockStrength * falloff;
          const pushY = (dot.cy - pointer.y) * shockStrength * falloff;
          applyImpulse(dot, pushX * 18, pushY * 18);
        }
      }
    };

    buildGrid();

    const ro = new ResizeObserver(buildGrid);
    ro.observe(wrap);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("click", onClick);

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick);
      dots.length = 0;
    };
  }, [dotSize, gap, baseColor, activeColor, proximity, speedTrigger, shockRadius, shockStrength, maxSpeed, resistance, returnDuration]);

  return (
    <div ref={containerRef} className={`pointer-events-none absolute inset-0 z-0 ${className ?? ""}`}>
      <div ref={wrapRef} className="relative h-full w-full">
        <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
      </div>
    </div>
  );
}
