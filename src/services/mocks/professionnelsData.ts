import {
  CategorieEtablissement,
  CategorieGeste,
  type Centre,
  type GesteMarketing,
  type GesteRealise,
  type HistoriqueChangementStatut,
  type JourTournee,
  JourSemaine,
  ModeJoursConsultation,
  type ProfessionnelSante,
  type Specialite,
  StatutProfessionnel,
  TitreProfessionnel,
  TypeCas,
  TypeCentre,
  UniteCas,
} from '@/types';

/** Devine une catégorie d'établissement à partir du titre/des spécialités (mock uniquement — champ saisi manuellement en production). */
function categorieDefaut(titre: TitreProfessionnel, specialiteIds: string[]): CategorieEtablissement {
  if (titre === TitreProfessionnel.DR) return CategorieEtablissement.MEDECIN;
  if (specialiteIds.includes('spe-ide')) return CategorieEtablissement.INFIRMIER;
  return CategorieEtablissement.INFIRMIER;
}

// ─── Centres de santé ─────────────────────────────────────────────────────────
// Réutilise les zones existantes (zone-1 Abidjan, zone-2 Bouaké, zone-3 San-Pédro).

export const centres: Centre[] = [
  {
    id: 'centre-1',
    nom: 'CSU Sagbé',
    zoneId: 'zone-1',
    type: TypeCentre.CSU,
    adresse: 'Sagbé, Abidjan',
    actif: true,
    createdAt: '2026-01-10',
    updatedAt: '2026-01-10',
  },
  {
    id: 'centre-2',
    nom: 'CSU Bocabo',
    zoneId: 'zone-1',
    type: TypeCentre.CSU,
    adresse: 'Bocabo, Abidjan',
    actif: true,
    createdAt: '2026-01-10',
    updatedAt: '2026-01-10',
  },
  {
    id: 'centre-3',
    nom: 'HG Anyama',
    zoneId: 'zone-1',
    type: TypeCentre.HOPITAL,
    adresse: 'Anyama, Abidjan',
    actif: true,
    createdAt: '2026-01-10',
    updatedAt: '2026-01-10',
  },
  {
    id: 'centre-4',
    nom: 'CM Akadi',
    zoneId: 'zone-1',
    type: TypeCentre.CM,
    adresse: 'Akadi, Abidjan',
    actif: true,
    createdAt: '2026-01-10',
    updatedAt: '2026-01-10',
  },
  {
    id: 'centre-5',
    nom: 'Infirmerie Ste Anne',
    zoneId: 'zone-1',
    type: TypeCentre.INFIRMERIE,
    adresse: 'Ste Anne, Abidjan',
    actif: true,
    createdAt: '2026-01-10',
    updatedAt: '2026-01-10',
  },
  {
    id: 'centre-6',
    nom: 'CSU Anokoua-Koute',
    zoneId: 'zone-1',
    type: TypeCentre.CSU,
    adresse: 'Anokoua-Koute, Abidjan',
    actif: true,
    createdAt: '2026-01-10',
    updatedAt: '2026-01-10',
  },
  {
    id: 'centre-7',
    nom: 'CHR Bouaké',
    zoneId: 'zone-2',
    type: TypeCentre.CHR,
    adresse: 'Centre-ville, Bouaké',
    actif: true,
    createdAt: '2026-01-10',
    updatedAt: '2026-01-10',
  },
  {
    id: 'centre-8',
    nom: 'CM San-Pédro',
    zoneId: 'zone-3',
    type: TypeCentre.CM,
    adresse: 'Centre-ville, San-Pédro',
    actif: true,
    createdAt: '2026-01-10',
    updatedAt: '2026-01-10',
  },
];

// ─── Spécialités ────────────────────────────────────────────────────────────────

export const specialites: Specialite[] = [
  { id: 'spe-vacc', code: 'VACC', libelle: 'Vaccination', actif: true },
  { id: 'spe-cpn', code: 'CPN', libelle: 'Consultation prénatale', actif: true },
  { id: 'spe-sa', code: 'SA', libelle: 'Salle d\'accouchement', actif: true },
  { id: 'spe-med', code: 'MED', libelle: 'Médecine générale', actif: true },
  { id: 'spe-mg', code: 'MG', libelle: 'Médecin généraliste', actif: true },
  { id: 'spe-ide', code: 'IDE', libelle: 'Infirmier diplômé d\'État', actif: true },
  { id: 'spe-pediatrie', code: 'PEDIATRIE', libelle: 'Pédiatrie', actif: true },
  { id: 'spe-dermato', code: 'DERMATO', libelle: 'Dermatologie', actif: true },
  { id: 'spe-suite-couche', code: 'SUITE_DE_COUCHE', libelle: 'Suite de couche', actif: true },
];

