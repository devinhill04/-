import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Лёгкий "плюшевый" скролл на всю страницу.
 * lerp — насколько быстро скролл "догоняет" реальную позицию за кадр:
 * ближе к 1 = почти как обычный скролл, ближе к 0 = очень вязко/плавно.
 * 0.12 — едва заметная инерция, чтобы не мешать обычному использованию.
 */
export function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.12,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);
}
