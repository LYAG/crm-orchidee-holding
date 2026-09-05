'use client';

import { CalendarOutlined, PrinterOutlined } from '@ant-design/icons';
import { Alert, Button, Col, DatePicker, Progress, Row, Skeleton, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/fr';
import { useEffect, useState } from 'react';
import { construireTableauHtml, imprimerRapport } from '@/lib/impression';
import { reportingService } from '@/services';
import type { ProgressionRdv } from '@/types';

dayjs.locale('fr');

const { Text } = Typography;

function couleurJauge(pourcent: number): string {
  if (pourcent >= 100) return '#0F6E52';
  if (pourcent >= 50) return '#1565C0';
  return '#E65100';
}

// Voir ConversionsTab pour le détail du choix d'impression (onglet à part, en-tête/pied de page
// communs dans src/lib/impression.ts).
function construireCorpsImpression(periode: Dayjs, progression: ProgressionRdv[]): string {
  const atteints = progression.filter((p) => p.objectif > 0 && p.nbRdvRealises >= p.objectif);
  const nonAtteints = progression.filter((p) => p.objectif === 0 || p.nbRdvRealises < p.objectif);

  const entetes = ['Délégué', 'RDV réalisés', 'Objectif', '%'];
  const lignes = (source: ProgressionRdv[]) =>
    source.map((p) => {
      const pourcent = p.objectif > 0 ? Math.round((p.nbRdvRealises / p.objectif) * 100) : 0;
      return [p.nomDelegue, p.nbRdvRealises, p.objectif || '—', p.objectif > 0 ? pourcent + ' %' : '—'];
    });

  const tableau = (titre: string, couleur: string, source: ProgressionRdv[]) => `
    <h2 style="color:${couleur}; font-size:15px; margin:24px 0 8px;">${titre} (${source.length})</h2>
    ${construireTableauHtml(entetes, lignes(source))}
  `;

  return `
    <h1 style="font-size:18px; margin:0;">Objectifs de RDV</h1>
    <p style="color:#6B8A82; font-size:13px; margin:4px 0 0;">
      Période : ${periode.format('MMMM YYYY')} · Généré le ${dayjs().format('DD/MM/YYYY à HH:mm')}
    </p>
    ${tableau('Objectif atteint', '#0F6E52', atteints)}
    ${tableau('Objectif non atteint', '#E65100', nonAtteints)}
  `;
}

export function ObjectifsRdvTab() {
  const [periode, setPeriode] = useState<Dayjs>(dayjs());
  const [progression, setProgression] = useState<ProgressionRdv[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    reportingService
      .getProgressionRdv(periode.year(), periode.month() + 1)
      .then(setProgression)
      .catch(() => setProgression([]))
      .finally(() => setLoading(false));
  }, [periode]);

  const aucunObjectifFixe = !loading && progression.length > 0 && progression.every((p) => p.objectif === 0);

  function handleImprimer() {
    imprimerRapport(`Objectifs de RDV — ${periode.format('MMMM YYYY')}`, construireCorpsImpression(periode, progression));
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
        <Text type="secondary" style={{ fontSize: 13 }}>
          RDV réalisés par chaque délégué, comparés à l&apos;objectif du mois fixé par son manager.
        </Text>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<PrinterOutlined />} onClick={handleImprimer} disabled={progression.length === 0}>
            Imprimer / PDF
          </Button>
          <DatePicker
            picker="month"
            value={periode}
            onChange={(v) => v && setPeriode(v)}
            allowClear={false}
            format="MMMM YYYY"
          />
        </div>
      </div>

      {aucunObjectifFixe && (
        <Alert
          type="warning"
          showIcon
          message="Aucun objectif de RDV n'est fixé pour ce mois."
          description="Un manager peut en définir un dans Paramètres → Objectifs de RDV, pour chaque délégué de son équipe."
          style={{ marginBottom: 16 }}
        />
      )}

      {loading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : progression.length === 0 ? (
        <Text type="secondary">Aucun délégué à afficher.</Text>
      ) : (
        <Row gutter={[16, 16]}>
          {progression.map((p) => {
            const pourcent = p.objectif > 0 ? Math.round((p.nbRdvRealises / p.objectif) * 100) : 0;
            return (
              <Col xs={24} sm={12} md={8} lg={6} key={p.delegueId}>
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    border: '1px solid #E7F3F0',
                    padding: '20px 16px',
                    textAlign: 'center',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                  }}
                >
                  <Progress
                    type="dashboard"
                    percent={Math.min(100, pourcent)}
                    strokeColor={couleurJauge(pourcent)}
                    format={() => (
                      <span style={{ fontSize: 20, fontWeight: 800, color: '#123832' }}>
                        {p.nbRdvRealises}
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#8FB0A8' }}>/{p.objectif || '—'}</span>
                      </span>
                    )}
                  />
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <CalendarOutlined style={{ color: '#8FB0A8', fontSize: 12 }} />
                    <Text strong style={{ fontSize: 13, color: '#123832' }}>
                      {p.nomDelegue}
                    </Text>
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
}
