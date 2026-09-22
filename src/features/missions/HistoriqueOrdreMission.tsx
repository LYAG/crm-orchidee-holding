'use client';

import { ArrowRightOutlined } from '@ant-design/icons';
import { Empty, Tag, Timeline, Typography } from 'antd';
import dayjs from 'dayjs';
import { USER_ROLE_LABELS } from '@/lib/constants';
import type { UserRole } from '@/lib/constants';
import { ActionOrdreMission } from '@/types';
import type { HistoriqueOrdreMission as Entree } from '@/types';
import { ACTION_MISSION_LABELS, STATUT_MISSION_CONFIG } from './constants';

const { Text } = Typography;

const COULEUR_ACTION: Partial<Record<ActionOrdreMission, string>> = {
  [ActionOrdreMission.VALIDATION]: 'green',
  [ActionOrdreMission.REJET]: 'red',
  [ActionOrdreMission.DEMANDE_MODIFICATION]: 'orange',
  [ActionOrdreMission.CLOTURE]: 'purple',
};

interface Props {
  entrees: Entree[];
}

/** Journal chronologique (le plus récent en haut) des transitions de statut d'une mission. */
export function HistoriqueOrdreMission({ entrees }: Props) {
  if (entrees.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Aucune action enregistrée." />;
  }

  const triees = [...entrees].sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());

  return (
    <Timeline
      items={triees.map((e) => ({
        key: e.id,
        color: COULEUR_ACTION[e.action] ?? 'blue',
        content: (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Text strong>{ACTION_MISSION_LABELS[e.action]}</Text>
              {e.statutAvant && e.statutAvant !== e.statutApres && (
                <>
                  <Tag
                    color={STATUT_MISSION_CONFIG[e.statutAvant].color}
                    style={{ marginInlineEnd: 0 }}
                  >
                    {STATUT_MISSION_CONFIG[e.statutAvant].label}
                  </Tag>
                  <ArrowRightOutlined style={{ fontSize: 11, color: '#8FB0A8' }} />
                </>
              )}
              <Tag color={STATUT_MISSION_CONFIG[e.statutApres].color}>
                {STATUT_MISSION_CONFIG[e.statutApres].label}
              </Tag>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {dayjs(e.date).format('DD/MM/YYYY à HH:mm')} — {e.auteurNom}
              {e.auteurRole
                ? ` (${USER_ROLE_LABELS[e.auteurRole as UserRole] ?? e.auteurRole})`
                : ''}
            </Text>
            {e.commentaire && (
              <div
                style={{
                  marginTop: 6,
                  padding: '6px 10px',
                  background: '#F7FAF9',
                  borderRadius: 6,
                  borderLeft: '3px solid #DCE8E4',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {e.commentaire}
              </div>
            )}
          </div>
        ),
      }))}
    />
  );
}
