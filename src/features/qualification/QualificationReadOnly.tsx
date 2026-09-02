'use client';

import { EditOutlined, LockOutlined } from '@ant-design/icons';
import { ProDescriptions } from '@ant-design/pro-components';
import { Alert, Button, Space, Tag, Typography } from 'antd';
import { UserRole } from '@/lib/constants';
import {
  CanalRelance,
  MotifNonProductif,
  QualificationOpportunite,
  QualificationProductif,
  QualificationTransformation,
} from '@/types';
import type { QualificationRDV } from '@/types';

const { Text } = Typography;

const PRODUCTIF_LABELS: Record<QualificationProductif, { label: string; color: string }> = {
  [QualificationProductif.PRODUCTIF]: { label: 'Productif', color: 'success' },
  [QualificationProductif.NON_PRODUCTIF]: { label: 'Non productif', color: 'error' },
};

const MOTIF_LABELS: Record<MotifNonProductif, string> = {
  [MotifNonProductif.CLIENT_ABSENT]: 'Client absent',
  [MotifNonProductif.REPORTE]: 'Reporté',
  [MotifNonProductif.PAS_INTERESSE]: 'Pas intéressé',
  [MotifNonProductif.AUTRE]: 'Autre',
};

const OPPORTUNITE_LABELS: Record<QualificationOpportunite, { label: string; color: string }> = {
  [QualificationOpportunite.AUCUNE]: { label: 'Aucune opportunité', color: 'default' },
  [QualificationOpportunite.OPPORTUNITE_IDENTIFIEE]: {
    label: 'Opportunité identifiée',
    color: 'blue',
  },
  [QualificationOpportunite.DEVIS_DEMANDE]: { label: 'Devis demandé', color: 'purple' },
};

const TRANSFORMATION_LABELS: Record<
  QualificationTransformation,
  { label: string; color: string }
> = {
  [QualificationTransformation.TRANSFORME_CLIENT]: {
    label: 'Transformé en client',
    color: 'success',
  },
  [QualificationTransformation.RELANCE_NECESSAIRE]: {
    label: 'Relance nécessaire',
    color: 'warning',
  },
};

const CANAL_LABELS: Record<CanalRelance, string> = {
  [CanalRelance.TELEPHONE]: 'Téléphone',
  [CanalRelance.EMAIL]: 'Email',
  [CanalRelance.VISITE]: 'Visite sur site',
};

interface Props {
  qualification: QualificationRDV;
  userRole?: string;
  onEdit?: () => void;
}

export function QualificationReadOnly({ qualification: q, userRole, onEdit }: Props) {
  const canEdit = userRole === UserRole.MANAGER;
  const opp = OPPORTUNITE_LABELS[q.opportunite];
  const prod = PRODUCTIF_LABELS[q.productif];
  const transfo = TRANSFORMATION_LABELS[q.transformation];

  return (
    <Space orientation="vertical" style={{ width: '100%' }} size="large">
      {q.dateModification && (
        <Alert
          type="info"
          icon={<EditOutlined />}
          showIcon
          message={
            <Text style={{ fontSize: 13 }}>
              Qualification modifiée le{' '}
              {new Date(q.dateModification).toLocaleString('fr-FR')} — {q.logModification}
            </Text>
          }
        />
      )}

      <ProDescriptions column={1} size="small" title="Axe 1 — Productivité">
        <ProDescriptions.Item label="Résultat">
          <Tag color={prod.color}>{prod.label}</Tag>
        </ProDescriptions.Item>
        {q.motifNonProductif && (
          <ProDescriptions.Item label="Motif">
            {MOTIF_LABELS[q.motifNonProductif]}
            {q.motifNonProductifAutre ? ` — ${q.motifNonProductifAutre}` : ''}
          </ProDescriptions.Item>
        )}
      </ProDescriptions>

      <ProDescriptions column={1} size="small" title="Axe 2 — Opportunité commerciale">
        <ProDescriptions.Item label="Qualification">
          <Tag color={opp.color}>{opp.label}</Tag>
        </ProDescriptions.Item>
        {q.montantEstimeDevis != null && (
          <ProDescriptions.Item label="Montant estimé">
            {q.montantEstimeDevis.toLocaleString('fr-FR')} €
          </ProDescriptions.Item>
        )}
        {q.descriptionDevis && (
          <ProDescriptions.Item label="Description">
            {q.descriptionDevis}
          </ProDescriptions.Item>
        )}
      </ProDescriptions>

      <ProDescriptions column={1} size="small" title="Axe 3 — Suite de la relation">
        <ProDescriptions.Item label="Résultat">
          <Tag color={transfo.color}>{transfo.label}</Tag>
        </ProDescriptions.Item>
        {q.dateRelance && (
          <ProDescriptions.Item label="Date de relance">
            {new Date(q.dateRelance).toLocaleDateString('fr-FR', {
              dateStyle: 'long',
            })}
          </ProDescriptions.Item>
        )}
        {q.canalRelance && (
          <ProDescriptions.Item label="Canal de relance">
            {CANAL_LABELS[q.canalRelance]}
          </ProDescriptions.Item>
        )}
      </ProDescriptions>

      <ProDescriptions column={2} size="small" title="Informations de saisie">
        <ProDescriptions.Item label="Qualifié par">
          <Text code>{q.qualifiePar}</Text>
        </ProDescriptions.Item>
        <ProDescriptions.Item label="Date de qualification">
          {new Date(q.dateQualification).toLocaleString('fr-FR')}
        </ProDescriptions.Item>
      </ProDescriptions>

      {canEdit && onEdit && (
        <Button icon={<EditOutlined />} onClick={onEdit} type="dashed" block>
          Rouvrir et modifier la qualification (Manager)
        </Button>
      )}

      {!canEdit && (
        <Alert
          type="warning"
          icon={<LockOutlined />}
          showIcon
          message="Ce RDV est qualifié et ne peut être modifié que par un manager."
        />
      )}
    </Space>
  );
}