// ─── Gestes marketing (référentiel) ───────────────────────────────────────────

export const gestesMarketing: GesteMarketing[] = [
  { id: 'geste-petit-dej', libelle: 'Petit déjeuner', categorie: CategorieGeste.REPAS, coutIndicatifFcfa: 2000, actif: true },
  { id: 'geste-dejeuner', libelle: 'Déjeuner', categorie: CategorieGeste.REPAS, coutIndicatifFcfa: 3500, actif: true },
  { id: 'geste-bol', libelle: 'Bol', categorie: CategorieGeste.CADEAU, coutIndicatifFcfa: 1500, actif: true },
  { id: 'geste-porcelaine', libelle: 'Porcelaine', categorie: CategorieGeste.CADEAU, coutIndicatifFcfa: 5000, actif: true },
  { id: 'geste-pagne', libelle: 'Pagne', categorie: CategorieGeste.CADEAU, coutIndicatifFcfa: 8000, actif: true },
  { id: 'geste-kit-bebe', libelle: 'Kit bébé', categorie: CategorieGeste.CADEAU, coutIndicatifFcfa: 6000, actif: true },
  { id: 'geste-taxe', libelle: 'Taxe', categorie: CategorieGeste.FINANCIER, coutIndicatifFcfa: 2000, actif: true },
  { id: 'geste-pressea', libelle: 'Pressea', categorie: CategorieGeste.FINANCIER, coutIndicatifFcfa: 2000, actif: true },
  { id: 'geste-echantillon', libelle: 'Échantillon', categorie: CategorieGeste.ECHANTILLON, actif: true },
  { id: 'geste-bijoux', libelle: 'Bijoux', categorie: CategorieGeste.CADEAU, coutIndicatifFcfa: 7000, actif: true },
  { id: 'geste-soupiere', libelle: 'Soupière', categorie: CategorieGeste.CADEAU, coutIndicatifFcfa: 4500, actif: true },
  { id: 'geste-kit-ramadan', libelle: 'Kit ramadan', categorie: CategorieGeste.CADEAU, coutIndicatifFcfa: 10000, actif: true },
  { id: 'geste-gourde', libelle: 'Gourde', categorie: CategorieGeste.CADEAU, coutIndicatifFcfa: 2500, actif: true },
  { id: 'geste-bazin', libelle: 'Bazin', categorie: CategorieGeste.CADEAU, coutIndicatifFcfa: 15000, actif: true },
  { id: 'geste-huile', libelle: 'Huile', categorie: CategorieGeste.CADEAU, coutIndicatifFcfa: 3000, actif: true },
  { id: 'geste-vin', libelle: 'Vin', categorie: CategorieGeste.CADEAU, coutIndicatifFcfa: 6000, actif: true },
  { id: 'geste-sucrerie', libelle: 'Sucrerie', categorie: CategorieGeste.CADEAU, coutIndicatifFcfa: 1000, actif: true },
  { id: 'geste-tasse', libelle: 'Tasse', categorie: CategorieGeste.CADEAU, coutIndicatifFcfa: 1500, actif: true },
  { id: 'geste-drap', libelle: 'Drap', categorie: CategorieGeste.CADEAU, coutIndicatifFcfa: 5500, actif: true },
  { id: 'geste-ventilateur', libelle: 'Ventilateur', categorie: CategorieGeste.CADEAU, coutIndicatifFcfa: 18000, actif: true },
  { id: 'geste-chemise', libelle: 'Chemise', categorie: CategorieGeste.CADEAU, coutIndicatifFcfa: 9000, actif: true },
  { id: 'geste-paquet-eau', libelle: 'Paquet d\'eau', categorie: CategorieGeste.AUTRE, coutIndicatifFcfa: 1500, actif: true },
];

// ─── Professionnels de santé ──────────────────────────────────────────────────

