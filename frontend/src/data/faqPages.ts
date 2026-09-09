import { faqData } from './pricing';
import type { FAQItem } from '../types';

/**
 * Page layer over the FAQ.
 *
 * The answers themselves stay in pricing.ts: that wording is the client's and
 * must not be rewritten here. This module only adds what a standalone page
 * needs — a URL, a search-facing title and description, and context drawn from
 * facts already published elsewhere on the site.
 *
 * Questions are matched by their exact text. A typo in pricing.ts drops the
 * page rather than shipping a mismatched one — see faqPages below.
 */

export interface FaqPage {
  slug: string;
  /** Must match a question in faqData verbatim. */
  question: string;
  /** Shorter, search-facing heading. Falls back to the question. */
  title: string;
  description: string;
  /** Extra paragraphs, each grounded in facts published elsewhere on the site. */
  context: string[];
}

const PAGES: FaqPage[] = [
  {
    slug: 'est-ce-douloureux',
    question: 'Est-ce douloureux ?',
    title: "L'épilation laser est-elle douloureuse ?",
    description:
      "La sensation est proche d'un léger picotement. Le refroidissement CryoAir du GentleMax Pro souffle de l'air froid en continu pendant le tir. Ce qu'il faut savoir avant une première séance à Magny-le-Hongre.",
    context: [
      "La consultation initiale comprend un tir d'essai gratuit : vous jugez vous-même la sensation sur votre peau avant de vous engager sur un protocole complet.",
      "Les zones les plus sensibles sont généralement le maillot, les aisselles et la lèvre supérieure. Une crème anesthésiante peut y être conseillée, à appliquer une heure avant la séance.",
    ],
  },
  {
    slug: 'nombre-de-seances',
    question: 'Combien de séances sont nécessaires ?',
    title: "Combien de séances d'épilation laser faut-il ?",
    description:
      "En moyenne 6 à 8 séances espacées de 4 à 8 semaines, avec une réduction déjà nette dès la 3e. Le détail du protocole et le coût total, zone par zone.",
    context: [
      "Le laser n'agit que sur les poils en phase de croissance, qui ne sont jamais tous synchronisés : c'est la seule raison pour laquelle plusieurs séances sont nécessaires.",
      "Le coût d'un protocole se calcule donc en multipliant le prix d'une séance par 6 à 8. Chaque page de zone affiche cette fourchette, sans devis à demander.",
    ],
  },
  {
    slug: 'contre-indications',
    question: 'Quelles sont les contre-indications ?',
    title: "Contre-indications de l'épilation laser",
    description:
      "Grossesse, allaitement, maladies auto-immunes, infections cutanées actives, anticoagulants, traitements photosensibilisants : la liste des contre-indications formelles et temporaires.",
    context: [
      "Ces points sont vérifiés lors de la consultation initiale, au moyen d'un questionnaire médical rempli avec la praticienne, infirmière diplômée d'État.",
      "Une contre-indication temporaire ne ferme pas la porte : elle décale le début du protocole. En cas de doute sur un traitement en cours, parlez-en à votre médecin avant la consultation.",
    ],
  },
  {
    slug: 'phototypes-et-peaux-foncees',
    question: 'L’épilation laser est-elle adaptée à tous les types de peau ?',
    title: 'Épilation laser sur peau mate, foncée ou noire',
    description:
      "Les phototypes I à VI sont traités, grâce à la double technologie Alexandrite et Nd:YAG du Candela GentleMax Pro. Ce que cela change concrètement selon votre peau.",
    context: [
      "La longueur d'onde Nd:YAG (1064 nm) pénètre plus profondément et cible moins la mélanine de l'épiderme, ce qui la rend adaptée aux peaux mates à foncées ; l'Alexandrite (755 nm) est privilégiée sur les peaux claires.",
      "Le paramétrage est décidé en consultation après évaluation de votre phototype. Seuls les poils clairs, blancs ou roux ne répondent pas au laser, quelle que soit la couleur de peau.",
    ],
  },
  {
    slug: 'preparer-sa-seance',
    question: 'Comment se préparer avant la séance ?',
    title: "Comment préparer sa séance d'épilation laser",
    description:
      "Rasage la veille, peau propre sans crème ni déodorant, pas de cire ni de pince depuis 3 semaines, pas de soleil ni d'autobronzant. La préparation complète.",
    context: [
      "Le rasage est indispensable et la cire est proscrite : le laser vise le pigment du poil dans le follicule, qui doit rester en place, mais un poil dépassant de la peau brûlerait en surface.",
      "Une peau bronzée concentre davantage de mélanine et impose de réduire la puissance, donc l'efficacité de la séance. C'est la raison des délais demandés avant et après exposition.",
    ],
  },
  {
    slug: 'apres-la-seance',
    question: 'Quelles précautions après le traitement ?',
    title: "Après une séance d'épilation laser : les précautions",
    description:
      "Crème apaisante, pas de sauna ni de sport intensif pendant 48 h, SPF 50+ en cas d'exposition. Les suites normales et les gestes à éviter.",
    context: [
      "Une rougeur légère et une sensation de chaleur dans les heures qui suivent sont attendues. Une réaction qui s'aggrave ou se prolonge doit être signalée au cabinet.",
      "Les poils traités tombent progressivement dans les deux à trois semaines suivantes : ce n'est pas une repousse.",
    ],
  },
  {
    slug: 'consultation-initiale',
    question: 'La consultation initiale est-elle obligatoire ?',
    title: 'La consultation initiale est-elle obligatoire ?',
    description:
      "Oui, et elle est gratuite : 30 minutes pour évaluer votre phototype, écarter les contre-indications et réaliser un tir d'essai. Sans engagement.",
    context: [
      "Elle est gratuite et comprend un tir d'essai. Aucun devis payant, aucun frais de dossier : vous repartez avec un protocole chiffré et vous décidez ensuite.",
      "Elle se réserve en ligne, à tout moment, comme les séances suivantes.",
    ],
  },
  {
    slug: 'laser-candela-gentlemax-pro',
    question: 'Quelle technologie utilisez-vous ?',
    title: 'Le laser Candela GentleMax Pro',
    description:
      "Double technologie Alexandrite (755 nm) et Nd:YAG (1064 nm), refroidissement CryoAir intégré, phototypes I à VI. Le matériel utilisé au cabinet.",
    context: [
      "Disposer des deux longueurs d'onde sur un même appareil permet d'adapter le tir au phototype plutôt que d'adapter le patient à la machine.",
      "Le CryoAir souffle de l'air froid en continu pendant le tir, ce qui protège l'épiderme et réduit nettement la sensation de chaleur.",
    ],
  },
];

/** Answer text stays owned by pricing.ts; a page without a match is dropped. */
export interface ResolvedFaqPage extends FaqPage {
  answer: string;
}

/**
 * French typography puts a non-breaking space before "?", and pricing.ts uses
 * real ones. Matching on the raw string would hinge on an invisible character,
 * so whitespace is collapsed on both sides before comparing.
 */
function normalizeQuestion(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export const faqPages: ResolvedFaqPage[] = PAGES.flatMap((page) => {
  const source: FAQItem | undefined = faqData.find(
    (f) => normalizeQuestion(f.question) === normalizeQuestion(page.question),
  );
  // Keep the client's exact wording, punctuation included, for display and for
  // lookups against faqData elsewhere.
  return source ? [{ ...page, question: source.question, answer: source.answer }] : [];
});

export function findFaqPage(slug: string | undefined): ResolvedFaqPage | null {
  if (!slug) return null;
  return faqPages.find((p) => p.slug === slug) ?? null;
}

export function relatedFaqPages(slug: string, limit = 3): ResolvedFaqPage[] {
  return faqPages.filter((p) => p.slug !== slug).slice(0, limit);
}

