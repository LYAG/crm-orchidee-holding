import type { UserRole } from '@/lib/constants';
import type {
  Centre,
  DemandeValidation,
  FiltresProfessionnel,
  GesteMarketing,
  GesteRealise,
  JourTournee,
  ProfessionnelSante,
  Specialite,
  StatutDemandeValidation,
} from '@/types';

export type CreateCentreDto = Omit<Centre, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCentreDto = Partial<Omit<Centre, 'id' | 'createdAt' | 'updatedAt'>>;

export type CreateSpecialiteDto = Omit<Specialite, 'id'>;
export type UpdateSpecialiteDto = Partial<Omit<Specialite, 'id'>>;

export type CreateGesteMarketingDto = Omit<GesteMarketing, 'id'>;
export type UpdateGesteMarketingDto = Partial<Omit<GesteMarketing, 'id'>>;

export type CreateProfessionnelDto = Omit<
  ProfessionnelSante,
  'id' | 'createdAt' | 'updatedAt' | 'aDejaEuContact'
>;
export type UpdateProfessionnelDto = Partial<
  Omit<ProfessionnelSante, 'id' | 'createdAt' | 'updatedAt' | 'aDejaEuContact'>
>;

export type CreateGesteRealiseDto = Omit<GesteRealise, 'id'>;

export interface StatistiquesGestes {
  nbGestesCeMois: number;
  coutTotalFcfaCeMois: number;
  topGestes: { gesteMarketingId: string; libelle: string; nbFois: number }[];
}

export interface ProfessionnelService {
  // Centres
  getCentres(): Promise<Centre[]>;
  getCentreById(id: string): Promise<Centre>;
  createCentre(data: CreateCentreDto): Promise<Centre>;
  updateCentre(id: string, data: UpdateCentreDto): Promise<Centre>;
  deleteCentre(id: string): Promise<void>;
  rechercherCentresProches(nom: string, zoneId: string): Promise<Centre[]>;

  // Spécialités
  getSpecialites(): Promise<Specialite[]>;
  createSpecialite(data: CreateSpecialiteDto): Promise<Specialite>;
  updateSpecialite(id: string, data: UpdateSpecialiteDto): Promise<Specialite>;
  deleteSpecialite(id: string): Promise<void>;
  countProfessionnelsActifsParSpecialite(id: string): Promise<number>;

  // Gestes marketing (référentiel)
  getGestesMarketing(): Promise<GesteMarketing[]>;
  createGesteMarketing(data: CreateGesteMarketingDto): Promise<GesteMarketing>;
  updateGesteMarketing(id: string, data: UpdateGesteMarketingDto): Promise<GesteMarketing>;
  deleteGesteMarketing(id: string): Promise<void>;
  getStatistiquesGestes(): Promise<StatistiquesGestes>;

  // Professionnels de santé
  getProfessionnels(filtres?: FiltresProfessionnel): Promise<ProfessionnelSante[]>;
  getProfessionnelById(id: string): Promise<ProfessionnelSante>;
  getProfessionnelsByDelegue(delegueId: string): Promise<ProfessionnelSante[]>;
  getProfessionnelsByRole(role: UserRole, userId: string): Promise<ProfessionnelSante[]>;
  createProfessionnel(data: CreateProfessionnelDto): Promise<ProfessionnelSante>;
  updateProfessionnel(id: string, data: UpdateProfessionnelDto): Promise<ProfessionnelSante>;
  deleteProfessionnel(id: string): Promise<void>;
  /** Verrouille la fiche pour le délégué (règle aDejaEuContact), appelé à la planification d'un RDV. */
  marquerContactEffectue(id: string): Promise<ProfessionnelSante>;

  // Gestes réalisés (historique)
  getGestesRealises(professionnelId?: string): Promise<GesteRealise[]>;
  enregistrerGeste(data: CreateGesteRealiseDto): Promise<GesteRealise>;

  // Planning de tournée
  getJourneesTournee(delegueId: string): Promise<JourTournee[]>;
  saveJourTournee(data: Omit<JourTournee, 'id'>): Promise<JourTournee>;

  // Import Excel : intégration directe + file de validation ADMIN
  importerProfessionnel(data: CreateProfessionnelDto): Promise<ProfessionnelSante>;
  getDemandesValidation(statut?: StatutDemandeValidation): Promise<DemandeValidation[]>;
  creerDemandeValidation(data: Omit<DemandeValidation, 'id' | 'dateCreation' | 'statut'>): Promise<DemandeValidation>;
  traiterDemandeValidation(id: string, statut: StatutDemandeValidation): Promise<DemandeValidation>;
}
