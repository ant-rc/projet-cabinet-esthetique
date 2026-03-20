export interface Pricing {
  id: string;
  zone: string;
  description: string;
  price: number;
  duration: number; // minutes
  unit: string;
  category: EpilationCategory;
}

export type EpilationCategory = 'jambes' | 'maillot' | 'corps';

export interface EpilationCategoryInfo {
  id: EpilationCategory;
  label: string;
  icon: string;
  description: string;
}

export type AppointmentType = 'consultation' | 'seance';

export interface BookingFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  appointmentType: AppointmentType;
  services: string[]; // multi-zone
  date: string;
  time: string;
  message: string;
  profileId: string;
  totalPrice: number;
  totalDuration: number;
}

export type AppointmentStatus = 'requested' | 'confirmed' | 'cancelled' | 'completed';

export interface Appointment {
  id: string;
  appointmentType: AppointmentType;
  services: string[];
  date: string;
  time: string;
  status: AppointmentStatus;
  createdAt: string;
  profileId: string;
  profileName: string;
  totalPrice: number;
  totalDuration: number;
}

export interface PatientProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  relation: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  appointments: Appointment[];
  profiles: PatientProfile[];
  hasCompletedConsultation: boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface TimeSlotData {
  time: string;
  available: boolean;
}

// Patient file (provider side)
export type SkinType = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';

export interface TreatmentNote {
  id: string;
  date: string;
  zone: string;
  intensity: string;
  skinType: SkinType;
  notes: string;
}

export interface PatientFile {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  appointments: Appointment[];
  treatmentNotes: TreatmentNote[];
}

// Provider notifications
export type NotificationType = 'new_appointment' | 'cancellation';

export interface ProviderNotification {
  id: string;
  type: NotificationType;
  message: string;
  createdAt: string;
  read: boolean;
  appointmentId: string;
}
