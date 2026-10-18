import type {
  AffichageCorrections,
  CategorieFormation,
  CibleAffectation,
  ExigenceSeuil,
  MotifRelance,
  NiveauFormation,
  PrioriteAffectation,
  PublicationResultats,
  StatutAffectation,
  StatutEtape,
  StatutPublication,
  StatutTentative,
  TypeEvaluation,
  TypeLecon,
  TypeNotificationFormation,
  TypeQuestion,
} from '@/types/formation';

interface Libelle {
  label: string;
  color: string;
}

export const CATEGORIES: Record<CategorieFormation, string> = {
  PRODUITS_PHARMACEUTIQUES: 'Produits pharmaceutiques',
  ANTISEPTIQUES: 'Antiseptiques',
  TECHNIQUES_VENTE: 'Techniques de vente',
  REGLEMENTATION: 'Réglementation',
  PROCEDURES_INTERNES: 'Procédures internes',
  AUTRE: 'Autre',
};

export const NIVEAUX: Record<NiveauFormation, string> = {
  DEBUTANT: 'Débutant',
  INTERMEDIAIRE: 'Intermédiaire',
  AVANCE: 'Avancé',
};

export const EXIGENCES: Record<ExigenceSeuil, { label: string; aide: string }> = {
  LES_DEUX: {
    label: 'Modules et évaluation finale',
    aide: 'Le seuil doit être atteint à chaque quiz obligatoire de module et à l’évaluation finale.',
  },
  MODULES: {
    label: 'Quiz de chaque module',
    aide: 'Le seuil est exigé aux quiz de module ; l’évaluation finale doit seulement être passée.',
  },
  FINALE: {
    label: 'Évaluation finale uniquement',
    aide: 'Les quiz de module doivent être passés ; seul le seuil de l’évaluation finale compte.',
  },
};

export const STATUTS_PUBLICATION: Record<StatutPublication, Libelle> = {
  BROUILLON: { label: 'Brouillon', color: 'default' },
  PUBLIEE: { label: 'Publiée', color: 'green' },
  ARCHIVEE: { label: 'Archivée', color: 'purple' },
};

export const STATUTS_AFFECTATION: Record<StatutAffectation, Libelle> = {
  NON_COMMENCEE: { label: 'Non commencée', color: 'default' },
  EN_COURS: { label: 'En cours', color: 'blue' },
  EN_ATTENTE_CORRECTION: { label: 'En attente de correction', color: 'gold' },
  REUSSIE: { label: 'Réussie', color: 'green' },
  ECHOUEE: { label: 'Échouée', color: 'red' },
  ANNULEE: { label: 'Annulée', color: 'default' },
};

export const STATUTS_TENTATIVE: Record<StatutTentative, Libelle> = {
  EN_COURS: { label: 'En cours', color: 'blue' },
  EN_ATTENTE_CORRECTION: { label: 'En attente', color: 'gold' },
  REUSSIE: { label: 'Réussie', color: 'green' },
  ECHOUEE: { label: 'Échouée', color: 'red' },
};

export const STATUTS_ETAPE: Record<StatutEtape, Libelle> = {
  VERROUILLE: { label: 'Verrouillé', color: 'default' },
  A_FAIRE: { label: 'À faire', color: 'default' },
  EN_COURS: { label: 'En cours', color: 'blue' },
  EN_ATTENTE_CORRECTION: { label: 'En attente de correction', color: 'gold' },
  TERMINEE: { label: 'Terminé', color: 'cyan' },
  REUSSIE: { label: 'Réussi', color: 'green' },
  VALIDE: { label: 'Validé', color: 'green' },
  ECHOUEE: { label: 'Échoué', color: 'red' },
};

export const TYPES_EVALUATION: Record<TypeEvaluation, string> = {
  EXERCICE_REVISION: 'Exercice de révision',
  QUIZ_ENTRAINEMENT: 'Quiz d’entraînement',
  EVALUATION_FINALE: 'Évaluation finale',
};

