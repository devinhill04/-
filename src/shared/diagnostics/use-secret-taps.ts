import { useRef } from 'react';

// Скрытый жест: N нажатий подряд за windowMs. Возвращает функцию «нажали».
export function createTapCounter(taps: number, windowMs: number, onTrigger: () => void, now: () => number = Date.now) {
  let stamps: number[] = [];
  return () => {
    const t = now();
    stamps = stamps.filter((x) => t - x <= windowMs);
    stamps.push(t);
    if (stamps.length >= taps) {
      stamps = [];
      onTrigger();
    }
  };
}

export function useSecretTaps(onTrigger: () => void, taps = 7, windowMs = 4000) {
  const cb = useRef(onTrigger);
  cb.current = onTrigger;
  const counter = useRef<(() => void) | null>(null);
  if (!counter.current) counter.current = createTapCounter(taps, windowMs, () => cb.current());
  return counter.current;
}
