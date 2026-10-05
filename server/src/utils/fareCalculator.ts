export type CoachClass = 'SECOND' | 'FIRST' | 'AC';

export interface FareOptions {
  distanceKm: number;
  isReturn: boolean;
  coachClass?: CoachClass;
  /** @deprecated use coachClass instead */
  isFirstClass?: boolean;
}

/**
 * Calculates the fare for Mumbai Local based on distance and ticket type.
 * Second Class Fare Slabs:
 * - 0 to 10 km: ₹5
 * - 11 to 25 km: ₹10
 * - 26+ km: ₹15
 *
 * Class multipliers:
 * - Second Class: 1×
 * - First Class:  10×
 * - AC Local:     20×  (AC trains like Harbour/Central AC local)
 *
 * Return ticket: 2× the one-way fare.
 */
export const calculateFare = (options: FareOptions): number => {
  const { distanceKm, isReturn, coachClass, isFirstClass = false } = options;

  // Resolve class — coachClass takes priority over legacy isFirstClass
  const resolvedClass: CoachClass = coachClass ?? (isFirstClass ? 'FIRST' : 'SECOND');

  let baseFare = 5; // minimum

  if (distanceKm > 25) {
    baseFare = 15;
  } else if (distanceKm > 10) {
    baseFare = 10;
  }

  // Class multiplier
  let multiplier = 1;
  if (resolvedClass === 'FIRST') multiplier = 10;
  if (resolvedClass === 'AC')    multiplier = 20;

  let finalFare = baseFare * multiplier;

  // Return ticket
  if (isReturn) {
    finalFare *= 2;
  }

  return finalFare;
};
