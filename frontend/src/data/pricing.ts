import type { DbService, FAQItem, ServiceCategory, Gender } from '@/types';

// ─── Static services data (mirrors Supabase services table) ───

export const servicesData: DbService[] = [
  // ── Femme — Visage ──
  { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Menton', category: 'visage', gender: 'female', price: 40, duration: 15 },
  { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Lèvre supérieure', category: 'visage', gender: 'female', price: 30, duration: 10 },
  { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Nuque', category: 'visage', gender: 'female', price: 40, duration: 15 },
  { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Tour de cou', category: 'visage', gender: 'female', price: 50, duration: 15 },
  // ── Femme — Corps ──
  { id: '550e8400-e29b-41d4-a716-446655440005', name: 'Dos bas', category: 'corps', gender: 'female', price: 60, duration: 20 },
  { id: '550e8400-e29b-41d4-a716-446655440006', name: 'Dos haut', category: 'corps', gender: 'female', price: 100, duration: 30 },
  { id: '550e8400-e29b-41d4-a716-446655440007', name: 'Dos entier', category: 'corps', gender: 'female', price: 150, duration: 45 },
  { id: '550e8400-e29b-41d4-a716-446655440008', name: 'Fesses', category: 'corps', gender: 'female', price: 70, duration: 25 },
  { id: '550e8400-e29b-41d4-a716-446655440009', name: 'Ligne abdominale', category: 'corps', gender: 'female', price: 30, duration: 10 },
  { id: '550e8400-e29b-41d4-a716-446655440010', name: 'Ventre', category: 'corps', gender: 'female', price: 60, duration: 20 },
  // ── Femme — Maillot ──
  { id: '550e8400-e29b-41d4-a716-446655440011', name: 'Maillot classique', category: 'maillot', gender: 'female', price: 50, duration: 15 },
  { id: '550e8400-e29b-41d4-a716-446655440012', name: 'Maillot échancré', category: 'maillot', gender: 'female', price: 70, duration: 20 },
  { id: '550e8400-e29b-41d4-a716-446655440013', name: 'Maillot intégral', category: 'maillot', gender: 'female', price: 90, duration: 25 },
  { id: '550e8400-e29b-41d4-a716-446655440014', name: 'Sillon inter-fessier (SIF)', category: 'maillot', gender: 'female', price: 40, duration: 10 },
  // ── Femme — Bras ──
  { id: '550e8400-e29b-41d4-a716-446655440015', name: 'Aisselles', category: 'bras', gender: 'female', price: 50, duration: 10 },
  { id: '550e8400-e29b-41d4-a716-446655440016', name: 'Avant-bras + mains', category: 'bras', gender: 'female', price: 90, duration: 25 },
  { id: '550e8400-e29b-41d4-a716-446655440017', name: 'Bras entiers', category: 'bras', gender: 'female', price: 150, duration: 40 },
  { id: '550e8400-e29b-41d4-a716-446655440018', name: 'Bras supérieurs', category: 'bras', gender: 'female', price: 80, duration: 25 },
  { id: '550e8400-e29b-41d4-a716-446655440019', name: 'Mains', category: 'bras', gender: 'female', price: 40, duration: 10 },
  // ── Femme — Jambes ──
  { id: '550e8400-e29b-41d4-a716-446655440020', name: 'Cuisses', category: 'jambes', gender: 'female', price: 130, duration: 35 },
  { id: '550e8400-e29b-41d4-a716-446655440021', name: 'Arrière cuisse', category: 'jambes', gender: 'female', price: 100, duration: 30 },
  { id: '550e8400-e29b-41d4-a716-446655440022', name: 'Demi-jambes', category: 'jambes', gender: 'female', price: 140, duration: 35 },
  { id: '550e8400-e29b-41d4-a716-446655440023', name: 'Jambes complètes', category: 'jambes', gender: 'female', price: 260, duration: 60 },
  { id: '550e8400-e29b-41d4-a716-446655440024', name: 'Pieds', category: 'jambes', gender: 'female', price: 40, duration: 10 },

  // ── Homme — Visage ──
  { id: '550e8400-e29b-41d4-a716-446655440101', name: 'Col de chemise', category: 'visage', gender: 'male', price: 60, duration: 15 },
  { id: '550e8400-e29b-41d4-a716-446655440102', name: 'Nuque', category: 'visage', gender: 'male', price: 60, duration: 15 },
  { id: '550e8400-e29b-41d4-a716-446655440103', name: 'Oreilles / nez', category: 'visage', gender: 'male', price: 40, duration: 10 },
  { id: '550e8400-e29b-41d4-a716-446655440104', name: 'Pommettes', category: 'visage', gender: 'male', price: 50, duration: 15 },
  { id: '550e8400-e29b-41d4-a716-446655440105', name: 'Tour du cou', category: 'visage', gender: 'male', price: 60, duration: 15 },
  { id: '550e8400-e29b-41d4-a716-446655440106', name: 'Barbe entière', category: 'visage', gender: 'male', price: 70, duration: 20 },
  // ── Homme — Corps ──
  { id: '550e8400-e29b-41d4-a716-446655440107', name: 'Dos bas', category: 'corps', gender: 'male', price: 85, duration: 25 },
  { id: '550e8400-e29b-41d4-a716-446655440108', name: 'Dos haut', category: 'corps', gender: 'male', price: 140, duration: 35 },
  { id: '550e8400-e29b-41d4-a716-446655440109', name: 'Dos entier', category: 'corps', gender: 'male', price: 200, duration: 50 },
  { id: '550e8400-e29b-41d4-a716-446655440110', name: 'Fesses', category: 'corps', gender: 'male', price: 110, duration: 30 },
  { id: '550e8400-e29b-41d4-a716-446655440111', name: 'Sillon inter-fessier (SIF)', category: 'corps', gender: 'male', price: 70, duration: 15 },
  { id: '550e8400-e29b-41d4-a716-446655440112', name: 'Torse', category: 'corps', gender: 'male', price: 120, duration: 30 },
  { id: '550e8400-e29b-41d4-a716-446655440113', name: 'Ventre', category: 'corps', gender: 'male', price: 110, duration: 30 },
  // ── Homme — Bras ──
  { id: '550e8400-e29b-41d4-a716-446655440114', name: 'Aisselles', category: 'bras', gender: 'male', price: 60, duration: 15 },
  { id: '550e8400-e29b-41d4-a716-446655440115', name: 'Avant-bras + mains', category: 'bras', gender: 'male', price: 110, duration: 30 },
  { id: '550e8400-e29b-41d4-a716-446655440116', name: 'Bras entiers', category: 'bras', gender: 'male', price: 150, duration: 40 },
  { id: '550e8400-e29b-41d4-a716-446655440117', name: 'Bras supérieurs (sans épaules)', category: 'bras', gender: 'male', price: 95, duration: 25 },
  { id: '550e8400-e29b-41d4-a716-446655440118', name: 'Épaules', category: 'bras', gender: 'male', price: 80, duration: 20 },
  { id: '550e8400-e29b-41d4-a716-446655440119', name: 'Mains', category: 'bras', gender: 'male', price: 40, duration: 10 },
  // ── Homme — Jambes ──
  { id: '550e8400-e29b-41d4-a716-446655440120', name: 'Cuisses', category: 'jambes', gender: 'male', price: 200, duration: 45 },
  { id: '550e8400-e29b-41d4-a716-446655440121', name: 'Demi-jambes', category: 'jambes', gender: 'male', price: 180, duration: 40 },
  { id: '550e8400-e29b-41d4-a716-446655440122', name: 'Jambes complètes', category: 'jambes', gender: 'male', price: 370, duration: 75 },
  { id: '550e8400-e29b-41d4-a716-446655440123', name: 'Pieds', category: 'jambes', gender: 'male', price: 50, duration: 10 },
];

// ─── Categories ───

export interface CategoryInfo {
  id: ServiceCategory;
  label: string;
}

export const categories: CategoryInfo[] = [
  { id: 'visage', label: 'Visage' },
  { id: 'corps', label: 'Corps' },
  { id: 'maillot', label: 'Maillot' },
  { id: 'bras', label: 'Bras' },
  { id: 'jambes', label: 'Jambes' },
];

// ─── Filters ───

export function getServicesByGender(gender: Gender): DbService[] {
  return servicesData.filter((s) => s.gender === gender);
}

export function getServicesByGenderAndCategory(gender: Gender, category: ServiceCategory): DbService[] {
  return servicesData.filter((s) => s.gender === gender && s.category === category);
}

export function getServiceById(id: string): DbService | undefined {
  return servicesData.find((s) => s.id === id);
}

export function getCategoriesForGender(gender: Gender): CategoryInfo[] {
  const availableCategories = new Set(
    servicesData.filter((s) => s.gender === gender).map((s) => s.category),
  );
  return categories.filter((c) => availableCategories.has(c.id));
}

// ─── Availability (static, mirrors Supabase) ───

export interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export const availabilityData: AvailabilitySlot[] = [
  { dayOfWeek: 2, startTime: '09:30', endTime: '21:30' }, // Mardi
  { dayOfWeek: 3, startTime: '09:30', endTime: '21:30' }, // Mercredi
  { dayOfWeek: 4, startTime: '09:30', endTime: '21:30' }, // Jeudi
  { dayOfWeek: 5, startTime: '09:30', endTime: '21:30' }, // Vendredi
  { dayOfWeek: 6, startTime: '09:30', endTime: '21:30' }, // Samedi
  { dayOfWeek: 0, startTime: '09:30', endTime: '14:00' }, // Dimanche
];

export function generateTimeSlots(date: string): { time: string; available: boolean }[] {
  const d = new Date(date);
  const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  const slot = availabilityData.find((a) => a.dayOfWeek === dayOfWeek);
  if (!slot) return []; // Closed (Monday)

  const [startH, startM] = slot.startTime.split(':').map(Number);
  const [endH, endM] = slot.endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  const slots: { time: string; available: boolean }[] = [];

  for (let m = startMinutes; m < endMinutes; m += 30) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const time = `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    slots.push({ time, available: true });
  }

  return slots;
}

// ─── FAQ ───

export const faqData: FAQItem[] = [
  {
    question: 'La consultation initiale est-elle obligatoire ?',
    answer: 'Oui, une première consultation gratuite est obligatoire avant toute séance laser. Elle permet d’évaluer votre type de peau (phototype), de définir un protocole adapté et de vérifier qu’il n’y a aucune contre-indication.',
  },
  {
    question: 'Quelle technologie utilisez-vous ?',
    answer: 'Nous utilisons le Candela GentleMax Pro, laser médical haut de gamme et référence mondiale en épilation définitive. Sa double technologie Alexandrite & Nd:YAG permet de traiter efficacement tous les types de peau (phototypes I à VI). Le système de refroidissement CryoAir assure un confort optimal pendant la séance.',
  },
  {
    question: 'Comment se préparer avant la séance ?',
    answer: 'Rasez la zone à traiter la veille ou le matin même. La peau doit être propre, sans maquillage, crème, déodorant ni huile. Pas d’épilation à la cire ou à la pince dans les 3 semaines précédant la séance. Évitez toute exposition au soleil et les autobronzants au moins 2 à 6 semaines avant. Arrêtez les huiles essentielles (agrumes, tea tree) 10 jours avant.',
  },
  {
    question: 'Quelles précautions après le traitement ?',
    answer: 'Appliquez une crème apaisante ou hydratante. Pendant 48h : pas de gommage, sauna, hammam, exposition au soleil, ni sport intensif. Pas de parfum ni déodorant sur la zone traitée. Appliquez une crème solaire SPF 50+ en cas d’exposition. Évitez le soleil 2 à 6 semaines après la séance. Une légère rougeur ou sensation de chaleur est normale.',
  },
  {
    question: 'Quelles sont les contre-indications ?',
    answer: 'Contre-indications formelles : grossesse et allaitement, maladies auto-immunes (vitiligo, lupus), infections cutanées actives (herpès, eczéma, urticaire), troubles de la coagulation ou prise d’anticoagulants, maladies graves. Contre-indications temporaires : exposition solaire récente, poils clairs/blancs/roux (non réceptifs à la mélanine), traitements médicamenteux photosensibilisants, compléments à base de bêta-carotène.',
  },
  {
    question: 'Combien de séances sont nécessaires ?',
    answer: 'En moyenne, 6 à 8 séances espacées de 4 à 8 semaines sont nécessaires. Dès la 3e séance, vous constaterez une réduction significative. Une séance d’entretien annuelle peut être recommandée.',
  },
  {
    question: 'Est-ce douloureux ?',
    answer: 'La sensation est souvent comparée à un léger picotement. Le système de refroidissement CryoAir intégré au GentleMax Pro diffuse de l’air froid en continu, ce qui réduit considérablement la sensation de chaleur. Une crème anesthésiante (4€/tube, non remboursée) peut être conseillée pour le maillot, les aisselles ou les zones sensibles — à appliquer 1h avant la séance.',
  },
  {
    question: 'L’épilation laser est-elle adaptée à tous les types de peau ?',
    answer: 'Oui, grâce à la double technologie Alexandrite & Nd:YAG du GentleMax Pro, nous traitons efficacement tous les phototypes (I à VI). Lors de la consultation initiale, nous évaluons votre type de peau et adaptons les paramètres pour un traitement sûr et efficace. Seuls les poils clairs, blancs ou roux ne sont pas réceptifs au traitement laser.',
  },
];

// ─── Center info ───

export const centerInfo = {
  name: 'AA Laser Med',
  address: '12 Rue de la Santé',
  city: '75013 Paris',
  phone: '01 23 45 67 89',
  email: 'contact@aalasermed.fr',
  googleMapsUrl: 'https://maps.google.com/?q=12+Rue+de+la+Sant%C3%A9+75013+Paris',
  googleMapsEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2626.0!2d2.34!3d48.83!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z!5e0!3m2!1sfr!2sfr!4v1',
  access: {
    metro: 'Glacière (Ligne 6)',
    bus: 'Lignes 21, 62',
    parking: 'Parking Vinci rue de la Glacière',
  },
  hours: {
    tuesday_saturday: '09h30 – 21h30',
    sunday: '09h30 – 14h00 (sur rendez-vous)',
    monday: 'Fermé',
  },
  machine: {
    name: 'Candela GentleMax Pro',
    technology: 'Alexandrite & Nd:YAG',
    cooling: 'CryoAir',
  },
};
