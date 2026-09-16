import React, { useEffect, useMemo, useRef, useState } from 'react';
import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy';
import { useMoexHeatmap } from '../../entities/moex/model/use-moex-heatmap';
import { MoexStock } from '../../entities/moex/model/types';

const MAX_TILES = 16; // берём топ-N по капитализации, иначе карта станет нечитаемой кашей
const HEATMAP_HEIGHT = 340;
const COLOR_SATURATION_CAP = 4; // при изменении ±4% и больше — максимально насыщенный цвет

function colorForChange(changePercent: number, isDark: boolean): string {
  const clamped = Math.max(-COLOR_SATURATION_CAP, Math.min(COLOR_SATURATION_CAP, changePercent));
  const intensity = Math.abs(clamped) / COLOR_SATURATION_CAP; // 0..1

  if (Math.abs(changePercent) < 0.05) {
    return isDark ? '#3a3a3a' : '#E5E5E5';
  }

  if (clamped > 0) {
    // Зелёный (фирменный акцент IF): от бледного к насыщенному
    const light = isDark ? [22, 61, 41] : [214, 245, 227];
    const dark = [22, 163, 74];
    return mixColor(light, dark, intensity);
  } else {
    const light = isDark ? [69, 26, 26] : [253, 226, 226];
    const dark = [220, 38, 38];
    return mixColor(light, dark, intensity);
  }
}

function mixColor(a: number[], b: number[], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function useContainerWidth() {
  const [width, setWidth] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  // callback-ref, а не обычный useRef + useEffect([]) — обычный эффект с пустыми
  // зависимостями отрабатывает только один раз при первом монтировании компонента,
  // а тогда элемент с картой ещё не существует в DOM (рендерится блок "Загружаю...").
  // callback-ref же вызывается заново каждый раз, когда реальный DOM-узел
  // появляется/исчезает — то есть ровно тогда, когда нужно.
  const ref = (node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (node) {
      setWidth(node.getBoundingClientRect().width);
      const observer = new ResizeObserver((entries) => {
        setWidth(entries[0].contentRect.width);
      });
      observer.observe(node);
      observerRef.current = observer;
    }
  };

  return { ref, width };
}

export const MoexHeatmap: React.FC = () => {
  const { stocks, isLoading, error, lastUpdated } = useMoexHeatmap();
  const { ref: containerRef, width: containerWidth } = useContainerWidth();

  // Тёмная тема определяется тем же способом, что и остальное приложение — классом на html
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const topStocks = useMemo(() => {
    return [...stocks]
      .sort((a, b) => b.marketValue - a.marketValue)
      .slice(0, MAX_TILES);
  }, [stocks]);

  const rects = useMemo(() => {
    if (containerWidth === 0 || topStocks.length === 0) return [];

    const root = hierarchy({ children: topStocks })
      .sum((d: any) => (d.marketValue ? Math.sqrt(d.marketValue) : 0))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const layout = treemap<{ children: MoexStock[] }>()
      .tile(treemapSquarify)
      .size([containerWidth, HEATMAP_HEIGHT])
      .paddingInner(1);

    layout(root as any);

    const result = (root.leaves() as any[]).map((leaf) => ({
      item: { stock: leaf.data as MoexStock },
      x: leaf.x0,
      y: leaf.y0,
      width: leaf.x1 - leaf.x0,
      height: leaf.y1 - leaf.y0,
    }));

    console.log('[MOEX heatmap] rects построено:', result.length);
    return result;
  }, [topStocks, containerWidth]);

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height: HEATMAP_HEIGHT }}>
        <p className="text-[#7D7C82] dark:text-neutral-400 text-sm">Загружаю котировки Мосбиржи...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex items-center justify-center p-6" style={{ height: HEATMAP_HEIGHT }}>
        <p className="text-[#7D7C82] dark:text-neutral-400 text-sm text-center">
          Не удалось загрузить котировки. Попробуйте обновить позже.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-2">
      <div ref={containerRef} className="relative w-full rounded-[12px] overflow-hidden" style={{ height: HEATMAP_HEIGHT }}>
        {rects.length === 0 && topStocks.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[#7D7C82] dark:text-neutral-500 text-xs text-center px-4">
              Не удалось измерить размер блока (containerWidth). Данные есть ({topStocks.length} бумаг), но отрисовать не получилось — см. консоль.
            </p>
          </div>
        )}
        {rects.map(({ item, x, y, width, height }) => {
          const stock = (item as { stock: MoexStock }).stock;
          const bg = colorForChange(stock.changePercent ?? 0, isDark);
          const isSmall = width < 55 || height < 40;
          return (
            <div
              key={stock.secid}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: width - 1,
                height: height - 1,
                background: bg,
              }}
              className="flex flex-col items-center justify-center border border-white/40 dark:border-black/30 transition-colors duration-500"
            >
              {!isSmall && (
                <>
                  <span className="font-semibold text-[12px] text-[#161616] dark:text-white leading-tight">
                    {stock.secid}
                  </span>
                  <span className="font-medium text-[10px] text-[#161616]/80 dark:text-white/80 leading-tight">
                    {stock.changePercent !== null
                      ? `${stock.changePercent > 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%`
                      : '—'}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>

      {lastUpdated && (
        <p className="text-[#7D7C82] dark:text-neutral-500 text-[10px] text-right">
          Обновлено: {lastUpdated.toLocaleTimeString('ru-RU')}
        </p>
      )}
    </div>
  );
};