const baseProfessionnels: Array<Omit<ProfessionnelSante, 'statut' | 'categorie'>> = [
  {
    id: 'pro-1', nom: 'Kouassi', prenom: 'Affoué', titre: TitreProfessionnel.DR,
    centreId: 'centre-1', specialiteIds: ['spe-cpn', 'spe-sa'], telephones: ['0708123456'],
    joursConsultation: { mode: ModeJoursConsultation.JOURS_EXPLICITES, jours: [JourSemaine.LUN, JourSemaine.MER, JourSemaine.JEU] },
    potentielCas: { min: 2, max: 3, unite: UniteCas.JOUR, typeCas: TypeCas.CAS },
    delegueId: 'delegue-1', actif: true, aDejaEuContact: true,
    dateCreation: '2026-01-15',
  },
  {
    id: 'pro-2', nom: 'Yao', prenom: 'Marie', titre: TitreProfessionnel.SF,
    centreId: 'centre-1', specialiteIds: ['spe-sa'], telephones: ['0507654321'],
    joursConsultation: { mode: ModeJoursConsultation.FREQUENCE, frequenceParSemaine: 2 },
    potentielCas: { min: 2, unite: UniteCas.JOUR, typeCas: TypeCas.ACCOUCHEMENT },
    delegueId: 'delegue-1', actif: true, aDejaEuContact: false,
    dateCreation: '2026-01-15',
  },
  {
    id: 'pro-3', nom: 'Diabaté', prenom: 'Ibrahim', titre: TitreProfessionnel.M,
    centreId: 'centre-2', specialiteIds: ['spe-ide', 'spe-vacc'], telephones: ['0102345678'],
    joursConsultation: { mode: ModeJoursConsultation.JOURS_EXPLICITES, jours: [JourSemaine.LUN, JourSemaine.MAR, JourSemaine.MER, JourSemaine.JEU, JourSemaine.VEN] },
    potentielCas: { min: 4, unite: UniteCas.SEMAINE, typeCas: TypeCas.CAS, estMinimum: true },
    delegueId: 'delegue-1', actif: true, aDejaEuContact: true,
    dateCreation: '2026-01-16',
  },
  {
    id: 'pro-4', nom: 'Seka', prenom: 'Christelle', titre: TitreProfessionnel.MME,
    centreId: 'centre-2', specialiteIds: ['spe-cpn'], telephones: ['0708112233'],
    joursConsultation: { mode: ModeJoursConsultation.JOURS_EXPLICITES, jours: [JourSemaine.MAR, JourSemaine.JEU] },
    potentielCas: { min: 3, max: 5, unite: UniteCas.SEMAINE, typeCas: TypeCas.CONSULTATION },
    delegueId: 'delegue-1', actif: true, aDejaEuContact: false,
    dateCreation: '2026-01-16',
  },
  {
    id: 'pro-5', nom: 'Yebe', prenom: 'Solange', titre: TitreProfessionnel.SF,
    centreId: 'centre-2', specialiteIds: ['spe-sa', 'spe-cpn'], telephones: ['0505998877'],
    joursConsultation: { mode: ModeJoursConsultation.FREQUENCE, frequenceParSemaine: 3 },
    potentielCas: { min: 1, max: 2, unite: UniteCas.JOUR, typeCas: TypeCas.ACCOUCHEMENT },
    delegueId: 'delegue-1', actif: true, aDejaEuContact: false,
    dateCreation: '2026-01-17',
  },
  {
    id: 'pro-6', nom: 'Bakayoko', prenom: 'Souleymane', titre: TitreProfessionnel.DR,
    centreId: 'centre-3', specialiteIds: ['spe-med', 'spe-mg'], telephones: ['0709887766'],
    joursConsultation: { mode: ModeJoursConsultation.JOURS_EXPLICITES, jours: [JourSemaine.LUN, JourSemaine.MAR, JourSemaine.MER, JourSemaine.JEU, JourSemaine.VEN, JourSemaine.SAM] },
    potentielCas: { min: 8, max: 12, unite: UniteCas.JOUR, typeCas: TypeCas.CONSULTATION },
    delegueId: 'delegue-1', actif: true, aDejaEuContact: true,
    dateCreation: '2026-01-18',
  },
  {
    id: 'pro-7', nom: 'Koffi', prenom: 'Régine', titre: TitreProfessionnel.DR,
    centreId: 'centre-3', specialiteIds: ['spe-pediatrie'], telephones: ['0102233445'],
    joursConsultation: { mode: ModeJoursConsultation.JOURS_EXPLICITES, jours: [JourSemaine.LUN, JourSemaine.MER, JourSemaine.VEN] },
    potentielCas: { min: 5, max: 8, unite: UniteCas.JOUR, typeCas: TypeCas.CONSULTATION },
    delegueId: 'delegue-1', actif: true, aDejaEuContact: false,
    dateCreation: '2026-01-18',
  },
  {
    id: 'pro-8', nom: 'Ouattara', prenom: 'Awa', titre: TitreProfessionnel.MAJOR,
    centreId: 'centre-3', specialiteIds: ['spe-ide'], telephones: ['0708556677'],
    joursConsultation: { mode: ModeJoursConsultation.FREQUENCE, frequenceParSemaine: 6 },
    potentielCas: { min: 3, unite: UniteCas.JOUR, typeCas: TypeCas.CAS, estMinimum: true },
    delegueId: 'delegue-1', actif: true, aDejaEuContact: true,
    dateCreation: '2026-01-19',
  },
  {
    id: 'pro-9', nom: 'N\'Dri', prenom: 'Patrick', titre: TitreProfessionnel.DR,
    centreId: 'centre-4', specialiteIds: ['spe-dermato'], telephones: ['0506112233'],
    joursConsultation: { mode: ModeJoursConsultation.JOURS_EXPLICITES, jours: [JourSemaine.MAR, JourSemaine.JEU] },
    potentielCas: { min: 2, max: 4, unite: UniteCas.JOUR, typeCas: TypeCas.CONSULTATION },
    delegueId: 'delegue-2', actif: true, aDejaEuContact: false,
    dateCreation: '2026-01-20',
  },
  {
    id: 'pro-10', nom: 'Aka', prenom: 'Josiane', titre: TitreProfessionnel.SF,
    centreId: 'centre-4', specialiteIds: ['spe-cpn', 'spe-vacc'], telephones: ['0709221100'],
    joursConsultation: { mode: ModeJoursConsultation.JOURS_EXPLICITES, jours: [JourSemaine.LUN, JourSemaine.MAR, JourSemaine.MER] },
    potentielCas: { min: 4, max: 6, unite: UniteCas.SEMAINE, typeCas: TypeCas.CONSULTATION },
    delegueId: 'delegue-2', actif: true, aDejaEuContact: false,
    dateCreation: '2026-01-20',
  },
  {
    id: 'pro-11', nom: 'Fofana', prenom: 'Mariam', titre: TitreProfessionnel.MME,
    centreId: 'centre-5', specialiteIds: ['spe-ide'], telephones: ['0102998877'],
    joursConsultation: { mode: ModeJoursConsultation.JOURS_EXPLICITES, jours: [JourSemaine.LUN, JourSemaine.JEU, JourSemaine.SAM] },
    potentielCas: { min: 2, unite: UniteCas.JOUR, typeCas: TypeCas.CAS },
    delegueId: 'delegue-2', actif: true, aDejaEuContact: false,
    dateCreation: '2026-01-21',
  },
  {
    id: 'pro-12', nom: 'Touré', prenom: 'Bakary', titre: TitreProfessionnel.M,
    centreId: 'centre-5', specialiteIds: ['spe-vacc'], telephones: ['0708445566'],
    joursConsultation: { mode: ModeJoursConsultation.FREQUENCE, frequenceParSemaine: 2 },
    potentielCas: { min: 6, max: 10, unite: UniteCas.SEMAINE, typeCas: TypeCas.CAS },
    delegueId: 'delegue-2', actif: true, aDejaEuContact: false,
    dateCreation: '2026-01-21',
  },
  {
    id: 'pro-13', nom: 'Coulibaly', prenom: 'Fatim', titre: TitreProfessionnel.SF,
    centreId: 'centre-6', specialiteIds: ['spe-sa', 'spe-suite-couche'], telephones: ['0505334455'],
    joursConsultation: { mode: ModeJoursConsultation.JOURS_EXPLICITES, jours: [JourSemaine.MAR, JourSemaine.MER, JourSemaine.VEN] },
    potentielCas: { min: 1, max: 3, unite: UniteCas.JOUR, typeCas: TypeCas.ACCOUCHEMENT },
    delegueId: 'delegue-2', actif: true, aDejaEuContact: true,
    dateCreation: '2026-01-22',
  },
  {
    id: 'pro-14', nom: 'Kone', prenom: 'Salimata', titre: TitreProfessionnel.DR,
    centreId: 'centre-6', specialiteIds: ['spe-med'], telephones: ['0709667788'],
    joursConsultation: { mode: ModeJoursConsultation.JOURS_EXPLICITES, jours: [JourSemaine.LUN, JourSemaine.MAR, JourSemaine.MER, JourSemaine.JEU, JourSemaine.VEN] },
    potentielCas: { min: 10, unite: UniteCas.JOUR, typeCas: TypeCas.CONSULTATION, estMinimum: true },
    delegueId: 'delegue-2', actif: true, aDejaEuContact: false,
    dateCreation: '2026-01-22',
  },
  {
    id: 'pro-15', nom: 'Gbagbo', prenom: 'Henriette', titre: TitreProfessionnel.MME,
    centreId: 'centre-6', specialiteIds: ['spe-ide', 'spe-pediatrie'], telephones: ['0102556677'],
    joursConsultation: { mode: ModeJoursConsultation.FREQUENCE, frequenceParSemaine: 4 },
    potentielCas: { min: 3, max: 5, unite: UniteCas.JOUR, typeCas: TypeCas.CAS },
    delegueId: 'delegue-2', actif: true, aDejaEuContact: false,
    dateCreation: '2026-01-23',
  },
  {
    id: 'pro-16', nom: 'Silué', prenom: 'Karim', titre: TitreProfessionnel.DR,
    centreId: 'centre-7', specialiteIds: ['spe-med', 'spe-mg'], telephones: ['0708778899'],
    joursConsultation: { mode: ModeJoursConsultation.JOURS_EXPLICITES, jours: [JourSemaine.LUN, JourSemaine.MER, JourSemaine.VEN] },
    potentielCas: { min: 6, max: 9, unite: UniteCas.JOUR, typeCas: TypeCas.CONSULTATION },
    delegueId: 'delegue-3', actif: true, aDejaEuContact: false,
    dateCreation: '2026-01-24',
  },
  {
    id: 'pro-17', nom: 'Bamba', prenom: 'Nafissatou', titre: TitreProfessionnel.SF,
    centreId: 'centre-7', specialiteIds: ['spe-cpn', 'spe-sa'], telephones: ['0505889900'],
    joursConsultation: { mode: ModeJoursConsultation.JOURS_EXPLICITES, jours: [JourSemaine.MAR, JourSemaine.JEU, JourSemaine.SAM] },
    potentielCas: { min: 2, max: 4, unite: UniteCas.JOUR, typeCas: TypeCas.CAS },
    delegueId: 'delegue-3', actif: true, aDejaEuContact: false,
    dateCreation: '2026-01-24',
  },
  {
    id: 'pro-18', nom: 'Zadi', prenom: 'Landry', titre: TitreProfessionnel.M,
    centreId: 'centre-7', specialiteIds: ['spe-ide', 'spe-vacc'], telephones: ['0709112244'],
    joursConsultation: { mode: ModeJoursConsultation.FREQUENCE, frequenceParSemaine: 5 },
    potentielCas: { min: 4, unite: UniteCas.SEMAINE, typeCas: TypeCas.CAS, estMinimum: true },
    delegueId: 'delegue-3', actif: true, aDejaEuContact: false,
    dateCreation: '2026-01-25',
  },
  {
    id: 'pro-19', nom: 'Kra', prenom: 'Adjoua Béatrice', titre: TitreProfessionnel.DR,
    centreId: 'centre-8', specialiteIds: ['spe-mg', 'spe-dermato'], telephones: ['0102778899'],
    joursConsultation: { mode: ModeJoursConsultation.JOURS_EXPLICITES, jours: [JourSemaine.LUN, JourSemaine.MAR, JourSemaine.JEU] },
    potentielCas: { min: 5, max: 7, unite: UniteCas.JOUR, typeCas: TypeCas.CONSULTATION },
    delegueId: 'delegue-4', actif: true, aDejaEuContact: false,
    dateCreation: '2026-01-26',
  },
  {
    id: 'pro-20', nom: 'Doumbia', prenom: 'Sekou', titre: TitreProfessionnel.MAJOR,
    centreId: 'centre-8', specialiteIds: ['spe-ide'], telephones: ['0708990011'],
    joursConsultation: { mode: ModeJoursConsultation.FREQUENCE, frequenceParSemaine: 3 },
    potentielCas: { min: 3, unite: UniteCas.JOUR, typeCas: TypeCas.CAS },
    delegueId: 'delegue-4', actif: true, aDejaEuContact: false,
    dateCreation: '2026-01-26',
  },
  {
    id: 'pro-21', nom: 'Kouamé', prenom: 'Olivier', titre: TitreProfessionnel.DR,
    centreId: 'centre-8', specialiteIds: ['spe-mg'], telephones: ['0766778899'],
    joursConsultation: { mode: ModeJoursConsultation.JOURS_EXPLICITES, jours: [JourSemaine.LUN, JourSemaine.MAR, JourSemaine.MER] },
    potentielCas: { min: 4, max: 6, unite: UniteCas.JOUR, typeCas: TypeCas.CONSULTATION },
    delegueId: 'delegue-5', actif: true, aDejaEuContact: true,
    dateCreation: '2026-03-01',
  },
];

