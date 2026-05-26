// Conservative annual growth-rate estimates for Syrian land by district + use.
// These are starting assumptions used by the investment calculator -- they
// should be refined later from actual transaction data.
//
// IMPORTANT: real-world Syrian real-estate growth has been volatile due to
// war and currency. Treat these as rough planning numbers, not guarantees.

import type { DistrictKey } from '@/lib/districts';

type UseType =
  | 'residential'
  | 'agricultural'
  | 'commercial'
  | 'industrial';

// Base annual growth by use (decimal, e.g. 0.07 = 7%/year)
const BASE_GROWTH_BY_USE: Record<UseType, number> = {
  residential: 0.07,
  agricultural: 0.05,
  commercial: 0.09,
  industrial: 0.07,
};

// Multiplier per district. 1.0 = baseline; > 1 = higher demand area.
const DISTRICT_MULTIPLIER: Record<DistrictKey, number> = {
  damascus: 1.3,
  damascus_countryside: 1.15,
  aleppo: 1.1,
  homs: 1.05,
  hama: 1.0,
  latakia: 1.15,
  tartus: 1.1,
  idlib: 0.85,
  daraa: 0.9,
  deir_ezzor: 0.75,
  raqqa: 0.75,
  hasaka: 0.8,
  qamishli: 0.85,
  sweida: 0.95,
  quneitra: 0.9,
};

/**
 * Estimated annual growth rate (decimal) for a given district + use.
 * Falls back to baseline residential rate if unknown.
 */
export function annualGrowthRate(
  district: string,
  use: string,
): number {
  const base = BASE_GROWTH_BY_USE[use as UseType] ?? 0.06;
  const mul = DISTRICT_MULTIPLIER[district as DistrictKey] ?? 1.0;
  return base * mul;
}

/**
 * Project a value forward N years using annual compound growth.
 */
export function projectValue(
  currentValue: number,
  years: number,
  annualRate: number,
): number {
  return currentValue * Math.pow(1 + annualRate, years);
}

/**
 * Generate year-by-year projection points for charts.
 */
export function projectionSeries(
  currentValue: number,
  years: number,
  annualRate: number,
): { year: number; value: number }[] {
  const out: { year: number; value: number }[] = [];
  for (let y = 0; y <= years; y++) {
    out.push({ year: y, value: projectValue(currentValue, y, annualRate) });
  }
  return out;
}

/**
 * Compute total ROI as a decimal (e.g. 0.4 = +40%).
 */
export function totalROI(
  currentValue: number,
  futureValue: number,
): number {
  if (currentValue <= 0) return 0;
  return (futureValue - currentValue) / currentValue;
}
