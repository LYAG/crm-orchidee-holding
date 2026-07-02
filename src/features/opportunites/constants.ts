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
    color: '#1565C0',
    tagColor: 'blue',
    bgColor: '#E3F2FD',
  },
  {
    key: OpportuniteEtape.DEVIS_ENVOYE,
    label: 'Devis envoyé',
    color: '#6A1B9A',
    tagColor: 'purple',
    bgColor: '#F3E5F5',
  },
  {
    key: OpportuniteEtape.NEGOCIATION,
    label: 'Négociation',
    color: '#E65100',
    tagColor: 'orange',
    bgColor: '#FFF3E0',
  },
  {
    key: OpportuniteEtape.GAGNEE,
    label: 'Gagnée',
    color: '#2E7D32',
    tagColor: 'success',
    bgColor: '#E8F5E9',
  },
  {
    key: OpportuniteEtape.PERDUE,
    label: 'Perdue',
    color: '#C62828',
    tagColor: 'error',
    bgColor: '#FFEBEE',
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