/** Enrichit les fiches de base avec statut (classification ST/T1/T2/T3) et catégorie d'établissement. */
export const professionnels: ProfessionnelSante[] = baseProfessionnels.map((p) => ({
  ...p,
  categorie: categorieDefaut(p.titre!, p.specialiteIds),
  statut: p.aDejaEuContact ? StatutProfessionnel.ST : StatutProfessionnel.T3,
}));

// ─── Historique des changements de classification ─────────────────────────────
// Alimenté par ProfessionnelServiceMock à chaque changement de `statut` — vide au
// démarrage, se remplit au fil des attributions/qualifications qui reclassent un
// professionnel (ex : T3 → T2 lors d'une première prescription constatée).
export const historiqueChangementsStatut: HistoriqueChangementStatut[] = [];

// ─── Gestes réalisés (historique) ─────────────────────────────────────────────

export const gestesRealises: GesteRealise[] = [
  { id: 'gr-1', professionnelId: 'pro-1', delegueId: 'delegue-1', gesteMarketingId: 'geste-petit-dej', date: '2026-06-02', coutFcfa: 2000, commentaire: 'Visite de routine' },
  { id: 'gr-2', professionnelId: 'pro-1', delegueId: 'delegue-1', gesteMarketingId: 'geste-porcelaine', date: '2026-06-16', coutFcfa: 5000 },
  { id: 'gr-3', professionnelId: 'pro-3', delegueId: 'delegue-1', gesteMarketingId: 'geste-taxe', date: '2026-06-03', coutFcfa: 2000 },
  { id: 'gr-4', professionnelId: 'pro-6', delegueId: 'delegue-1', gesteMarketingId: 'geste-dejeuner', date: '2026-06-04', coutFcfa: 3500, commentaire: 'Discussion nouveaux produits' },
  { id: 'gr-5', professionnelId: 'pro-6', delegueId: 'delegue-1', gesteMarketingId: 'geste-pagne', date: '2026-06-18', coutFcfa: 8000 },
  { id: 'gr-6', professionnelId: 'pro-8', delegueId: 'delegue-1', gesteMarketingId: 'geste-bol', date: '2026-06-05', coutFcfa: 1500 },
  { id: 'gr-7', professionnelId: 'pro-13', delegueId: 'delegue-2', gesteMarketingId: 'geste-kit-bebe', date: '2026-06-10', coutFcfa: 6000 },
  { id: 'gr-8', professionnelId: 'pro-1', delegueId: 'delegue-1', gesteMarketingId: 'geste-echantillon', date: '2026-06-30', commentaire: 'Nouvel échantillon gamme soin' },
  { id: 'gr-9', professionnelId: 'pro-3', delegueId: 'delegue-1', gesteMarketingId: 'geste-sucrerie', date: '2026-07-01', coutFcfa: 1000 },
  { id: 'gr-10', professionnelId: 'pro-8', delegueId: 'delegue-1', gesteMarketingId: 'geste-gourde', date: '2026-07-02', coutFcfa: 2500 },
];

// ─── Planning de tournée hebdomadaire (délégué-1, zone Abidjan) ──────────────

export const joursTournee: JourTournee[] = [
  { id: 'tournee-1', delegueId: 'delegue-1', jour: JourSemaine.LUN, centreIds: ['centre-1', 'centre-3'] },
  { id: 'tournee-2', delegueId: 'delegue-1', jour: JourSemaine.MAR, centreIds: ['centre-2'] },
  { id: 'tournee-3', delegueId: 'delegue-1', jour: JourSemaine.MER, centreIds: ['centre-1', 'centre-4'] },
  { id: 'tournee-4', delegueId: 'delegue-1', jour: JourSemaine.JEU, centreIds: ['centre-2', 'centre-3'] },
  { id: 'tournee-5', delegueId: 'delegue-1', jour: JourSemaine.VEN, centreIds: ['centre-3'] },
  { id: 'tournee-6', delegueId: 'delegue-1', jour: JourSemaine.SAM, centreIds: ['centre-1'] },
];
