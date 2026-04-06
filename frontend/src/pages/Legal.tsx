import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

type LegalTab = 'mentions' | 'cgu' | 'cgv' | 'rgpd' | 'cookies';

const TABS: { key: LegalTab; label: string }[] = [
  { key: 'mentions', label: 'Mentions légales' },
  { key: 'cgu', label: 'CGU' },
  { key: 'cgv', label: 'CGV' },
  { key: 'rgpd', label: 'RGPD' },
  { key: 'cookies', label: 'Cookies' },
];

const VALID_TABS = new Set<string>(['mentions', 'cgu', 'cgv', 'rgpd', 'cookies']);

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 mt-6 text-base font-bold text-text first:mt-0">{children}</h2>;
}

function MentionsLegales() {
  return (
    <>
      <H2>Éditeur</H2>
      <p>AA LASERMED — SAS au capital de 1 000 €</p>
      <p>RCS Meaux 100 897 057 — EUID FR7701.100897057</p>
      <p>49 rue du Bois de la Garenne, 77700 Magny-le-Hongre</p>
      <p>E-mail : aalasermed@gmail.com</p>

      <H2>Directrice de la publication</H2>
      <p>Mme Aline Tosun, Présidente.</p>

      <H2>Hébergement</H2>
      <p>Vercel Inc. — 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.</p>
      <p>Données applicatives : Supabase Inc. — 970 Toa Payoh North #07-04, Singapour.</p>

      <H2>Propriété intellectuelle</H2>
      <p>
        L&apos;ensemble du contenu de ce site est la propriété exclusive de AA LASERMED.
        Toute reproduction est interdite sans autorisation écrite préalable
        (art. L.111-1 et L.123-1 du Code de la propriété intellectuelle).
      </p>

      <H2>Responsabilité</H2>
      <p>
        Les informations présentes sur ce site ne constituent pas un avis médical.
        AA LASERMED ne garantit pas l&apos;exactitude des informations diffusées.
      </p>

      <H2>Crédits</H2>
      <p>Développement : Antoine Rios. Photographies : AA LASERMED / Candela Medical.</p>
    </>
  );
}

function CGU() {
  return (
    <>
      <H2>Objet</H2>
      <p>
        Les présentes CGU définissent les conditions d&apos;accès et d&apos;utilisation du site aalasermed.fr,
        édité par AA LASERMED. L&apos;accès au site implique l&apos;acceptation des présentes CGU.
      </p>

      <H2>Accès au site</H2>
      <p>
        Le site est accessible gratuitement. AA LASERMED peut suspendre l&apos;accès pour maintenance
        sans préavis.
      </p>

      <H2>Compte utilisateur</H2>
      <p>
        L&apos;utilisateur qui crée un compte s&apos;engage à fournir des informations exactes,
        à préserver la confidentialité de ses identifiants et à ne pas céder son compte.
        La prise de rendez-vous est également possible sans compte.
      </p>

      <H2>Utilisation</H2>
      <p>
        L&apos;utilisateur s&apos;engage à utiliser le site conformément à sa destination et à ne pas
        tenter de perturber son fonctionnement.
      </p>

      <H2>Modification</H2>
      <p>
        AA LASERMED peut modifier les présentes CGU à tout moment. Les modifications prennent
        effet dès publication.
      </p>

      <H2>Droit applicable</H2>
      <p>Droit français. Tribunaux compétents : Meaux.</p>
    </>
  );
}

function CGV() {
  return (
    <>
      <H2>Champ d&apos;application</H2>
      <p>
        Les présentes CGV s&apos;appliquent à toutes les prestations d&apos;épilation laser proposées
        par AA LASERMED (SAS, RCS Meaux 100 897 057, 49 rue du Bois de la Garenne, 77700 Magny-le-Hongre).
        Toute réservation implique leur acceptation.
      </p>

      <H2>Prestations et tarifs</H2>
      <p>
        Première consultation gratuite et obligatoire. Séances facturées par zone, tarifs TTC
        indiqués sur la page Tarifs. Tarifs modifiables à tout moment ; ceux applicables sont
        ceux en vigueur au jour de la réservation.
      </p>

      <H2>Rendez-vous</H2>
      <p>
        Réservation en ligne ou par téléphone. Horaires : mardi–samedi 09h30–21h00,
        dimanche 09h30–14h00, lundi fermé.
      </p>

      <H2>Annulation et déplacement</H2>
      <p>
        Annulation ou déplacement possible jusqu&apos;à <strong>24 heures</strong> avant le rendez-vous.
        Au-delà, le rendez-vous pourra être facturé.
        AA LASERMED peut annuler en cas de circonstances exceptionnelles.
      </p>

      <H2>Paiement</H2>
      <p>Règlement sur place le jour de la séance. Carte bancaire, espèces.</p>

      <H2>Consultation préalable</H2>
      <p>
        Obligatoire avant toute séance. Inclut l&apos;évaluation du phototype, la vérification
        des contre-indications, un tir d&apos;essai et la signature du consentement éclairé.
      </p>

      <H2>Responsabilité du client</H2>
      <p>
        Le client s&apos;engage à signaler tout antécédent médical ou traitement en cours
        pouvant constituer une contre-indication.
      </p>

      <H2>Réclamations et litiges</H2>
      <p>
        Réclamations : aalasermed@gmail.com. Médiation possible (art. L.611-1 du Code de
        la consommation). À défaut, tribunaux de Meaux.
      </p>
    </>
  );
}

