import { useState, useMemo } from 'react';
import { generateTimeSlots } from '@/data/pricing';
import type { TimeSlotData } from '@/types';

interface BookingCalendarProps {
  selectedDate: string;
  selectedTime: string;
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
}

function getWeekDays(startDate: Date): Date[] {
  const days: Date[] = [];
  const start = new Date(startDate);
  const dayOfWeek = start.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  start.setDate(start.getDate() + diff);

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDateKey(d: Date): string {
  return d.toISOString().split('T')[0];
}

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTH_NAMES = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

export default function BookingCalendar({
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
}: BookingCalendarProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [weekOffset, setWeekOffset] = useState(0);

  const currentWeekStart = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [today, weekOffset]);

  const weekDays = useMemo(() => getWeekDays(currentWeekStart), [currentWeekStart]);

  const slots: TimeSlotData[] = useMemo(() => {
    if (!selectedDate) return [];
    return generateTimeSlots(selectedDate);
  }, [selectedDate]);

  const morningSlots = slots.filter((s) => {
    const hour = parseInt(s.time.split(':')[0], 10);
    return hour < 12;
  });

  const afternoonSlots = slots.filter((s) => {
    const hour = parseInt(s.time.split(':')[0], 10);
    return hour >= 12;
  });

  const monthLabel = (() => {
    const months = new Set(weekDays.map((d) => `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`));
    return Array.from(months).join(' — ');
  })();

  const availableCount = slots.filter((s) => s.available).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Week navigation */}
      <div className="flex items-center justify-between rounded-xl bg-nude p-3">
        <button
          type="button"
          onClick={() => setWeekOffset((p) => Math.max(0, p - 1))}
          disabled={weekOffset === 0}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-sm text-text transition-all duration-200 hover:bg-white hover:shadow-sm disabled:opacity-30"
          aria-label="Semaine précédente"
        >
          &larr;
        </button>
        <span className="text-sm font-semibold capitalize text-text">{monthLabel}</span>
        <button
          type="button"
          onClick={() => setWeekOffset((p) => p + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-sm text-text transition-all duration-200 hover:bg-white hover:shadow-sm"
          aria-label="Semaine suivante"
        >
          &rarr;
        </button>
      </div>

      {/* Day selector — 7 days (Mon closed = disabled) */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, i) => {
          const key = formatDateKey(day);
          const isPast = day < today;
          const isMonday = day.getDay() === 1;
          const isSelected = key === selectedDate;
          const isDisabled = isPast || isMonday;
          const isToday = formatDateKey(day) === formatDateKey(today);

          return (
            <button
              key={key}
              type="button"
              disabled={isDisabled}
              onClick={() => { onSelectDate(key); onSelectTime(''); }}
              className={`relative flex flex-col items-center gap-1 rounded-xl px-1 py-3.5 text-center transition-all duration-300 ${
                isSelected
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : isDisabled
                    ? 'cursor-not-allowed bg-nude-dark/40 text-text-light/30'
                    : 'border border-transparent bg-white text-text shadow-sm hover:-translate-y-0.5 hover:border-primary-light hover:shadow-md'
              }`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                {DAY_NAMES[i]}
              </span>
              <span className="text-lg font-bold sm:text-xl">{day.getDate()}</span>
              {isMonday && (
                <span className="text-[8px] leading-none text-text-light/50">Fermé</span>
              )}
              {isToday && (
                <span className={`absolute -top-1 right-1 h-2 w-2 rounded-full ${isSelected ? 'bg-white' : 'bg-primary'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div className="step-enter flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text">
              {new Date(selectedDate).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
            <span className="rounded-full bg-nude px-3 py-1 text-xs font-medium text-text-light">
              {availableCount} créneaux disponibles
            </span>
          </div>

          {slots.length === 0 && (
            <p className="py-4 text-center text-sm text-text-light">Fermé ce jour.</p>
          )}

          {morningSlots.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="h-px flex-1 bg-rose-soft" />
                <p className="text-xs font-semibold uppercase tracking-wider text-text-light">Matin</p>
                <div className="h-px flex-1 bg-rose-soft" />
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {morningSlots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => onSelectTime(slot.time)}
                    className={`slot-btn rounded-lg px-3 py-3 text-sm font-semibold ${
                      selectedTime === slot.time
                        ? 'bg-primary text-white shadow-lg shadow-primary/25'
                        : slot.available
                          ? 'border border-primary-light/60 bg-white text-primary-dark hover:border-primary hover:bg-rose-soft/30'
                          : 'cursor-not-allowed bg-nude-dark/30 text-text-light/30 line-through'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {afternoonSlots.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="h-px flex-1 bg-rose-soft" />
                <p className="text-xs font-semibold uppercase tracking-wider text-text-light">Après-midi / Soir</p>
                <div className="h-px flex-1 bg-rose-soft" />
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {afternoonSlots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => onSelectTime(slot.time)}
                    className={`slot-btn rounded-lg px-3 py-3 text-sm font-semibold ${
                      selectedTime === slot.time
                        ? 'bg-primary text-white shadow-lg shadow-primary/25'
                        : slot.available
                          ? 'border border-primary-light/60 bg-white text-primary-dark hover:border-primary hover:bg-rose-soft/30'
                          : 'cursor-not-allowed bg-nude-dark/30 text-text-light/30 line-through'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
