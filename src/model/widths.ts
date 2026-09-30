import { WIDTH_STEPS, type WidthStep } from './types';

const SMALLEST = WIDTH_STEPS[0];

/** Largest step that does not exceed `max`, or the smallest step when none fits. */
export function stepAtMost(max: number): WidthStep {
  let best: WidthStep = SMALLEST;
  for (const step of WIDTH_STEPS) {
    if (step <= max) best = step;
  }
  return best;
}

/** Step closest to `percent`, never wider than `max`. */
export function snapWidth(percent: number, max = 100): WidthStep {
  const allowed = WIDTH_STEPS.filter((s) => s <= max);
  if (allowed.length === 0) return SMALLEST;
  return allowed.reduce((best, step) =>
    Math.abs(step - percent) < Math.abs(best - percent) ? step : best
  );
}

export function rowTotal(widths: readonly number[]): number {
  return widths.reduce((sum, w) => sum + w, 0);
}

/**
 * Keeps a row inside 100%. Widths that already fit are left alone; otherwise every
 * cell gets an equal share, rounded down to a step, so three cells become 33% each.
 */
export function fitWidths(widths: readonly WidthStep[]): WidthStep[] {
  if (rowTotal(widths) <= 100) return [...widths];
  const share = stepAtMost(100 / widths.length);
  return widths.map(() => share);
}
