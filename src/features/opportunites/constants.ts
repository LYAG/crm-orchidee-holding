import { DevisStatut, OpportuniteEtape } from '@/types';

export interface EtapeConfig {
  key: OpportuniteEtape;
  label: string;
  color: string;
  tagColor: string;
  bgColor: string;
}

export const ETAPES_CONFIG: EtapeConfig[] = [
  {
    key: OpportuniteEtape.IDENTIFIEE,
    label: 'Identifiée',
    color: '#1F5FA8',
    tagColor: 'blue',
    bgColor: '#EAF1FA',
  },
  {
    key: OpportuniteEtape.DEVIS_ENVOYE,
    label: 'Devis envoyé',
    color: '#6B3FA0',
    tagColor: 'purple',
    bgColor: '#F1ECF8',
  },
  {
    key: OpportuniteEtape.NEGOCIATION,
    label: 'Négociation',
    color: '#A84A00',
    tagColor: 'orange',
    bgColor: '#FCF1E3',
  },
  {
    key: OpportuniteEtape.GAGNEE,
    label: 'Gagnée',
    color: '#1E7A4C',
    tagColor: 'success',
    bgColor: '#E8F2EE',
  },
  {
    key: OpportuniteEtape.PERDUE,
    label: 'Perdue',
    color: '#B42F29',
    tagColor: 'error',
    bgColor: '#FBECEB',
  },
];

export const ETAPE_MAP = Object.fromEntries(
  ETAPES_CONFIG.map((e) => [e.key, e]),
) as Record<OpportuniteEtape, EtapeConfig>;

export const DEVIS_STATUT_CONFIG: Record<DevisStatut, { label: string; color: string }> = {
  [DevisStatut.EN_ATTENTE]: { label: 'En attente', color: 'default' },
  [DevisStatut.ACCEPTE]: { label: 'Accepté', color: 'success' },
  [DevisStatut.REFUSE]: { label: 'Refusé', color: 'error' },
};
