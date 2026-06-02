'use client';

import React, { useEffect, useRef, type ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

interface ParticlesProps extends ComponentPropsWithoutRef<'div'> {
  className?: string;
  quantity?: number;
  staticity?: number;
  ease?: number;
  size?: number;
  refresh?: boolean;
  color?: string;
  vx?: number;
  vy?: number;
}

function hexToRgb(hex: string): number[] {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map((char) => char + char).join('');
  }
  const hexInt = parseInt(hex, 16);
  return [(hexInt >> 16) & 255, (hexInt >> 8) & 255, hexInt & 255];
}

type Circle = {
  x: number;
  y: number;
  translateX: number;
  translateY: number;
  size: number;
  alpha: number;
  targetAlpha: number;
  dx: number;
  dy: number;
  magnetism: number;
};

export const Particles: React.FC<ParticlesProps> = ({
  className = '',
  quantity = 100,
  staticity = 50,
  ease = 50,
  size = 0.4,
  refresh = false,
  color = '#ffffff',
  vx = 0,
  vy = 0,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Posición del mouse en coordenadas de página, leída dentro del rAF loop.
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rgb = hexToRgb(color);
    let circles: Circle[] = [];
    const canvasSize = { w: 0, h: 0 };
    const mouse = { x: 0, y: 0 };
    let rafId = 0;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    const remap = (value: number, s1: number, e1: number, s2: number, e2: number) => {
      const r = ((value - s1) * (e2 - s2)) / (e1 - s1) + s2;
      return r > 0 ? r : 0;
    };

    const circleParams = (): Circle => ({
      x: Math.floor(Math.random() * canvasSize.w),
      y: Math.floor(Math.random() * canvasSize.h),
      translateX: 0,
      translateY: 0,
      size: Math.floor(Math.random() * 2) + size,
      alpha: 0,
      targetAlpha: parseFloat((Math.random() * 0.6 + 0.1).toFixed(1)),
      dx: (Math.random() - 0.5) * 0.1,
      dy: (Math.random() - 0.5) * 0.1,
      magnetism: 0.1 + Math.random() * 4,
    });

    const drawCircle = (circle: Circle, update = false) => {
      const { x, y, translateX, translateY, size: s, alpha } = circle;
      ctx.translate(translateX, translateY);
      ctx.beginPath();
      ctx.arc(x, y, s, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(${rgb.join(', ')}, ${alpha})`;
      ctx.fill();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!update) circles.push(circle);
    };

    const clear = () => ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);

    const resize = () => {
      canvasSize.w = container.offsetWidth;
      canvasSize.h = container.offsetHeight;
      canvas.width = canvasSize.w * dpr;
      canvas.height = canvasSize.h * dpr;
      canvas.style.width = `${canvasSize.w}px`;
      canvas.style.height = `${canvasSize.h}px`;
      ctx.scale(dpr, dpr);
      circles = [];
      for (let i = 0; i < quantity; i++) drawCircle(circleParams());
    };

    const animate = () => {
      clear();
      // Traduce el mouse de página a coords relativas al canvas.
      const rect = canvas.getBoundingClientRect();
      const mx = mouseRef.current.x - rect.left - canvasSize.w / 2;
      const my = mouseRef.current.y - rect.top - canvasSize.h / 2;
      if (mx < canvasSize.w / 2 && mx > -canvasSize.w / 2 && my < canvasSize.h / 2 && my > -canvasSize.h / 2) {
        mouse.x = mx;
        mouse.y = my;
      }
      circles.forEach((circle, i) => {
        const edge = [
          circle.x + circle.translateX - circle.size,
          canvasSize.w - circle.x - circle.translateX - circle.size,
          circle.y + circle.translateY - circle.size,
          canvasSize.h - circle.y - circle.translateY - circle.size,
        ];
        const closestEdge = edge.reduce((a, b) => Math.min(a, b));
        const remapClosest = parseFloat(remap(closestEdge, 0, 20, 0, 1).toFixed(2));
        if (remapClosest > 1) {
          circle.alpha += 0.02;
          if (circle.alpha > circle.targetAlpha) circle.alpha = circle.targetAlpha;
        } else {
          circle.alpha = circle.targetAlpha * remapClosest;
        }
        circle.x += circle.dx + vx;
        circle.y += circle.dy + vy;
        circle.translateX += (mouse.x / (staticity / circle.magnetism) - circle.translateX) / ease;
        circle.translateY += (mouse.y / (staticity / circle.magnetism) - circle.translateY) / ease;

        drawCircle(circle, true);

        if (
          circle.x < -circle.size ||
          circle.x > canvasSize.w + circle.size ||
          circle.y < -circle.size ||
          circle.y > canvasSize.h + circle.size
        ) {
          circles.splice(i, 1);
          drawCircle(circleParams());
        }
      });
      rafId = window.requestAnimationFrame(animate);
    };

    resize();
    animate();

    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [quantity, staticity, ease, size, color, vx, vy, refresh]);

  return (
    <div className={cn('pointer-events-none', className)} ref={containerRef} aria-hidden="true" {...props}>
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
};
