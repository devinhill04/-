export interface TreemapItem {
  id: string;
  value: number;
}

export interface TreemapRect<T> {
  item: T;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Классический squarified treemap (Bruls, Huizing, van Wijk).
 * Раскладывает элементы по площади в прямоугольник width×height так,
 * чтобы плитки были максимально близки к квадрату, а не длинными полосками.
 */
export function squarify<T extends TreemapItem>(
  items: T[],
  width: number,
  height: number
): TreemapRect<T>[] {
  if (items.length === 0 || width <= 0 || height <= 0) return [];

  const total = items.reduce((sum, i) => sum + i.value, 0);
  if (total <= 0) return [];

  const area = width * height;
  const normalized = items.map((item) => ({ item, area: (item.value / total) * area }));

  const result: TreemapRect<T>[] = [];

  function worstRatio(row: { area: number }[], length: number): number {
    const sum = row.reduce((s, r) => s + r.area, 0);
    const max = Math.max(...row.map((r) => r.area));
    const min = Math.min(...row.map((r) => r.area));
    return Math.max((length * length * max) / (sum * sum), (sum * sum) / (length * length * min));
  }

  function layoutRow(row: { item: T; area: number }[], x: number, y: number, w: number, h: number, horizontal: boolean) {
    const sum = row.reduce((s, r) => s + r.area, 0);
    let offset = 0;
    for (const r of row) {
      if (horizontal) {
        const rowHeight = sum / w;
        const itemWidth = r.area / rowHeight;
        result.push({ item: r.item, x: x + offset, y, width: itemWidth, height: rowHeight });
        offset += itemWidth;
      } else {
        const rowWidth = sum / h;
        const itemHeight = r.area / rowWidth;
        result.push({ item: r.item, x, y: y + offset, width: rowWidth, height: itemHeight });
        offset += itemHeight;
      }
    }
  }

  let remaining = [...normalized].sort((a, b) => b.area - a.area);
  let cx = 0;
  let cy = 0;
  let cw = width;
  let ch = height;

  while (remaining.length > 0) {
    const horizontal = cw >= ch;
    const shortSide = horizontal ? ch : cw;

    let row: typeof remaining = [];
    let rowWorst = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const candidateRow = [...row, remaining[i]];
      const w = worstRatio(candidateRow, shortSide);
      if (w <= rowWorst || row.length === 0) {
        row = candidateRow;
        rowWorst = w;
      } else {
        break;
      }
    }

    layoutRow(row, cx, cy, cw, ch, horizontal);
    remaining = remaining.slice(row.length);

    const rowArea = row.reduce((s, r) => s + r.area, 0);
    if (horizontal) {
      const rowHeight = rowArea / cw;
      cy += rowHeight;
      ch -= rowHeight;
    } else {
      const rowWidth = rowArea / ch;
      cx += rowWidth;
      cw -= rowWidth;
    }
  }

  return result;
}
