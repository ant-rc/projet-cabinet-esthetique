import { getServiceById } from '@/data/pricing';
import type { DbService } from '@/types';

export function getServicesForIds(ids: string[]): DbService[] {
  return ids
    .map((id) => getServiceById(id))
    .filter((s): s is DbService => s !== undefined);
}

export function calculateTotalPrice(serviceIds: string[]): number {
  return getServicesForIds(serviceIds).reduce((sum, s) => sum + s.price, 0);
}

export function calculateTotalDuration(serviceIds: string[]): number {
  return getServicesForIds(serviceIds).reduce((sum, s) => sum + s.duration, 0);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return `${hours}h`;
  return `${hours}h${remaining.toString().padStart(2, '0')}`;
}
