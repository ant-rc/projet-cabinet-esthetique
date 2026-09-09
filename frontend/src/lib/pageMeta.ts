import { servicesData } from '../data/pricing'
import { WEEKDAY_CLOSING, SUNDAY_OPENING, SUNDAY_CLOSING } from '../data/openingHours'
import { faqPages } from '../data/faqPages'
import { servicePath } from './serviceRoutes'
import type { DbService } from '../types'

/**
 * Single source of truth for page metadata.
 *
 * The app renders these through the Seo component, and the build prerenders
 * them into one HTML file per route. Both read this module, so a page cannot
 * advertise one title to a crawler that executes JavaScript and another to one
 * that does not.
 */

export interface PageMeta {
  path: string
  title: string
  description: string
  noindex?: boolean
}

const SESSIONS_MIN = 6
const SESSIONS_MAX = 8

/**
 * Amplitude tarifaire calculée depuis le catalogue.
 *
 * Elle était écrite en dur et annonçait 370 € alors que le prix le plus élevé
 * publié est inférieur : une description ne doit pas promettre une grille que
 * les pages ne servent pas.
 */
const PRICES = servicesData.map((s) => s.price)
export const PRICE_MIN = Math.min(...PRICES)
export const PRICE_MAX = Math.max(...PRICES)

/** Static routes, in sitemap order. */
export const STATIC_PAGES: PageMeta[] = [
  {
    path: '/',
    title: 'Épilation laser définitive à Magny-le-Hongre | AA Laser Med',
    description:
      "Centre d'épilation laser définitive à Magny-le-Hongre (Val d'Europe). Infirmière diplômée d'État, laser Candela GentleMax Pro, tous phototypes. Tarifs affichés, 1re consultation gratuite.",
  },
  {
    path: '/tarifs',
    title: 'Tarifs épilation laser à Magny-le-Hongre | AA Laser Med',
    description:
      `Tous les tarifs d'épilation laser définitive, femme et homme, de ${PRICE_MIN} € à ${PRICE_MAX} €. Prix affichés par zone, sans devis. Consultation gratuite de 30 min avec tir d'essai.`,
  },
  {
    path: '/reservation',
    title: 'Prendre rendez-vous | Épilation laser Magny-le-Hongre',
    description:
      `Réservez votre séance d'épilation laser définitive à Magny-le-Hongre. Première consultation gratuite de 30 minutes, tir d'essai inclus. Ouvert 7j/7, en semaine jusqu'à ${WEEKDAY_CLOSING}.`,
  },
  {
    path: '/contact',
    title: 'Contact et accès | AA Laser Med, Magny-le-Hongre',
    description:
      `AA Laser Med, 49 rue du Bois de la Garenne, 77700 Magny-le-Hongre. Gare de Val d'Europe, bus 2234, parking gratuit. Ouvert 7j/7, en semaine jusqu'à ${WEEKDAY_CLOSING}, dimanche ${SUNDAY_OPENING}-${SUNDAY_CLOSING}.`,
  },
  {
    path: '/faq',
    title: "Questions fréquentes sur l'épilation laser | AA Laser Med",
    description:
      "Douleur, nombre de séances, contre-indications, phototypes, préparation : les réponses aux questions posées avant une première séance d'épilation laser à Magny-le-Hongre.",
  },
  {
    path: '/mentions-legales',
    title: 'Mentions légales et politique RGPD | AA Laser Med',
    description:
      "Mentions légales, conditions générales de vente et d'utilisation, politique de confidentialité et gestion des cookies d'AA LASERMED.",
  },
  {
    path: '/login',
    title: 'Connexion | AA Laser Med',
    description: 'Accédez à votre espace patient AA Laser Med.',
    noindex: true,
  },
]

/** Looked up by path so a page cannot drift from what the build prerenders. */
export function staticMeta(path: string): PageMeta {
  const meta = STATIC_PAGES.find((p) => p.path === path)
  if (!meta) throw new Error(`No metadata declared for ${path}`)
  return meta
}

export function serviceMeta(service: DbService): PageMeta {
  const gender = service.gender === 'female' ? 'femme' : 'homme'
  const zone = service.name.toLowerCase()
  return {
    path: servicePath(service),
    title: `Épilation laser ${zone} ${gender} | ${service.price} € la séance | Magny-le-Hongre`,
    description: `Épilation laser définitive ${zone} ${gender} à Magny-le-Hongre : ${service.price} € la séance, ${service.duration} min. Comptez ${SESSIONS_MIN} à ${SESSIONS_MAX} séances. Consultation gratuite avec tir d'essai.`,
  }
}

/** Every page the build should prerender. */
export const ALL_PAGES: PageMeta[] = [
  ...STATIC_PAGES,
  ...servicesData.map(serviceMeta),
  ...faqPages.map((page) => ({
    path: `/faq/${page.slug}`,
    title: `${page.title} | AA Laser Med`,
    description: page.description,
  })),
]
