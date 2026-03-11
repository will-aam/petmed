export interface AdherenceResult {
  numerator: number;   // APPLIED doses
  denominator: number; // APPLIED + MISSED + SKIPPED (scheduledFor <= now)
  percentage: number | null; // null when denominator = 0
}
