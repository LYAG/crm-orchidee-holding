'use client';

import { AimOutlined, SettingOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { App, Button, InputNumber, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { objectifConversionService } from '@/services';
import type { ObjectifAnnee, ObjectifMois } from '@/types';

const { Text } = Typography;

const MOIS_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const ANNEE_COURANTE = new Date().getFullYear();
const ANNEES_OPTIONS = Array.from({ length: 4 }, (_, i) => ANNEE_COURANTE - 1 + i);

export function ObjectifsConversionPage() {
  const { message } = App.useApp();
  const [annee, setAnnee] = useState(ANNEE_COURANTE);
  const [donnees, setDonnees] = useState<ObjectifAnnee | null>(null);
  const [loading, setLoading] = useState(true);

  const [defautEnEdition, setDefautEnEdition] = useState(false);
  const [defautValeur, setDefautValeur] = useState<number | null>(null);
  const [defautSauvegarde, setDefautSauvegarde] = useState(false);

  const [moisEnEdition, setMoisEnEdition] = useState<number | null>(null);
  const [moisValeur, setMoisValeur] = useState<number | null>(null);
  const [moisSauvegarde, setMoisSauvegarde] = useState(false);

  function charger() {
    setLoading(true);
    objectifConversionService
      .getAnnee(annee)
      .then(setDonnees)
      .catch(() => message.error('Erreur lors du chargement des objectifs.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    charger();
    setDefautEnEdition(false);
    setMoisEnEdition(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annee]);

  async function enregistrerDefaut() {
    if (defautValeur == null) return;
    setDefautSauvegarde(true);
    try {
      const maj = await objectifConversionService.definir(annee, null, defautValeur);
      setDonnees(maj);
      setDefautEnEdition(false);
      message.success(`Objectif par défaut fixé pour ${annee}.`);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setDefautSauvegarde(false);
    }
  }

  async function enregistrerMois(mois: number) {
    if (moisValeur == null) return;
    setMoisSauvegarde(true);
    try {
      const maj = await objectifConversionService.definir(annee, mois, moisValeur);
      setDonnees(maj);
      setMoisEnEdition(null);
      message.success(`Objectif de ${MOIS_LABELS[mois - 1]} ${annee} mis à jour.`);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setMoisSauvegarde(false);
    }
  }

  async function reinitialiserMois(mois: number) {
    try {
      const maj = await objectifConversionService.reinitialiserMois(annee, mois);
      setDonnees(maj);
      message.success(`${MOIS_LABELS[mois - 1]} ${annee} repasse sur la valeur par défaut.`);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erreur lors de la réinitialisation.');
    }
  }

  const columns: ColumnsType<ObjectifMois> = [
    { title: 'Mois', dataIndex: 'mois', render: (m: number) => MOIS_LABELS[m - 1], width: 140 },
    {
      title: 'Objectif appliqué',
      render: (_, m) =>
        moisEnEdition === m.mois ? (
          <InputNumber min={0} value={moisValeur} onChange={setMoisValeur} autoFocus style={{ width: 100 }} />
        ) : (
          <Text strong>{m.valeurEffective}</Text>
        ),
      width: 160,
    },
    {
      title: 'Origine',
      render: (_, m) =>
        m.valeurSpecifique != null ? (
          <Tag color="blue" style={{ borderRadius: 6 }}>Personnalisé</Tag>
        ) : (
          <Tag style={{ borderRadius: 6 }}>Valeur par défaut</Tag>
        ),
      width: 150,
    },
    {
      title: 'Actions',
      render: (_, m) =>
        moisEnEdition === m.mois ? (
          <Space>
            <Button size="small" type="primary" loading={moisSauvegarde} onClick={() => enregistrerMois(m.mois)}>
              Enregistrer
            </Button>
            <Button size="small" onClick={() => setMoisEnEdition(null)}>
              Annuler
            </Button>
          </Space>
        ) : (
          <Space>
            <Button
              size="small"
              onClick={() => {
                setMoisEnEdition(m.mois);
                setMoisValeur(m.valeurEffective);
              }}
            >
              Personnaliser
            </Button>
            {m.valeurSpecifique != null && (
              <Button size="small" danger onClick={() => reinitialiserMois(m.mois)}>
                Réinitialiser
              </Button>
            )}
          </Space>
        ),
    },
  ];

  return (
    <PageContainer
      title="Objectifs de conversion"
      subTitle="T1 → ST, par mois"
      tags={
        <Tag
          icon={<SettingOutlined />}
          style={{ background: '#F3E5F5', color: '#6A1B9A', border: 'none', fontWeight: 600, borderRadius: 6 }}
        >
          Administration
        </Tag>
      }
    >
      <div style={{ maxWidth: 760 }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #E7F3F0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            overflow: 'hidden',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              padding: '18px 24px',
              background: 'linear-gradient(135deg, #123832 0%, #1B4A40 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 18,
                }}
              >
                <AimOutlined />
              </div>
              <div>
                <Text style={{ color: '#fff', fontWeight: 700, fontSize: 15, display: 'block', lineHeight: 1.2 }}>
                  Objectif de conversion T1 → ST
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                  Nombre de professionnels que chaque délégué doit convertir
                </Text>
              </div>
            </div>
            <Select value={annee} onChange={setAnnee} options={ANNEES_OPTIONS.map((a) => ({ value: a, label: a }))} style={{ width: 100 }} />
          </div>

          <div style={{ padding: '20px 24px' }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Valeur par défaut pour {annee}
            </Text>
            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
              Appliquée à tous les mois de l&apos;année, sauf ceux personnalisés individuellement ci-dessous.
            </Text>
            <Space>
              {defautEnEdition ? (
                <>
                  <InputNumber min={0} value={defautValeur} onChange={setDefautValeur} autoFocus style={{ width: 100 }} />
                  <Button type="primary" loading={defautSauvegarde} onClick={enregistrerDefaut}>
                    Enregistrer
                  </Button>
                  <Button onClick={() => setDefautEnEdition(false)}>Annuler</Button>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 24, fontWeight: 800, color: '#0F6E52' }}>
                    {donnees?.valeurParDefaut ?? '—'}
                  </Text>
                  <Button
                    onClick={() => {
                      setDefautEnEdition(true);
                      setDefautValeur(donnees?.valeurParDefaut ?? 0);
                    }}
                  >
                    Modifier
                  </Button>
                </>
              )}
            </Space>
          </div>
        </div>

        <Table<ObjectifMois>
          rowKey="mois"
          columns={columns}
          dataSource={donnees?.mois ?? []}
          loading={loading}
          pagination={false}
          size="middle"
        />
      </div>
    </PageContainer>
  );
}
