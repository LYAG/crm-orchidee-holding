import type { SupportCommercial } from '@/types';

const TITLES_BY_SUPPORT: Record<string, string[]> = {
  'support-1': [
    'Présentation de l\'entreprise',
    'Notre histoire & valeurs',
    'Nos marchés cibles',
    'L\'offre Orchidée Holding',
    'Solutions sur mesure',
    'Nos clients phares',
    'Étude de cas — Secteur BTP',
    'Étude de cas — Secteur Transport',
    'Retour sur investissement',
    'Notre équipe dédiée',
    'Processus d\'onboarding',
    'Prochaines étapes',
  ],
  'support-2': [
    'Introduction & Contexte 2026',
    'Catalogue produits — Vue d\'ensemble',
    'Solution A — Gestion de parc',
    'Solution B — Conseil opérationnel',
    'Solution C — Formation métier',
    'Grille tarifaire',
    'Conditions générales',
    'Contact & Questions',
  ],
  'support-3': [
    'Notre positionnement marché',
    'Analyse concurrentielle',
    'Forces vs concurrents',
    'Différenciateurs clés',
    'Retours clients & témoignages',
    'Certifications & labels',
    'Avantages partenaires',
    'Pourquoi nous choisir ?',
    'Questions & Réponses',
    'Prochaines étapes',
  ],
};

const SLIDE_COLORS = [
  '#1a237e',
  '#1565c0',
  '#006064',
  '#2e7d32',
  '#558b2f',
  '#e65100',
  '#4e342e',
  '#4a148c',
  '#880e4f',
  '#0277bd',
  '#283593',
  '#37474f',
];

export interface SlideData {
  index: number;
  titre: string;
  couleur: string;
}

export function getSlidesForSupport(support: SupportCommercial): SlideData[] {
  const predefined = TITLES_BY_SUPPORT[support.id];
  return Array.from({ length: support.nombreSlides }, (_, i) => ({
    index: i,
    titre:
      predefined && i < predefined.length
        ? predefined[i]
        : `Slide ${i + 1}`,
    couleur: SLIDE_COLORS[i % SLIDE_COLORS.length],
  }));
}
