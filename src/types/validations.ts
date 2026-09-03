import type { CategorieEtablissement, StatutProfessionnel, TitreProfessionnel } from './professionnels';

export interface DonneesChangementClassification {
  statutActuel: StatutProfessionnel;
  statutDemande: StatutProfessionnel;
}

/**
 * Sous-ensemble volontaire des champs de ProfessionnelSante (identité/coordonnées) — jamais
 * statut/delegueId/actif, qui ne doivent pas pouvoir être écrasés par une proposition en attente
 * qui daterait d'avant un autre changement entre-temps. Miroir de ModificationProfessionnelRequest
 * côté backend.
 */
export interface DonneesModificationProfessionnel {
  nom: string;
  prenom?: string;
  titre?: TitreProfessionnel;
  categorie?: CategorieEtablissement;
  centreId: string;
  specialiteIds: string[];
  telephones: string[];
  observations?: string;
}

export enum TypeDemandeValidation {
  DOUBLON_PROFESSIONNEL = 'DOUBLON_PROFESSIONNEL',
  NOUVEAU_CENTRE = 'NOUVEAU_CENTRE',
  NOUVELLE_SPECIALITE = 'NOUVELLE_SPECIALITE',
  NOUVEAU_GESTE = 'NOUVEAU_GESTE',
  CHANGEMENT_CLASSIFICATION = 'CHANGEMENT_CLASSIFICATION',
  MODIFICATION_PROFESSIONNEL = 'MODIFICATION_PROFESSIONNEL',
}

export enum StatutDemandeValidation {
  EN_ATTENTE = 'EN_ATTENTE',
  APPROUVEE = 'APPROUVEE',
  REJETEE = 'REJETEE',
}

export interface DemandeValidation {
  id: string;
  type: TypeDemandeValidation;
  delegueId: string;
  dateCreation: string;
  statut: StatutDemandeValidation;
  /** Résumé lisible affiché à l'admin */
  libelle: string;
  /** Payload nécessaire pour créer l'entité définitive à l'approbation */
  donnees: Record<string, unknown>;
  /** Pour DOUBLON_PROFESSIONNEL : la fiche existante potentiellement concernée */
  professionnelExistantId?: string;
}
