import type { Pricing, FAQItem, TimeSlotData, EpilationCategoryInfo } from '@/types';

export const epilationCategories: EpilationCategoryInfo[] = [
  {
    id: 'jambes',
    label: 'Jambes',
    icon: '🦵',
    description: 'Demi-jambes et jambes complètes',
  },
  {
    id: 'maillot',
    label: 'Maillot',
    icon: '✨',
    description: 'Maillot simple et intégral',
  },
  {
    id: 'corps',
    label: 'Corps',
    icon: '💫',
    description: 'Aisselles, bras, avant-bras, dos',
  },
];

export const pricingData: Pricing[] = [
  {
    id: 'demi-jambes',
    zone: 'Demi-jambes',
    description: 'Traitement laser des demi-jambes',
    price: 80,
    duration: 30,
    unit: 'séance',
    category: 'jambes',
  },
  {
    id: 'maillot-integral',
    zone: 'Maillot intégral',
    description: 'Traitement laser du maillot intégral',
    price: 70,
    duration: 25,
    unit: 'séance',
    category: 'maillot',
  },
  {
    id: 'aisselles',
    zone: 'Aisselles',
    description: 'Traitement laser des aisselles',
    price: 50,
    duration: 10,
    unit: 'séance',
    category: 'corps',
  },
  {
    id: 'jambes-completes',
    zone: 'Jambes complètes',
    description: 'Traitement laser des jambes complètes',
    price: 150,
    duration: 45,
    unit: 'séance',
    category: 'jambes',
  },
  {
    id: 'maillot-simple',
    zone: 'Maillot simple',
    description: 'Traitement laser du maillot simple',
    price: 50,
    duration: 15,
    unit: 'séance',
    category: 'maillot',
  },
  {
    id: 'bras',
    zone: 'Bras',
    description: 'Traitement laser des bras',
    price: 70,
    duration: 20,
    unit: 'séance',
    category: 'corps',
  },
  {
    id: 'avant-bras',
    zone: 'Avant-bras',
    description: 'Traitement laser des avant-bras',
    price: 50,
    duration: 15,
    unit: 'séance',
    category: 'corps',
  },
  {
    id: 'dos',
    zone: 'Dos',
    description: 'Traitement laser du dos complet',
    price: 120,
    duration: 35,
    unit: 'séance',
    category: 'corps',
  },
];

export const faqData: FAQItem[] = [
  {
    question: 'La consultation initiale est-elle obligatoire\u00a0?',
    answer: 'Oui, une première consultation gratuite est obligatoire avant toute séance laser. Elle permet d\u2019évaluer votre type de peau (phototype), de définir un protocole adapté et de vérifier qu\u2019il n\u2019y a aucune contre-indication.',
  },
  {
    question: 'Quelle technologie utilisez-vous\u00a0?',
    answer: 'Nous utilisons le Candela GentleMax Pro, laser médical haut de gamme et référence mondiale en épilation définitive. Sa double technologie Alexandrite & Nd:YAG permet de traiter efficacement tous les types de peau (phototypes I à VI). Le système de refroidissement CryoAir assure un confort optimal pendant la séance.',
  },
  {
    question: 'Comment se préparer avant la séance\u00a0?',
    answer: 'Rasez la zone à traiter la veille ou le matin même. La peau doit être propre, sans maquillage, crème, déodorant ni huile. Pas d\u2019épilation à la cire ou à la pince dans les 3 semaines précédant la séance. Évitez toute exposition au soleil et les autobronzants au moins 2 à 6 semaines avant. Arrêtez les huiles essentielles (agrumes, tea tree) 10 jours avant.',
  },
  {
    question: 'Quelles précautions après le traitement\u00a0?',
    answer: 'Appliquez une crème apaisante ou hydratante. Pendant 48h : pas de gommage, sauna, hammam, exposition au soleil, ni sport intensif. Pas de parfum ni déodorant sur la zone traitée. Appliquez une crème solaire SPF 50+ en cas d\u2019exposition. Évitez le soleil 2 à 6 semaines après la séance. Une légère rougeur ou sensation de chaleur est normale.',
  },
  {
    question: 'Quelles sont les contre-indications\u00a0?',
    answer: 'Contre-indications formelles : grossesse et allaitement, maladies auto-immunes (vitiligo, lupus), infections cutanées actives (herpès, eczéma, urticaire), troubles de la coagulation ou prise d\u2019anticoagulants, maladies graves. Contre-indications temporaires : exposition solaire récente, poils clairs/blancs/roux (non réceptifs à la mélanine), traitements médicamenteux photosensibilisants, compléments à base de bêta-carotène.',
  },
  {
    question: 'Combien de séances sont nécessaires\u00a0?',
    answer: 'En moyenne, 6 à 8 séances espacées de 4 à 8 semaines sont nécessaires. Dès la 3e séance, vous constaterez une réduction significative. Une séance d\u2019entretien annuelle peut être recommandée.',
  },
  {
    question: 'Est-ce douloureux\u00a0?',
    answer: 'La sensation est souvent comparée à un léger picotement. Le système de refroidissement CryoAir intégré au GentleMax Pro diffuse de l\u2019air froid en continu, ce qui réduit considérablement la sensation de chaleur. Une crème anesthésiante (4\u20ac/tube, non remboursée) peut être conseillée pour le maillot, les aisselles ou les zones sensibles — à appliquer 1h avant la séance.',
  },
  {
    question: 'L\u2019épilation laser est-elle adaptée à tous les types de peau\u00a0?',
    answer: 'Oui, grâce à la double technologie Alexandrite & Nd:YAG du GentleMax Pro, nous traitons efficacement tous les phototypes (I à VI). Lors de la consultation initiale, nous évaluons votre type de peau et adaptons les paramètres pour un traitement sûr et efficace. Seuls les poils clairs, blancs ou roux ne sont pas réceptifs au traitement laser.',
  },
];

export const zones = pricingData.map((p) => p.zone);

/**
 * Generate simulated time slots for a given date.
 * In production, this would fetch from a real backend.
 * One appointment per slot — already booked slots are marked unavailable.
 */
export function generateTimeSlots(date: string): TimeSlotData[] {
  const baseTimes = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
  ];

  // Simulate some slots being taken (deterministic based on date)
  const dateHash = date.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return baseTimes.map((time, i) => ({
    time,
    available: (dateHash + i) % 4 !== 0,
  }));
}

export function getPricingByCategory(categoryId: string): Pricing[] {
  return pricingData.filter((p) => p.category === categoryId);
}

export function getPricingByZone(zone: string): Pricing | undefined {
  return pricingData.find((p) => p.zone === zone);
}

// Center info
export const centerInfo = {
  name: 'AA Laser Med',
  address: '12 Rue de la Santé',
  city: '75013 Paris',
  phone: '01 23 45 67 89',
  email: 'contact@aalasermed.fr',
  googleMapsUrl: 'https://maps.google.com/?q=12+Rue+de+la+Santé+75013+Paris',
  googleMapsEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2626.0!2d2.34!3d48.83!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z!5e0!3m2!1sfr!2sfr!4v1',
  access: {
    metro: 'Glacière (Ligne 6)',
    bus: 'Lignes 21, 62',
    parking: 'Parking Vinci rue de la Glacière',
  },
  hours: {
    weekdays: '9h00 – 18h00',
    saturday: '9h00 – 13h00',
    sunday: 'Fermé',
  },
  machine: {
    name: 'Candela GentleMax Pro',
    technology: 'Alexandrite & Nd:YAG',
    cooling: 'CryoAir',
  },
};
