// Русское склонение по числу: plural(1, ['публикацию', 'публикации', 'публикаций']) → «публикацию»
export function plural(n: number, [one, few, many]: [string, string, string]): string {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b >= 2 && b <= 4) return few;
  return many;
}
export const PUBLICATIONS: [string, string, string] = ['публикацию', 'публикации', 'публикаций'];
