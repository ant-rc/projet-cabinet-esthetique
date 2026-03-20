import type { BookingFormData } from '@/types';
import { centerInfo } from '@/data/pricing';
import { formatDuration } from '@/utils/booking';

/**
 * Build practical info block for email content.
 */
function buildPracticalInfo(data: BookingFormData): string {
  const dateStr = new Date(data.date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const isConsultation = data.appointmentType === 'consultation';

  return [
    `Type : ${isConsultation ? 'Consultation (gratuite)' : 'Séance laser'}`,
    isConsultation ? '' : `Zones : ${data.services.join(', ')}`,
    `Date : ${dateStr} à ${data.time}`,
    `Durée estimée : ${formatDuration(data.totalDuration)}`,
    isConsultation ? '' : `Tarif : ${data.totalPrice}\u20ac`,
    '',
    '--- Informations pratiques ---',
    `Adresse : ${centerInfo.address}, ${centerInfo.city}`,
    `Google Maps : ${centerInfo.googleMapsUrl}`,
    `Accès métro : ${centerInfo.access.metro}`,
    `Parking : ${centerInfo.access.parking}`,
    '',
    '--- Rappels ---',
    '- Évitez toute exposition au soleil au moins 1 mois avant la séance',
    '- Rasez la zone la veille du traitement',
    '- N\'utilisez pas de cire ou de pince 4 semaines avant',
    '- Après la séance : évitez le soleil 2 semaines, appliquez SPF 50+',
  ].filter(Boolean).join('\n');
}

/**
 * Simulated email service.
 * Ready to be replaced with a real backend (Supabase Edge Functions, Resend, etc.)
 */
export async function sendPatientConfirmation(data: BookingFormData): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info(
      `[DEV] Patient confirmation email sent to: ${data.email}\n\n${buildPracticalInfo(data)}`,
    );
  }

  return true;
}

export async function sendOwnerNotification(data: BookingFormData): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info(
      `[DEV] Owner notification:\nPatient: ${data.firstName} ${data.lastName}\nTél: ${data.phone}\n\n${buildPracticalInfo(data)}`,
    );
  }

  return true;
}
