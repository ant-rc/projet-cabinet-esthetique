import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, Appointment, BookingFormData, PatientProfile } from '@/types';

export type SSOProvider = 'google' | 'facebook' | 'apple';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithSSO: (provider: SSOProvider) => Promise<boolean>;
  register: (data: Pick<User, 'firstName' | 'lastName' | 'email' | 'phone'>, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (data: Pick<User, 'firstName' | 'lastName' | 'email' | 'phone'>) => void;
  addAppointment: (data: BookingFormData) => Appointment;
  cancelAppointment: (appointmentId: string) => void;
  markConsultationDone: () => void;
  addProfile: (profile: Omit<PatientProfile, 'id'>) => PatientProfile;
  removeProfile: (profileId: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function readUser(): User | null {
  const stored = localStorage.getItem('aa_laser_user');
  if (!stored) return null;
  const parsed = JSON.parse(stored) as User;
  // Ensure fields exist for users created before these fields were added
  parsed.profiles = parsed.profiles ?? [];
  parsed.appointments = parsed.appointments ?? [];
  parsed.hasCompletedConsultation = parsed.hasCompletedConsultation ?? false;
  // Migrate old single-service appointments to multi-service format
  parsed.appointments = parsed.appointments.map((a) => ({
    ...a,
    appointmentType: a.appointmentType ?? 'seance',
    services: a.services ?? (('service' in a && typeof (a as Record<string, unknown>).service === 'string') ? [(a as Record<string, unknown>).service as string] : []),
    totalPrice: a.totalPrice ?? 0,
    totalDuration: a.totalDuration ?? 0,
  }));
  return parsed;
}

function writeUser(u: User) {
  localStorage.setItem('aa_laser_user', JSON.stringify(u));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readUser);

  const persistUser = (u: User) => {
    setUser(u);
    writeUser(u);
  };

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    await new Promise((r) => setTimeout(r, 400));

    const stored = readUser();
    if (stored && stored.email === email) {
      setUser(stored);
      return true;
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      firstName: 'Utilisateur',
      lastName: '',
      email,
      phone: '',
      appointments: [],
      profiles: [],
      hasCompletedConsultation: false,
    };
    persistUser(newUser);
    return true;
  }, []);

  const loginWithSSO = useCallback(async (provider: SSOProvider): Promise<boolean> => {
    // Simulate OAuth redirect delay
    await new Promise((r) => setTimeout(r, 800));

    // Check if user already exists
    const stored = readUser();
    if (stored) {
      setUser(stored);
      return true;
    }

    // Simulate data returned by SSO provider
    const ssoProfiles: Record<SSOProvider, { firstName: string; lastName: string; email: string }> = {
      google: { firstName: 'Utilisateur', lastName: 'Google', email: 'utilisateur@gmail.com' },
      facebook: { firstName: 'Utilisateur', lastName: 'Facebook', email: 'utilisateur@facebook.com' },
      apple: { firstName: 'Utilisateur', lastName: 'Apple', email: 'utilisateur@icloud.com' },
    };

    const profile = ssoProfiles[provider];
    const newUser: User = {
      id: crypto.randomUUID(),
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: '',
      appointments: [],
      profiles: [{
        id: 'self',
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: '',
        relation: 'Moi-même',
      }],
      hasCompletedConsultation: false,
    };
    persistUser(newUser);
    return true;
  }, []);

  const register = useCallback(async (
    data: Pick<User, 'firstName' | 'lastName' | 'email' | 'phone'>,
    _password: string,
  ): Promise<boolean> => {
    await new Promise((r) => setTimeout(r, 400));

    const newUser: User = {
      id: crypto.randomUUID(),
      ...data,
      appointments: [],
      profiles: [{
        id: 'self',
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        relation: 'Moi-même',
      }],
      hasCompletedConsultation: false,
    };
    persistUser(newUser);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('aa_laser_user');
  }, []);

  const updateUser = useCallback((data: Pick<User, 'firstName' | 'lastName' | 'email' | 'phone'>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      // Also update the "self" profile if it exists
      updated.profiles = (updated.profiles ?? []).map((p) =>
        p.id === 'self'
          ? { ...p, firstName: data.firstName, lastName: data.lastName, phone: data.phone }
          : p,
      );
      writeUser(updated);
      return updated;
    });
  }, []);

  const addAppointment = useCallback((data: BookingFormData): Appointment => {
    const appointment: Appointment = {
      id: crypto.randomUUID(),
      appointmentType: data.appointmentType,
      services: data.services,
      date: data.date,
      time: data.time,
      status: 'requested',
      createdAt: new Date().toISOString(),
      profileId: data.profileId,
      profileName: `${data.firstName} ${data.lastName}`,
      totalPrice: data.totalPrice,
      totalDuration: data.totalDuration,
    };

    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, appointments: [...prev.appointments, appointment] };
      writeUser(updated);
      return updated;
    });

    // Store notification for provider
    const notifications = JSON.parse(localStorage.getItem('aa_laser_notifications') ?? '[]');
    notifications.push({
      id: crypto.randomUUID(),
      type: 'new_appointment',
      message: `Nouveau RDV de ${data.firstName} ${data.lastName} — ${data.appointmentType === 'consultation' ? 'Consultation' : data.services.join(', ')} le ${data.date} à ${data.time}`,
      createdAt: new Date().toISOString(),
      read: false,
      appointmentId: appointment.id,
    });
    localStorage.setItem('aa_laser_notifications', JSON.stringify(notifications));

    return appointment;
  }, []);

  const cancelAppointment = useCallback((appointmentId: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        appointments: prev.appointments.map((a) =>
          a.id === appointmentId ? { ...a, status: 'cancelled' as const } : a,
        ),
      };
      writeUser(updated);
      return updated;
    });

    // Store cancellation notification for provider
    const notifications = JSON.parse(localStorage.getItem('aa_laser_notifications') ?? '[]');
    notifications.push({
      id: crypto.randomUUID(),
      type: 'cancellation',
      message: `Annulation du RDV #${appointmentId.slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      read: false,
      appointmentId,
    });
    localStorage.setItem('aa_laser_notifications', JSON.stringify(notifications));
  }, []);

  const markConsultationDone = useCallback(() => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, hasCompletedConsultation: true };
      writeUser(updated);
      return updated;
    });
  }, []);

  const addProfile = useCallback((profile: Omit<PatientProfile, 'id'>): PatientProfile => {
    const newProfile: PatientProfile = {
      ...profile,
      id: crypto.randomUUID(),
    };

    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, profiles: [...(prev.profiles ?? []), newProfile] };
      writeUser(updated);
      return updated;
    });

    return newProfile;
  }, []);

  const removeProfile = useCallback((profileId: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        profiles: (prev.profiles ?? []).filter((p) => p.id !== profileId),
      };
      writeUser(updated);
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: user !== null,
      login,
      loginWithSSO,
      register,
      logout,
      updateUser,
      addAppointment,
      cancelAppointment,
      markConsultationDone,
      addProfile,
      removeProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
