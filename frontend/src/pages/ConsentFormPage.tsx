import { useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CONSENT_LEGAL_TEXT, type ConsentForm } from '@/types/medical';
import { servicesData } from '@/data/pricing';

const FORM_VERSION = '1.0.0';

function sanitize(value: string): string {
  return value.replace(/[<>]/g, '').trim();
}

function getStorageKey(patientId: string): string {
  return `aa_laser_consent_${patientId}`;
}

function loadConsent(patientId: string): ConsentForm | null {
  const stored = localStorage.getItem(getStorageKey(patientId));
  if (!stored) return null;
  return JSON.parse(stored) as ConsentForm;
}

function saveConsent(patientId: string, data: ConsentForm): void {
  localStorage.setItem(getStorageKey(patientId), JSON.stringify(data));
}

/** Unique zone names (deduplicated across male/female) */
const ZONE_OPTIONS = [...new Set(servicesData.map((s) => s.name))].sort();

/** Legal text split into numbered sections for accordion display */
interface LegalSection {
  title: string;
  body: string;
}

function parseLegalSections(text: string): { header: string; sections: LegalSection[]; footer: string } {
  const lines = text.split('\n');
  const header = lines.slice(0, 3).join('\n').trim();

  const sectionRegex = /^(\d+)\.\s+(.+)$/;
  const sections: LegalSection[] = [];
  let currentTitle = '';
  let currentBody: string[] = [];
  let footerStart = -1;

  for (let i = 3; i < lines.length; i++) {
    const match = sectionRegex.exec(lines[i]);
    if (match) {
      if (currentTitle) {
        sections.push({ title: currentTitle, body: currentBody.join('\n').trim() });
      }
      currentTitle = `${match[1]}. ${match[2]}`;
      currentBody = [];
    } else if (lines[i].startsWith('En signant ce formulaire')) {
      if (currentTitle) {
        sections.push({ title: currentTitle, body: currentBody.join('\n').trim() });
      }
      footerStart = i;
      break;
    } else {
      currentBody.push(lines[i]);
    }
  }

  const footer = footerStart >= 0 ? lines.slice(footerStart).join('\n').trim() : '';
  return { header, sections, footer };
}

const parsed = parseLegalSections(CONSENT_LEGAL_TEXT);

