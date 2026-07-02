'use client';

import {
  CheckCircleOutlined,
  DeleteOutlined,
  MergeCellsOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { App, Button, Col, Empty, Row, Space, Tag, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { prospectService, zoneService } from '@/services';
import type { DoublonDetecte, Zone } from '@/types';
import { DoublonAction, ProspectStatut } from '@/types';

const { Text } = Typography;

const STATUT_CONFIG: Record<ProspectStatut, { color: string; bg: string; label: string }> = {
  [ProspectStatut.PNA]: { color: '#E65100', bg: '#FFF3E0', label: 'Non affecté' },
  [ProspectStatut.AFFECTE]: { color: '#1565C0', bg: '#E3F2FD', label: 'Affecté' },
  [ProspectStatut.CLIENT]: { color: '#2E7D32', bg: '#E8F5E9', label: 'Client' },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        padding: '7px 0',
        borderBottom: '1px solid #F0F4F0',
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#9DB89D',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          width: 100,
          flexShrink: 0,
        }}
      >
        {label}
      </Text>
      <Text style={{ fontSize: 13, color: '#1C3A1C', flex: 1 }}>{value ?? '—'}</Text>
    </div>
  );
}

export function DoublonsPage() {
  const { message } = App.useApp();
  const [doublons, setDoublons] = useState<DoublonDetecte[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([prospectService.getDoublons(), zoneService.getAll()])
      .then(([d, z]) => {
        setDoublons(d);
        setZones(z);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAction(doublonId: string, action: DoublonAction, label: string) {
    setActionLoading(doublonId + action);
    try {
      await prospectService.validerDoublon(doublonId, action);
      message.success(`Doublon : ${label} avec succès.`);
      load();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erreur.');
    } finally {
      setActionLoading(null);
    }
  }

  const zoneName = (id?: string) => (id ? (zones.find((z) => z.id === id)?.nom ?? id) : '—');

  return (
    <PageContainer
      title="Gestion des doublons"
      subTitle={
        doublons.length > 0
          ? `${doublons.length} doublon${doublons.length > 1 ? 's' : ''} en attente`
          : undefined
      }
      tags={
        doublons.length > 0 ? (
          <Tag
            icon={<WarningOutlined />}
            style={{
              background: '#FFF3E0',
              color: '#E65100',
              border: 'none',
              fontWeight: 600,
              borderRadius: 6,
            }}
          >
            Action requise
          </Tag>
        ) : undefined
      }
      loading={loading}
    >
      {doublons.length === 0 ? (
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #EEF4EE',
            padding: '60px 24px',
            textAlign: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: '#E8F5E9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              color: '#5B8C5A',
              margin: '0 auto 16px',
            }}
          >
            <CheckCircleOutlined />
          </div>
          <Text strong style={{ fontSize: 16, color: '#1C3A1C', display: 'block', marginBottom: 6 }}>
            Aucun doublon en attente
          </Text>
          <Text type="secondary" style={{ fontSize: 13 }}>
            La base de données est propre — aucune action requise.
          </Text>
        </div>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          {doublons.map((d) => (
            <div
              key={d.id}
              style={{
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #EEF4EE',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                overflow: 'hidden',
              }}
            >
              {/* Card header */}
              <div
                style={{
                  padding: '14px 20px',
                  background: '#FAFCFA',
                  borderBottom: '1px solid #EEF4EE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      background: '#FFF3E0',
                      color: '#E65100',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    <MergeCellsOutlined />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 14, color: '#1C3A1C', display: 'block' }}>
                      {d.nouvelleEntree.nom} {d.nouvelleEntree.prenom}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {d.nouvelleEntree.entreprise} — Doublon détecté lors de l&apos;import
                    </Text>
                  </div>
                </div>

                {/* Action buttons */}
                <Space size={6}>
                  <Button
                    size="small"
                    type="primary"
                    icon={<MergeCellsOutlined />}
                    loading={actionLoading === d.id + DoublonAction.FUSIONNE}
                    onClick={() => handleAction(d.id, DoublonAction.FUSIONNE, 'Fusionné')}
                    style={{ borderRadius: 6 }}
                  >
                    Fusionner
                  </Button>
                  <Button
                    size="small"
                    icon={<CheckCircleOutlined />}
                    loading={actionLoading === d.id + DoublonAction.INTEGRE}
                    onClick={() => handleAction(d.id, DoublonAction.INTEGRE, 'Intégré comme nouveau')}
                    style={{ borderRadius: 6 }}
                  >
                    Intégrer comme nouveau
                  </Button>
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    loading={actionLoading === d.id + DoublonAction.IGNORE}
                    onClick={() => handleAction(d.id, DoublonAction.IGNORE, 'Ignoré')}
                    style={{ borderRadius: 6 }}
                  >
                    Ignorer
                  </Button>
                </Space>
              </div>

              {/* Comparison grid */}
              <Row>
                {/* Prospect existant */}
                <Col xs={24} md={12}>
                  <div
                    style={{
                      borderRight: '1px solid #EEF4EE',
                      height: '100%',
                    }}
                  >
                    <div
                      style={{
                        padding: '10px 20px',
                        background: '#E8F5E9',
                        borderBottom: '1px solid #C8E6C9',
                      }}
                    >
                      <Text
                        strong
                        style={{
                          fontSize: 12,
                          color: '#2E7D32',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        Prospect existant
                      </Text>
                    </div>
                    <div style={{ padding: '12px 20px 16px' }}>
                      <InfoRow label="Nom" value={`${d.prospectExistant.nom} ${d.prospectExistant.prenom ?? ''}`} />
                      <InfoRow label="Entreprise" value={d.prospectExistant.entreprise} />
                      <InfoRow label="E-mail" value={d.prospectExistant.email} />
                      <InfoRow label="Téléphone" value={d.prospectExistant.telephone} />
                      <InfoRow label="Zone" value={zoneName(d.prospectExistant.zoneId)} />
                      <InfoRow
                        label="Statut"
                        value={
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: STATUT_CONFIG[d.prospectExistant.statut].bg,
                              color: STATUT_CONFIG[d.prospectExistant.statut].color,
                              borderRadius: 5,
                              padding: '2px 8px',
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            {STATUT_CONFIG[d.prospectExistant.statut].label}
                          </div>
                        }
                      />
                    </div>
                  </div>
                </Col>

                {/* Nouvelle entrée */}
                <Col xs={24} md={12}>
                  <div
                    style={{
                      padding: '10px 20px',
                      background: '#FFF3E0',
                      borderBottom: '1px solid #FFE0B2',
                    }}
                  >
                    <Text
                      strong
                      style={{
                        fontSize: 12,
                        color: '#E65100',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      Nouvelle entrée (import)
                    </Text>
                  </div>
                  <div style={{ padding: '12px 20px 16px' }}>
                    <InfoRow label="Nom" value={`${d.nouvelleEntree.nom} ${d.nouvelleEntree.prenom ?? ''}`} />
                    <InfoRow label="Entreprise" value={d.nouvelleEntree.entreprise} />
                    <InfoRow label="E-mail" value={d.nouvelleEntree.email} />
                    <InfoRow label="Téléphone" value={d.nouvelleEntree.telephone} />
                    <InfoRow label="Zone" value={zoneName(d.nouvelleEntree.zoneId)} />
                    <InfoRow label="Statut" value="—" />
                  </div>
                </Col>
              </Row>
            </div>
          ))}
        </Space>
      )}
    </PageContainer>
  );
}
