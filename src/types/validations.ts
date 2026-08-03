export enum TypeDemandeValidation {
  DOUBLON_PROFESSIONNEL = 'DOUBLON_PROFESSIONNEL',
  NOUVEAU_CENTRE = 'NOUVEAU_CENTRE',
  NOUVELLE_SPECIALITE = 'NOUVELLE_SPECIALITE',
  NOUVEAU_GESTE = 'NOUVEAU_GESTE',
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
