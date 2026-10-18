'use client';

import { Col, DatePicker, Progress, Row, Select, Space, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import { formationService, utilisateurService, zoneService } from '@/services';
import type { Utilisateur, Zone } from '@/types';
import type {
  FiltresFormation,
  FormationResume,
  StatutAffectation,
  StatutEtape,
  StatutPublication,
  StatutTentative,
} from '@/types/formation';
import {
  STATUTS_AFFECTATION,
  STATUTS_ETAPE,
  STATUTS_PUBLICATION,
  STATUTS_TENTATIVE,
  formatScore,
} from './constants';

const { Text } = Typography;
const tagStyle = { borderRadius: 6, marginInlineEnd: 0 };

export function StatutPublicationTag({ statut }: { statut: StatutPublication }) {
  const c = STATUTS_PUBLICATION[statut];
  return <Tag color={c.color} style={tagStyle}>{c.label}</Tag>;
}

export function StatutAffectationTag({ statut, enRetard }: { statut: StatutAffectation; enRetard?: boolean }) {
  const c = STATUTS_AFFECTATION[statut];
  return (
    <Space size={4} wrap>
      <Tag color={c.color} style={tagStyle}>{c.label}</Tag>
      {enRetard && <Tag color="red" style={tagStyle}>En retard</Tag>}
    </Space>
  );
}

export function StatutEtapeTag({ statut }: { statut: StatutEtape }) {
  const c = STATUTS_ETAPE[statut];
  return <Tag color={c.color} style={tagStyle}>{c.label}</Tag>;
}

export function StatutTentativeTag({ statut }: { statut: StatutTentative }) {
  const c = STATUTS_TENTATIVE[statut];
  return <Tag color={c.color} style={tagStyle}>{c.label}</Tag>;
}

/** Score sur 100 coloré par rapport au seuil (vert atteint, rouge manqué). */
export function ScoreSeuil({ score, seuil }: { score: number | null | undefined; seuil?: number | null }) {
  if (score == null) return <Text type="secondary">—</Text>;
  const atteint = seuil == null || score >= seuil;
  return (
    <Tooltip title={seuil != null ? `Seuil de réussite : ${seuil}/100` : undefined}>
      <Text strong style={{ color: atteint ? '#1E7A4C' : '#B42F29', whiteSpace: 'nowrap' }}>
        {formatScore(score)}
        {seuil != null && (
          <Text type="secondary" style={{ fontWeight: 400, fontSize: 12 }}>
            {' '}
            (seuil {seuil})
          </Text>
        )}
      </Text>
    </Tooltip>
  );
}

export function Progression({ valeur, statut }: { valeur: number; statut?: StatutAffectation }) {
  const etat = statut === 'ECHOUEE' ? 'exception' : statut === 'REUSSIE' ? 'success' : 'normal';
  return (
    <Progress
      percent={valeur}
      size="small"
      status={etat}
      strokeColor={etat === 'normal' ? '#0F6E52' : undefined}
      style={{ minWidth: 110, marginBottom: 0 }}
    />
  );
}

/** Filtres communs : période, formation, délégué, équipe, région (selon les droits). */
export function FiltresFormationBar({
  valeur,
  onChange,
  formation = true,
  delegue = true,
}: {
  valeur: FiltresFormation;
  onChange: (f: FiltresFormation) => void;
  formation?: boolean;
  delegue?: boolean;
}) {
  const { user } = useAuth();
  const [formations, setFormations] = useState<FormationResume[]>([]);
  const [delegues, setDelegues] = useState<Utilisateur[]>([]);
  const [managers, setManagers] = useState<Utilisateur[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const estAdmin = user?.role === UserRole.ADMIN;

  useEffect(() => {
    if (!user) return;
    formationService.getFormations().then(setFormations).catch(() => {});
    zoneService.getAll().then(setZones).catch(() => {});
    if (estAdmin) {
      utilisateurService.getByRole(UserRole.DELEGUE).then(setDelegues).catch(() => {});
      utilisateurService.getByRole(UserRole.MANAGER).then(setManagers).catch(() => {});
    } else {
      utilisateurService.getDeleguesByManager(user.id).then(setDelegues).catch(() => {});
    }
  }, [user, estAdmin]);

  const regions = useMemo(() => [...new Set(zones.map((z) => z.region).filter(Boolean))].sort(), [zones]);
  const maj = (p: Partial<FiltresFormation>) => onChange({ ...valeur, ...p });

  return (
    <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
      <Col xs={24} md={8} lg={6}>
        <DatePicker.RangePicker
          style={{ width: '100%' }}
          format="DD/MM/YYYY"
          placeholder={['Affectées du', 'au']}
          value={valeur.dateDebut && valeur.dateFin ? [dayjs(valeur.dateDebut), dayjs(valeur.dateFin)] : null}
          onChange={(v) =>
            maj({ dateDebut: v?.[0]?.format('YYYY-MM-DD') ?? undefined, dateFin: v?.[1]?.format('YYYY-MM-DD') ?? undefined })
          }
        />
      </Col>
      {formation && (
        <Col xs={24} md={8} lg={6}>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            style={{ width: '100%' }}
            placeholder="Toutes les formations"
            value={valeur.formationId}
            onChange={(v) => maj({ formationId: v })}
            options={formations.map((f) => ({ value: f.id, label: `${f.titre} — v${f.version}` }))}
          />
        </Col>
      )}
      {delegue && (
        <Col xs={24} md={8} lg={4}>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            style={{ width: '100%' }}
            placeholder="Tous les délégués"
            value={valeur.delegueId}
            onChange={(v) => maj({ delegueId: v })}
            options={delegues.map((d) => ({ value: d.id, label: `${d.prenom} ${d.nom}` }))}
          />
        </Col>
      )}
      {estAdmin && (
        <Col xs={24} md={8} lg={4}>
          <Select
            allowClear
            style={{ width: '100%' }}
            placeholder="Toutes les équipes"
            value={valeur.managerId}
            onChange={(v) => maj({ managerId: v })}
            options={managers.map((m) => ({ value: m.id, label: `Équipe ${m.prenom} ${m.nom}` }))}
          />
        </Col>
      )}
      <Col xs={24} md={8} lg={4}>
        <Select
          allowClear
          style={{ width: '100%' }}
          placeholder="Toutes les régions"
          value={valeur.region}
          onChange={(v) => maj({ region: v })}
          options={regions.map((r) => ({ value: r, label: r }))}
        />
      </Col>
    </Row>
  );
}
