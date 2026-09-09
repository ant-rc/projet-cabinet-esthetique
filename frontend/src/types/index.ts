// ─── Database types (match Supabase schema) ───

export type UserRole = 'client' | 'prestataire' | 'admin';
export type Gender = 'male' | 'female';
export type ServiceCategory = 'visage' | 'corps' | 'maillot' | 'bras' | 'jambes';
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'rescheduled' | 'completed' | 'no_show';

export interface DbUser {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface DbProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  created_at: string;
}

export interface DbService {
  id: string;
  name: string;
  category: ServiceCategory;
  gender: Gender;
  price: number;
  duration: number; // minutes
}

export interface DbAppointment {
  id: string;
  user_id: string;
  service_id: string | null;
  date: string;
  time: string;
  status: AppointmentStatus;
  is_first_consultation: boolean;
  notes: string | null;
  created_at: string;
  /**
   * Durée réellement bloquée dans l'agenda, lue depuis Calendly.
   *
   * Sur une réservation multi-zones, la même valeur totale est portée par chaque
   * ligne du groupe : ce n'est pas la durée de la zone de la ligne. Nul sur les
   * rendez-vous antérieurs à la migration que la reprise n'a pas su renseigner.
   */
  duration_minutes: number | null;
  /**
   * Identifiant de l'événement Calendly, clé de regroupement des lignes d'une
   * même réservation. Sans elle, trois zones réservées ensemble sont
   * indiscernables de trois rendez-vous simultanés en conflit.
   */
  calendly_event_uri: string | null;
}

// ─── App types ───

export interface TimeSlotData {
  time: string;
  available: boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
}

