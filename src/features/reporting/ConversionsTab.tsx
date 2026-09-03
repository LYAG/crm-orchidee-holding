'use client';

import { PrinterOutlined, TrophyOutlined } from '@ant-design/icons';
import { Alert, Button, Col, DatePicker, Progress, Row, Skeleton, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/fr';
import { useEffect, useState } from 'react';
import { envelopperDocumentImprimable } from '@/lib/impression';
import { reportingService } from '@/services';
import type { ProgressionConversion } from '@/types';

dayjs.locale('fr');

const { Text } = Typography;

function couleurJauge(pourcent: number): string {
  if (pourcent >= 100) return '#0F6E52';
  if (pourcent >= 50) return '#1565C0';
  return '#E65100';
}

// Rapport imprimable dans un onglet à part (pas dans la mise en page de l'app, sidebar/header
// compris) : évite de devoir masquer tout le chrome applicatif via des règles @media print
// globales, fragiles et couplées à la structure d'AppLayout. Le navigateur fournit déjà
// l'impression physique ET l'export PDF via "Enregistrer en PDF" dans son dialogue d'impression —
// pas besoin d'une librairie PDF dédiée pour ça. En-tête/pied de page communs à toute
// l'application, voir src/lib/impression.ts.
function construireHtmlImpression(periode: Dayjs, progression: ProgressionConversion[], objectif: number): string {
  const atteints = progression.filter((p) => objectif > 0 && p.nbConversions >= objectif);
  const nonAtteints = progression.filter((p) => objectif === 0 || p.nbConversions < objectif);

  const ligne = (p: ProgressionConversion) => {
    const pourcent = objectif > 0 ? Math.round((p.nbConversions / objectif) * 100) : 0;
    return `<tr style="border-bottom:1px solid #F0F0F0;">
      <td style="padding:6px 8px;">${escapeHtml(p.nomDelegue)}</td>
      <td style="padding:6px 8px; text-align:center;">${p.nbConversions}</td>
      <td style="padding:6px 8px; text-align:center;">${objectif || '—'}</td>
      <td style="padding:6px 8px; text-align:center;">${objectif > 0 ? pourcent + ' %' : '—'}</td>
    </tr>`;
  };

  const tableau = (titre: string, couleur: string, lignes: ProgressionConversion[]) => `
    <h2 style="color:${couleur}; font-size:15px; margin:24px 0 8px;">${titre} (${lignes.length})</h2>
    ${
      lignes.length === 0
        ? '<p style="color:#8FB0A8; font-size:13px;">Aucun délégué.</p>'
        : `<table style="width:100%; border-collapse:collapse; font-size:13px;">
            <thead><tr style="background:#F3F7F5;">
              <th style="text-align:left; padding:6px 8px; border-bottom:1px solid #E7F3F0;">Délégué</th>
              <th style="padding:6px 8px; border-bottom:1px solid #E7F3F0;">Conversions</th>
              <th style="padding:6px 8px; border-bottom:1px solid #E7F3F0;">Objectif</th>
              <th style="padding:6px 8px; border-bottom:1px solid #E7F3F0;">%</th>
            </tr></thead>
            <tbody>${lignes.map(ligne).join('')}</tbody>
          </table>`
    }`;

  const corps = `
    <h1 style="font-size:18px; margin:0;">Objectifs de conversion T1 → ST</h1>
    <p style="color:#6B8A82; font-size:13px; margin:4px 0 0;">
      Période : ${periode.format('MMMM YYYY')} · Objectif du mois : ${objectif || 'non défini'}
      · Généré le ${dayjs().format('DD/MM/YYYY à HH:mm')}
    </p>
    ${tableau('Objectif atteint', '#0F6E52', atteints)}
    ${tableau('Objectif non atteint', '#E65100', nonAtteints)}
  `;
  return envelopperDocumentImprimable(`Objectifs de conversion — ${periode.format('MMMM YYYY')}`, corps);
}

function escapeHtml(texte: string): string {
  return texte.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

export function ConversionsTab() {
  const [periode, setPeriode] = useState<Dayjs>(dayjs());
  const [progression, setProgression] = useState<ProgressionConversion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    reportingService
      .getProgressionConversions(periode.year(), periode.month() + 1)
      .then(setProgression)
      .catch(() => setProgression([]))
      .finally(() => setLoading(false));
  }, [periode]);

  const objectif = progression[0]?.objectif ?? 0;

  function handleImprimer() {
    const fenetre = window.open('', '_blank');
    if (!fenetre) {
      return;
    }
    fenetre.document.write(construireHtmlImpression(periode, progression, objectif));
    fenetre.document.close();
    fenetre.onload = () => fenetre.print();
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Conversions T1 → ST réalisées par chaque délégué, comparées à l&apos;objectif du mois fixé dans Paramètres.
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

      {!loading && objectif === 0 && (
        <Alert
          type="warning"
          showIcon
          message="Aucun objectif de conversion n'est fixé pour ce mois."
          description="Un administrateur peut en définir un dans Paramètres → Objectifs de conversion."
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
            const pourcent = objectif > 0 ? Math.round((p.nbConversions / objectif) * 100) : 0;
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
                        {p.nbConversions}
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#8FB0A8' }}>/{objectif || '—'}</span>
                      </span>
                    )}
                  />
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <TrophyOutlined style={{ color: '#8FB0A8', fontSize: 12 }} />
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