function RGPD() {
  return (
    <>
      <H2>Responsable du traitement</H2>
      <p>AA LASERMED — 49 rue du Bois de la Garenne, 77700 Magny-le-Hongre — aalasermed@gmail.com.</p>

      <H2>Données collectées</H2>
      <ul className="ml-4 list-disc space-y-1">
        <li>Compte : prénom, nom, e-mail, téléphone</li>
        <li>Réservation sans compte : prénom, nom, téléphone, e-mail</li>
        <li>Dossier patient : données médicales, antécédents, consentement</li>
        <li>Navigation : cookies techniques, adresse IP</li>
      </ul>

      <H2>Finalités</H2>
      <p>
        Gestion des rendez-vous, exécution des prestations, relation client,
        notifications liées aux rendez-vous, obligations légales.
      </p>

      <H2>Conservation</H2>
      <ul className="ml-4 list-disc space-y-1">
        <li>Données de compte : durée de la relation + 3 ans</li>
        <li>Données médicales : 20 ans (art. R.1112-7 du Code de la santé publique)</li>
        <li>Cookies : 13 mois maximum</li>
      </ul>

      <H2>Destinataires</H2>
      <p>
        Supabase Inc. (hébergement données), Vercel Inc. (hébergement site), Google LLC (Google Maps).
        Transferts hors UE encadrés par clauses contractuelles types.
      </p>

      <H2>Vos droits</H2>
      <p>
        Accès, rectification, effacement, limitation, portabilité, opposition, retrait du consentement.
        Contact : aalasermed@gmail.com.
        Réclamation : CNIL — cnil.fr — 3 Place de Fontenoy, 75334 Paris Cedex 07.
      </p>
    </>
  );
}

function Cookies() {
  return (
    <>
      <H2>Cookies nécessaires</H2>
      <p>Cookies d&apos;authentification Supabase (session utilisateur). Indispensables au fonctionnement.</p>

      <H2>Cookies tiers</H2>
      <ul className="ml-4 list-disc space-y-1">
        <li>
          <strong>Google Maps</strong> (Google LLC) — carte interactive sur la page Contact.{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-dark underline">Politique</a>
        </li>
        <li>
          <strong>Vercel</strong> (Vercel Inc.) — hébergement et performances.{' '}
          <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary-dark underline">Politique</a>
        </li>
        <li>
          <strong>Supabase</strong> (Supabase Inc.) — authentification.{' '}
          <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-dark underline">Politique</a>
        </li>
      </ul>

      <H2>Gestion</H2>
      <p>
        Gérez vos cookies via les paramètres de votre navigateur (Confidentialité &gt; Cookies).
        La désactivation des cookies nécessaires peut altérer le fonctionnement du site.
      </p>
    </>
  );
}

const CONTENT: Record<LegalTab, () => React.JSX.Element> = {
  mentions: MentionsLegales,
  cgu: CGU,
  cgv: CGV,
  rgpd: RGPD,
  cookies: Cookies,
};

export default function Legal() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') ?? 'mentions';
  const initialTab = VALID_TABS.has(tabParam) ? (tabParam as LegalTab) : 'mentions';

  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  useEffect(() => {
    if (VALID_TABS.has(tabParam)) setActiveTab(tabParam as LegalTab);
  }, [tabParam]);

  const Content = CONTENT[activeTab];

  return (
    <section className="page-enter px-4 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-center font-serif text-3xl font-bold text-text md:text-4xl">
          Informations l&eacute;gales
        </h1>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                activeTab === key
                  ? 'bg-primary text-white shadow-md'
                  : 'border border-rose-soft bg-white text-text-light hover:border-primary-light'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div key={activeTab} className="auth-form-enter mt-8 text-sm leading-relaxed text-text-light">
          <Content />
        </div>

        <p className="mt-10 text-center text-xs text-text-light/50">
          Derni&egrave;re mise &agrave; jour : avril 2026
        </p>
      </div>
    </section>
  );
}
