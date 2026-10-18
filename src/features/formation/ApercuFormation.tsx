'use client';

import { FileTextOutlined, LinkOutlined, LockOutlined, PaperClipOutlined } from '@ant-design/icons';
import { Collapse, Empty, Space, Tag, Typography } from 'antd';
import type { FormationDetail } from '@/types/formation';
import { EXIGENCES, NIVEAUX, TYPES_EVALUATION, TYPES_LECON, formatDuree } from './constants';

const { Text, Paragraph, Title } = Typography;

/** Prévisualisation d'une formation telle que le délégué la parcourra (avant ou après publication). */
export function ApercuFormation({ detail }: { detail: FormationDetail }) {
  const f = detail.resume;
  const finale = detail.evaluations.find((e) => e.type === 'EVALUATION_FINALE');
  return (
    <div style={{ background: '#fff', border: '1px solid var(--oh-line)', borderRadius: 12, padding: 20 }}>
      <Title level={4} style={{ marginTop: 0 }}>{f.titre}</Title>
      <Space wrap style={{ marginBottom: 12 }}>
        <Tag style={{ borderRadius: 6 }}>{NIVEAUX[f.niveau]}</Tag>
        <Tag style={{ borderRadius: 6 }}>{formatDuree(f.dureeEstimeeMinutes)}</Tag>
        <Tag color="green" style={{ borderRadius: 6 }}>Seuil {f.seuilReussite}/100 — {EXIGENCES[f.exigenceSeuil].label.toLowerCase()}</Tag>
        {detail.progressionSequentielle && <Tag style={{ borderRadius: 6 }}>Modules dans l’ordre</Tag>}
      </Space>
      {f.description && <Paragraph>{f.description}</Paragraph>}
      {detail.modules.length === 0 ? (
        <Empty description="Aucun module" />
      ) : (
        <Collapse
          defaultActiveKey={[detail.modules[0].id]}
          items={detail.modules.map((m, i) => ({
            key: m.id,
            label: (
              <Space wrap>
                {detail.progressionSequentielle && i > 0 && <LockOutlined style={{ color: 'var(--oh-ink-3)' }} />}
                <Text strong>Module {m.ordre} — {m.titre}</Text>
                {!m.obligatoire && <Tag style={{ borderRadius: 6 }}>Facultatif</Tag>}
              </Space>
            ),
            children: (
              <Space orientation="vertical" style={{ width: '100%' }} size={12}>
                {m.description && <Text type="secondary">{m.description}</Text>}
                {m.lecons.map((l) => (
                  <div key={l.id} style={{ borderInlineStart: '3px solid var(--oh-brand-subtle)', paddingInlineStart: 12 }}>
                    <Space wrap size={6}>
                      {l.type === 'LIEN' ? <LinkOutlined /> : l.aFichier ? <PaperClipOutlined /> : <FileTextOutlined />}
                      <Text strong>{l.titre}</Text>
                      <Tag style={{ borderRadius: 6 }}>{TYPES_LECON[l.type]}</Tag>
                      {l.dureeMinutes && <Text type="secondary">{formatDuree(l.dureeMinutes)}</Text>}
                    </Space>
                    {l.contenu && <Paragraph style={{ whiteSpace: 'pre-wrap', margin: '6px 0 0' }} ellipsis={{ rows: 4, expandable: true, symbol: 'Lire la suite' }}>{l.contenu}</Paragraph>}
                    {l.url && <div><a href={l.url} target="_blank" rel="noreferrer">{l.url}</a></div>}
                    {l.aFichier && <Text type="secondary">Support joint : {l.fichierNom}</Text>}
                  </div>
                ))}
                {m.evaluations.map((e) => (
                  <Tag key={e.id} color="cyan" style={{ borderRadius: 6, padding: '4px 8px' }}>
                    {TYPES_EVALUATION[e.type]} « {e.titre} » — {e.nbQuestions} question(s){e.obligatoire ? ' · obligatoire pour valider le module' : ''}
                  </Tag>
                ))}
              </Space>
            ),
          }))}
        />
      )}
      {finale && (
        <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: 'var(--oh-brand-subtle)' }}>
          <Text strong>Évaluation finale : {finale.titre}</Text>
          <div>
            <Text type="secondary">
              {finale.nbQuestions} question(s), {finale.pointsTotal} point(s) — accessible une fois tous les modules obligatoires validés.
            </Text>
          </div>
        </div>
      )}
    </div>
  );
}
