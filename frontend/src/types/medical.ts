export type FitzpatrickType = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';

export interface MedicalIntakeForm {
  id: string;
  patientId: string;
  formVersion: string;
  // Personal info
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
  // Skin evaluation
  fitzpatrickType: FitzpatrickType;
  naturalTan: boolean;
  selfTanningCream: boolean;
  lastUvExposureDate: string;
  // Medical
  medicationList: string;
  allergyList: string;
  medicalDetails: string;
  remarks: string;
  // Flags
  medicalFlags: MedicalHistoryFlag[];
  createdAt: string;
  updatedAt: string;
}

export interface MedicalHistoryFlag {
  code: string;
  label: string;
  value: boolean;
  details: string;
}

export const MEDICAL_FLAG_CODES: { code: string; label: string }[] = [
  { code: 'pacemaker', label: 'Pacemaker' },
  { code: 'metallic_implants', label: 'Implants métalliques' },
  { code: 'pregnancy_or_breastfeeding', label: 'Grossesse ou allaitement' },
  { code: 'immune_deficiency', label: 'Déficit immunitaire' },
  { code: 'skin_cancer_history', label: 'Antécédents de cancer de la peau' },
  { code: 'inflammation_on_treatment_area', label: 'Inflammation sur la zone de traitement' },
  { code: 'photosensitive_disease', label: 'Maladie photosensible' },
  { code: 'heat_triggered_disease', label: 'Maladie déclenchée par la chaleur' },
  { code: 'endocrine_disorder', label: 'Trouble endocrinien' },
  { code: 'fillers_injections', label: 'Injections / fillers' },
  { code: 'permanent_makeup', label: 'Maquillage permanent' },
  { code: 'tanned_skin', label: 'Peau bronzée' },
  { code: 'recent_surgery', label: 'Chirurgie récente' },
  { code: 'recent_peeling_or_resurfacing', label: 'Peeling ou resurfaçage récent' },
  { code: 'photosensitizing_drugs', label: 'Médicaments photosensibilisants' },
  { code: 'scar_healing_disorder', label: 'Trouble de cicatrisation' },
  { code: 'cardiac_issue', label: 'Problème cardiaque' },
  { code: 'recent_wax_or_electric_hair_removal', label: 'Épilation cire/électrique récente' },
];

export interface ConsentForm {
  id: string;
  patientId: string;
  formVersion: string;
  treatmentName: string;
  targetZones: string[];
  acceptedAt: string;
  signatureName: string;
  legalTextSnapshot: string;
  createdAt: string;
}

export interface TreatmentSession {
  id: string;
  patientId: string;
  appointmentId: string | null;
  date: string;
  zone: string;
  // Laser parameters
  spotSize: string;
  fluence: string;
  pulseDuration: string;
  coolingLevel: string;
  // Observations
  endpointObservation: string;
  adverseEffects: string;
  comments: string;
  // Metadata
  skinType: FitzpatrickType;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const CONSENT_LEGAL_TEXT = `CONSENTEMENT ÉCLAIRÉ — ÉPILATION LASER

Je soussigné(e) certifie avoir été informé(e) des éléments suivants :

1. NATURE DU TRAITEMENT
L'épilation laser utilise un faisceau lumineux qui cible la mélanine du poil pour détruire le follicule pileux. Le traitement est réalisé avec le laser Candela GentleMax Pro (Alexandrite & Nd:YAG).

2. RÉSULTATS ATTENDUS
Le traitement permet une réduction significative et durable de la pilosité. Plusieurs séances (6 à 8 en moyenne) sont nécessaires. Les résultats varient selon le type de peau et de poil.

3. EFFETS SECONDAIRES POSSIBLES
- Rougeurs et sensations de chaleur (quelques heures)
- Léger gonflement périfolliculaire
- Dans de rares cas : brûlures superficielles, hypo/hyperpigmentation temporaire, croûtes

4. CONTRE-INDICATIONS
- Grossesse et allaitement
- Exposition solaire récente (2-6 semaines)
- Prise de médicaments photosensibilisants
- Infections cutanées actives sur la zone
- Maladies auto-immunes, troubles de coagulation

5. PRÉCAUTIONS
- Raser la zone la veille
- Pas de cire ni d'épilateur 3 semaines avant
- Pas d'exposition solaire 2-6 semaines avant et après
- Appliquer SPF 50+ après la séance

6. DROIT DE RETRAIT
Je suis libre d'interrompre le traitement à tout moment.

En signant ce formulaire, je confirme avoir lu, compris et accepté les informations ci-dessus, et donne mon consentement éclairé pour le traitement d'épilation laser sur les zones indiquées.`;