export const TYPES_QUESTION: Record<TypeQuestion, { label: string; aide: string }> = {
  QCM_UNIQUE: { label: 'QCM — réponse unique', aide: 'Une seule bonne réponse parmi les propositions.' },
  QCM_MULTIPLE: { label: 'QCM — réponses multiples', aide: 'Il faut cocher exactement toutes les bonnes réponses.' },
  VRAI_FAUX: { label: 'Vrai / faux', aide: 'Deux propositions, une seule est correcte.' },
  REPONSE_COURTE: {
    label: 'Réponse courte',
    aide: 'Comparée aux réponses acceptées, sans tenir compte des majuscules ni des accents.',
  },
  MANUELLE: { label: 'Correction manuelle', aide: 'Réponse libre notée par un manager ou un administrateur.' },
};

export const TYPES_LECON: Record<TypeLecon, string> = {
  TEXTE: 'Texte',
  PDF: 'PDF',
  IMAGE: 'Image',
  VIDEO: 'Vidéo',
  LIEN: 'Lien externe',
  AUTRE: 'Autre support',
};

export const PUBLICATIONS_RESULTATS: Record<PublicationResultats, string> = {
  IMMEDIATE: 'Dès la correction terminée',
  DIFFEREE: 'Après publication par un manager',
};

export const AFFICHAGES_CORRECTIONS: Record<AffichageCorrections, string> = {
  APRES_SOUMISSION: 'Dès que le résultat est visible',
  APRES_REUSSITE: 'Seulement après réussite',
  APRES_DERNIERE_TENTATIVE: 'Après réussite ou dernière tentative',
  JAMAIS: 'Jamais',
};

export const CIBLES: Record<CibleAffectation, string> = {
  DELEGUES: 'Délégués choisis',
  EQUIPE: 'Une équipe',
  REGION: 'Une région',
  PERIMETRE: 'Tout le périmètre',
};

export const PRIORITES: Record<PrioriteAffectation, Libelle> = {
  BASSE: { label: 'Basse', color: 'default' },
  NORMALE: { label: 'Normale', color: 'blue' },
  HAUTE: { label: 'Haute', color: 'volcano' },
};

export const MOTIFS_RELANCE: Record<MotifRelance, Libelle> = {
  RETARD: { label: 'En retard', color: 'red' },
  ECHEANCE_PROCHE: { label: 'Échéance proche', color: 'orange' },
  ECHEC: { label: 'En échec', color: 'magenta' },
  INACTIF: { label: 'Inactif', color: 'default' },
};

export const NOTIFICATIONS: Record<TypeNotificationFormation, string> = {
  NOUVELLE_FORMATION: 'Nouvelle formation',
  NOUVEL_EXERCICE: 'Nouvel exercice',
  ECHEANCE_PROCHE: 'Échéance proche',
  RETARD: 'Retard',
  EVALUATION_TERMINEE: 'Évaluation terminée',
  RESULTAT_DISPONIBLE: 'Résultat disponible',
  ECHEC: 'Échec',
  NOUVELLE_TENTATIVE_AUTORISEE: 'Nouvelle tentative autorisée',
  FORMATION_VALIDEE: 'Formation validée',
  CORRECTION_TERMINEE: 'Correction terminée',
  RELANCE: 'Relance',
};

/** Options de Select à partir d'un dictionnaire de libellés. */
export function options<K extends string>(dico: Record<K, string | { label: string }>): { value: K; label: string }[] {
  return (Object.keys(dico) as K[]).map((k) => {
    const v = dico[k];
    return { value: k, label: typeof v === 'string' ? v : v.label };
  });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateHeure(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatScore(score: number | null | undefined): string {
  if (score == null) return '—';
  return `${score.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}/100`;
}

export function formatDuree(minutes: number | null | undefined): string {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function messageErreur(err: unknown, defaut: string): string {
  return err instanceof Error && err.message ? err.message : defaut;
}

/** Téléchargement d'un Blob côté navigateur. */
export function telecharger(blob: Blob, nomFichier: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomFichier;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
