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
}

export interface DbAvailability {
  id: string;
  day_of_week: number; // 0=Sun, 1=Mon, ..., 6=Sat
  start_time: string;
  end_time: string;
}

// ─── App types ───

export interface AppointmentWithService extends DbAppointment {
  service?: DbService;
  profile?: DbProfile;
}

export interface TimeSlotData {
  time: string;
  available: boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
}

// ─── Booking form ───

export type BookingMode = 'authenticated' | 'guest';

export interface BookingFormData {
  serviceIds: string[];
  date: string;
  time: string;
  isFirstConsultation: boolean;
  notes: string;
  bookingMode: BookingMode;
  guestFirstName?: string;
  guestLastName?: string;
  guestPhone?: string;
  guestEmail?: string;
}