export default function ConsentFormPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const patientId = searchParams.get('patient') ?? '';

  const [targetZones, setTargetZones] = useState<string[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [openSections, setOpenSections] = useState<Set<number>>(new Set());
  const [signed, setSigned] = useState(false);

  // Load existing consent on mount
  useState(() => {
    if (!patientId) return;
    const existing = loadConsent(patientId);
    if (existing) {
      setTargetZones(existing.targetZones);
      setSignatureName(existing.signatureName);
      setAccepted(true);
      setSigned(true);
    }
  });

  if (!patientId) {
    return (
      <section className="page-enter flex items-center justify-center px-4 py-24">
        <p className="text-text-light">Patient non spécifié.</p>
      </section>
    );
  }

  function toggleSection(index: number) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function toggleZone(zone: string) {
    setTargetZones((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone],
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!accepted || !signatureName.trim()) return;

    const now = new Date().toISOString();
    const consent: ConsentForm = {
      id: crypto.randomUUID(),
      patientId,
      formVersion: FORM_VERSION,
      treatmentName: 'Épilation laser',
      targetZones,
      acceptedAt: now,
      signatureName: sanitize(signatureName),
      legalTextSnapshot: CONSENT_LEGAL_TEXT,
      createdAt: now,
    };

    saveConsent(patientId, consent);
    setSigned(true);
    toast.success('Consentement signé et enregistré.');
  }

  const canSubmit = accepted && signatureName.trim().length > 0 && targetZones.length > 0;

  return (
    <section className="page-enter px-4 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-rose-soft px-3 py-1.5 text-sm text-text-light hover:bg-nude"
          >
            &larr; Retour
          </button>
          <h1 className="font-serif text-2xl font-bold text-text md:text-3xl">
            Consentement éclairé
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-8">
          {/* ── Legal Text ── */}
          <div className="rounded-2xl border border-rose-soft bg-white p-6">
            <h2 className="text-center font-serif text-lg font-semibold text-text">
              {parsed.header.split('\n')[0]}
            </h2>
            <p className="mt-2 text-center text-sm text-text-light">
              {parsed.header.split('\n').slice(1).join(' ').trim()}
            </p>

            {/* Accordion sections */}
            <div className="mt-6 flex flex-col gap-2">
              {parsed.sections.map((section, i) => (
                <div key={i} className="rounded-xl border border-rose-soft overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection(i)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-text transition-colors hover:bg-nude/50"
                  >
                    <span>{section.title}</span>
                    <svg
                      className={`h-4 w-4 shrink-0 text-text-light transition-transform duration-200 ${
                        openSections.has(i) ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {openSections.has(i) && (
                    <div className="border-t border-rose-soft/50 px-4 py-3">
                      {section.body.split('\n').map((line, j) => {
                        const trimmed = line.trim();
                        if (!trimmed) return null;
                        if (trimmed.startsWith('-')) {
                          return (
                            <p key={j} className="ml-4 text-sm leading-relaxed text-text-light">
                              {trimmed}
                            </p>
                          );
                        }
                        return (
                          <p key={j} className="text-sm leading-relaxed text-text-light">
                            {trimmed}
                          </p>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer text */}
            {parsed.footer && (
              <p className="mt-6 rounded-xl border border-primary-light/50 bg-primary/5 px-4 py-3 text-sm leading-relaxed text-text">
                {parsed.footer}
              </p>
            )}
          </div>

          {/* ── Target Zones ── */}
          <div className="rounded-2xl border border-rose-soft bg-white p-6">
            <h2 className="font-serif text-lg font-semibold text-text">
              Zones à traiter
            </h2>
            <p className="mt-1 text-xs text-text-light">
              Sélectionnez les zones concernées par le traitement.
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ZONE_OPTIONS.map((zone) => (
                <label
                  key={zone}
                  className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                    targetZones.includes(zone)
                      ? 'border-primary bg-primary/5'
                      : 'border-rose-soft hover:border-primary-light'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={targetZones.includes(zone)}
                    onChange={() => toggleZone(zone)}
                    className="h-5 w-5 shrink-0 rounded accent-primary"
                  />
                  <span className="text-sm text-text">{zone}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ── Acceptance & Signature ── */}
          <div className="rounded-2xl border border-rose-soft bg-white p-6">
            <h2 className="font-serif text-lg font-semibold text-text">
              Validation et signature
            </h2>

            <div className="mt-5 flex flex-col gap-5">
              {/* Acceptance checkbox */}
              <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-rose-soft p-4 transition-colors hover:border-primary-light">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="h-5 w-5 shrink-0 rounded accent-primary"
                />
                <span className="text-sm font-medium text-text">
                  J&apos;ai lu et j&apos;accepte les informations ci-dessus
                </span>
              </label>

              {/* Signature name */}
              <div className="max-w-md">
                <label htmlFor="consent-signatureName" className="block text-sm font-medium text-text">
                  Nom et prénom du patient
                </label>
                <input
                  id="consent-signatureName"
                  type="text"
                  required
                  placeholder="Nom Prénom"
                  className="mt-1 w-full rounded-lg border border-rose-soft bg-white px-3 py-2.5 text-sm text-text placeholder:text-text-light/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                />
              </div>

              {/* Auto date */}
              <p className="text-sm text-text-light">
                Date de signature :{' '}
                <span className="font-medium text-text">
                  {new Date().toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </p>

              {signed && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  Consentement déjà signé et enregistré.
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              Signer et valider
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
