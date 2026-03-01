/**
 * Price List Service
 *
 * Encapsulates all pricing calculation business logic for price list items.
 * This is the ONLY place where pricing formulas live — not in frontend, not in repository.
 *
 * Pricing model:
 * - costPerUnit: Manual input - the wholesale cost you pay per unit
 * - multiplier: The markup factor
 * - retailPrice: Calculated as costPerUnit × multiplier, OR retailPriceOverride if set
 * - retailPriceOverride: Optional manual override for retail price
 */

interface PricingCalculationParams {
  costPerUnit: number;
  multiplier: number;
  retailPriceOverride?: number | null;
}

/**
 * Calculates retailPrice based on the provided pricing parameters.
 *
 * If retailPriceOverride is provided, it takes precedence.
 * Otherwise, formula: retailPrice = costPerUnit × multiplier
 *
 * @returns The calculated or overridden retail price, rounded to 2 decimal places
 * @throws Error if multiplier is zero or negative
 */
export function calculateRetailPrice(params: PricingCalculationParams): number {
  const { costPerUnit, multiplier, retailPriceOverride } = params;

  // Use override if provided
  if (retailPriceOverride != null && retailPriceOverride > 0) {
    return roundToTwoDecimals(retailPriceOverride);
  }

  if (multiplier <= 0) {
    throw new Error('Multiplier must be greater than zero');
  }

  return roundToTwoDecimals(costPerUnit * multiplier);
}

/**
 * Compares two cost values to determine if a cost change has occurred.
 * Uses fixed precision to avoid floating-point comparison issues.
 */
export function hasCostChanged(previousCost: number, newCost: number): boolean {
  return roundToTwoDecimals(previousCost) !== roundToTwoDecimals(newCost);
}

/**
 * Rounds a number to two decimal places.
 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}
