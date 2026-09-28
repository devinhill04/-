import React, { useEffect, useMemo, useRef, useState } from 'react';
import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy';
import { MoexStock, MoexHeatmapState } from '../../entities/moex/model/types';

const MAX_TILES = 16; // берём топ-N по капитализации, иначе карта станет нечитаемой кашей
const HEATMAP_HEIGHT = 340;
const MIN_TILE_WEIGHT = 0.25; // доля от самой крупной плитки — чтобы ни одна не превращалась в полоску без подписи

type RGB = [number, number, number];
type Anchor = [number, RGB]; // [|изменение, %|, цвет]

// Палитра как на Смартлабе: ЗНАК изменения задаёт цвет (рост — зелёный, падение — красный),
// ВЕЛИЧИНА — насыщенность (от светлого к тёмному). Слабые движения не "серые", а сразу цветные.
// Опорные точки измерены по пикселям скриншота smart-lab.ru/q/map1, между ними — линейно.
const GREEN_ANCHORS: Anchor[] = [
  [0, [93, 248, 93]],
  [0.06, [89, 244, 89]],
  [0.21, [80, 235, 80]],
  [0.49, [69, 224, 69]],
  [1.58, [44, 199, 44]],
  [4.24, [8, 163, 8]],
  [6, [0, 125, 0]], // дальше не темнеем — иначе плитка станет почти чёрной
];
const RED_ANCHORS: Anchor[] = [
  [0, [248, 93, 93]],
  [0.06, [244, 89, 89]],
  [0.28, [231, 76, 76]],
  [0.61, [220, 65, 65]],
  [0.97, [211, 56, 56]],
  [2.77, [181, 26, 26]],
  [5.51, [150, 0, 0]],
];
// Ровно 0.00% — нейтральный серый
const ZERO_LIGHT: RGB = [205, 208, 215];
const ZERO_DARK: RGB = [110, 115, 125];

function mixRgb(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function rampColor(anchors: Anchor[], v: number): RGB {
  if (v <= anchors[0][0]) return anchors[0][1];
  for (let i = 1; i < anchors.length; i++) {
    if (v <= anchors[i][0]) {
      const [x0, c0] = anchors[i - 1];
      const [x1, c1] = anchors[i];
      return mixRgb(c0, c1, (v - x0) / (x1 - x0));
    }
  }
  return anchors[anchors.length - 1][1];
}

// Относительная яркость (WCAG) — чтобы выбрать читаемый цвет текста под плиткой
function luminance([r, g, b]: RGB): number {
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function tileColors(changePercent: number, isDark: boolean): { bg: string; fg: string } {
  const abs = Math.abs(changePercent);
  const rgb: RGB =
    abs < 0.005
      ? isDark ? ZERO_DARK : ZERO_LIGHT
      : rampColor(changePercent > 0 ? GREEN_ANCHORS : RED_ANCHORS, abs);
  return {
    bg: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
    fg: luminance(rgb) > 0.2 ? '#161616' : '#FFFFFF', // 0.2 — точка, где контраст чёрного и белого текста равен (~4.2:1)
  };
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

interface MoexHeatmapProps extends MoexHeatmapState {
  onSelectStock?: (stock: MoexStock) => void;
}

export const MoexHeatmap: React.FC<MoexHeatmapProps> = ({ stocks, isLoading, error, lastUpdated, onSelectStock }) => {
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
      .sort((a, b) => b.marketCap - a.marketCap)
      .slice(0, MAX_TILES);
  }, [stocks]);

  const rects = useMemo(() => {
    if (containerWidth === 0 || topStocks.length === 0) return [];

    const weight = (d: any) => Math.sqrt(d.tradingValue || 1);
    const floor = Math.max(...topStocks.map(weight)) * MIN_TILE_WEIGHT;

    const root = hierarchy({ children: topStocks })
      .sum((d: any) => (d.secid ? Math.max(weight(d), floor) : 0))
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
          const { bg, fg } = tileColors(stock.changePercent ?? 0, isDark);
          // Подпись есть на КАЖДОЙ плитке, меняется только размер шрифта
          const size = width >= 70 && height >= 44 ? 'lg' : width >= 46 && height >= 32 ? 'md' : 'sm';
          const tickerPx = size === 'lg' ? 12 : size === 'md' ? 10 : width < 34 ? 8 : 9;
          const percentPx = size === 'lg' ? 10 : 9;
          return (
            <div
              key={stock.secid}
              onClick={() => onSelectStock?.(stock)}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: width - 1,
                height: height - 1,
                background: bg,
                color: fg,
              }}
              className="flex flex-col items-center justify-center overflow-hidden px-0.5 text-center border border-white/40 dark:border-black/30 transition-colors duration-500 cursor-pointer active:opacity-80"
            >
              <span className="font-semibold leading-tight max-w-full truncate" style={{ fontSize: tickerPx }}>
                {stock.secid}
              </span>
              {size !== 'sm' && (
                <span className="font-medium leading-tight opacity-85" style={{ fontSize: percentPx }}>
                  {stock.changePercent !== null
                    ? `${stock.changePercent > 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%`
                    : '—'}
                </span>
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
