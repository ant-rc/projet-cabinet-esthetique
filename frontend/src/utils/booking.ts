import { pricingData } from '@/data/pricing';
import type { Pricing } from '@/types';

/**
 * Get pricing data for multiple zones at once.
 */
export function getPricingsForZones(zones: string[]): Pricing[] {
  return zones
    .map((zone) => pricingData.find((p) => p.zone === zone))
    .filter((p): p is Pricing => p !== undefined);
}

/**
 * Calculate total price for selected zones.
 */
export function calculateTotalPrice(zones: string[]): number {
  return getPricingsForZones(zones).reduce((sum, p) => sum + p.price, 0);
}

/**
 * Calculate total duration in minutes for selected zones.
 */
export function calculateTotalDuration(zones: string[]): number {
  return getPricingsForZones(zones).reduce((sum, p) => sum + p.duration, 0);
}

/**
 * Format duration in human-readable string.
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return `${hours}h`;
  return `${hours}h${remaining.toString().padStart(2, '0')}`;
}
