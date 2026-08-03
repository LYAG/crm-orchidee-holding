import type { JourSemaine, JoursConsultation, PotentielCas } from '@/types';

/** Ligne brute après lecture du fichier + propagation des cellules fusionnées. */
export interface LigneBrute {
  ligneExcel: number;
  jour: string;
  centre: string;
  specialite: string;
  nomEtPrenom: string;
  numero: string;
  jrsCons: string;
  nbreDeCas: string;
  action: string;
  observation: string;
}

export type StatutLigne = 'PRETE' | 'A_VERIFIER' | 'DOUBLON';

/** Une fiche professionnel prête à être créée, issue d'une ligne brute (éclatée si multi-noms). */
export interface ProfessionnelAImporter {
  cle: string;
  ligneExcel: number;

  jourTournee: JourSemaine | null;

  centreBrut: string;
  centreId?: string;
  centreACreer?: boolean;

  specialiteBrut: string;
  specialiteIds: string[];
  specialitesInconnues: string[];

  nom: string;
  telephones: string[];
  telephonesInvalides: string[];

  jrsConsBrut: string;
  joursConsultation: JoursConsultation | null;

  nbreDeCasBrut: string;
  potentielCas: PotentielCas | null;

  actionBrut: string;
  gesteIds: string[];
  gestesInconnus: string[];

  observation?: string;

  statut: StatutLigne;
  doublonProfessionnelId?: string;
  actionDoublon?: 'IGNORER' | 'REMPLACER' | 'CREER_QUAND_MEME';
}
