'use client';

import {
  ArrowLeftOutlined,
  BuildOutlined,
  CalendarOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import {
  App,
  Button,
  Col,
  Form,
  Result,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import { prospectService, qualificationService, rdvService } from '@/services';
import {
  MotifNonProductif,
  QualificationOpportunite,
  QualificationProductif,
  QualificationTransformation,
  RdvStatut,
} from '@/types';
import type { Prospect, QualificationRDV, RendezVous } from '@/types';
import { QualificationFormFields } from './QualificationForm';
import { QualificationReadOnly } from './QualificationReadOnly';

const { Text } = Typography;

interface WatchedValues {
  productif: QualificationProductif | null;
  motifNonProductif: MotifNonProductif | null;
  opportunite: QualificationOpportunite | null;
  transformation: QualificationTransformation | null;
}

const DEFAULT_WATCH: WatchedValues = {
  productif: null,
  motifNonProductif: null,
  opportunite: null,
  transformation: null,
};

export function QualificationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const [rdv, setRdv] = useState<RendezVous | null>(null);
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [existingQual, setExistingQual] = useState<QualificationRDV | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingAsManager, setEditingAsManager] = useState(false);
  const [watched, setWatched] = useState<WatchedValues>(DEFAULT_WATCH);

  const rdvId = params.id;

  useEffect(() => {
    if (!rdvId) return;
    Promise.all([rdvService.getById(rdvId), qualificationService.getByRdv(rdvId)])
      .then(async ([r, q]) => {
        setRdv(r);
        setExistingQual(q);
        if (r.prospectId) {
          const p = await prospectService.getById(r.prospectId);
          setProspect(p);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [rdvId]);

  function startEditing(qual: QualificationRDV) {
    setEditingAsManager(true);
    setTimeout(() => {
      form.setFieldsValue({
        ...qual,
        dateRelance: qual.dateRelance ? dayjs(qual.dateRelance) : undefined,
      });
      setWatched({
        productif: qual.productif,
        motifNonProductif: qual.motifNonProductif ?? null,
        opportunite: qual.opportunite,
        transformation: qual.transformation,
      });
    }, 0);
  }

  async function handleSubmit(values: Record<string, unknown>) {
    if (!rdvId || !user) return;
    setSaving(true);
    try {
      const dateRelance =
        values.dateRelance && dayjs.isDayjs(values.dateRelance)
          ? (values.dateRelance as dayjs.Dayjs).format('YYYY-MM-DD')
          : undefined;

      if (existingQual && editingAsManager) {
        await qualificationService.update(
          existingQual.id,
          { ...values, dateRelance } as Partial<QualificationRDV>,
          user.id,
        );
        message.success('Qualification mise à jour.');
        const updated = await qualificationService.getByRdv(rdvId);
        setExistingQual(updated);
        setEditingAsManager(false);
      } else {
        const created = await qualificationService.create({
          rdvId,
          qualifiePar: user.id,
          dateQualification: new Date().toISOString(),
          productif: values.productif as QualificationProductif,
          motifNonProductif: values.motifNonProductif as QualificationRDV['motifNonProductif'],
          motifNonProductifAutre: values.motifNonProductifAutre as string | undefined,
          opportunite: values.opportunite as QualificationOpportunite,
          montantEstimeDevis: values.montantEstimeDevis as number | undefined,
          descriptionDevis: values.descriptionDevis as string | undefined,
          transformation: values.transformation as QualificationTransformation,
          dateRelance,
          canalRelance: values.canalRelance as QualificationRDV['canalRelance'],
        });
        setExistingQual(created);
        const updatedRdv = await rdvService.getById(rdvId);
        setRdv(updatedRdv);
        message.success('Qualification enregistrée avec succès.');
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageContainer title="Qualification du RDV">
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  if (!rdv) {
    return (
      <PageContainer>
        <Result
          status="404"
          title="RDV introuvable"
          extra={<Button onClick={() => router.push('/rdv')}>Retour au calendrier</Button>}
        />
      </PageContainer>
    );
  }

  const isPasse = new Date(rdv.dateHeure) < new Date();
  if (!isPasse || rdv.statut !== RdvStatut.REALISE) {
    return (
      <PageContainer title="Qualification du RDV">
        <Result
          status="warning"
          title="Ce RDV ne peut pas encore être qualifié"
          subTitle={
            !isPasse
              ? "Le rendez-vous n'a pas encore eu lieu."
              : `Le RDV est au statut "${rdv.statut}", seuls les RDV "Réalisés" peuvent être qualifiés.`
          }
          extra={<Button onClick={() => router.push('/rdv')}>Retour au calendrier</Button>}
        />
      </PageContainer>
    );
  }

  const isQualified = !!existingQual;
  const showReadOnly = isQualified && !editingAsManager;
  const showForm = !isQualified || editingAsManager;

  const dateRdv = new Date(rdv.dateHeure).toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  return (
    <PageContainer
      title={
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            type="text"
            onClick={() => router.push('/rdv')}
          />
          <span>Qualification du RDV</span>
        </Space>
      }
      tags={
        isQualified ? (
          <Tag
            icon={<CheckOutlined />}
            style={{
              background: '#E8F5E9',
              color: '#2E7D32',
              border: 'none',
              fontWeight: 600,
              borderRadius: 6,
            }}
          >
            Qualifié
          </Tag>
        ) : (
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
            À qualifier
          </Tag>
        )
      }
    >
      {/* ── RDV summary card ── */}
      <ProCard
        bordered
        style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden' }}
        bodyStyle={{ padding: 0 }}
      >
        {/* Gradient header */}
        <div
          style={{
            padding: '14px 20px',
            background: 'linear-gradient(135deg, #123832 0%, #1B4A40 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <CalendarOutlined style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }} />
          <Text style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
            Détails du rendez-vous
          </Text>
        </div>

        {/* Info row */}
        <Row gutter={0}>
          <Col xs={24} sm={8}>
            <div
              style={{
                padding: '16px 20px',
                borderRight: '1px solid #E7F3F0',
                borderBottom: '1px solid #E7F3F0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <CalendarOutlined style={{ color: '#8FB0A8', fontSize: 12 }} />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#8FB0A8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Date & Heure
                </Text>
              </div>
              <Text strong style={{ color: '#123832', fontSize: 14 }}>
                {dateRdv}
              </Text>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div
              style={{
                padding: '16px 20px',
                borderRight: '1px solid #E7F3F0',
                borderBottom: '1px solid #E7F3F0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <BuildOutlined style={{ color: '#8FB0A8', fontSize: 12 }} />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#8FB0A8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Prospect / Entreprise
                </Text>
              </div>
              <Text strong style={{ color: '#123832', fontSize: 14 }}>
                {prospect
                  ? `${prospect.nom} ${prospect.prenom ?? ''} — ${prospect.entreprise}`
                  : '—'}
              </Text>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E7F3F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <ClockCircleOutlined style={{ color: '#8FB0A8', fontSize: 12 }} />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#8FB0A8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Durée du RDV
                </Text>
              </div>
              <Text strong style={{ color: '#123832', fontSize: 14 }}>
                {rdv.dureeMinutes} min
              </Text>
            </div>
          </Col>
        </Row>
      </ProCard>

      {/* ── Read-only view ── */}
      {showReadOnly && existingQual && (
        <ProCard bordered style={{ borderRadius: 12 }}>
          <Text strong style={{ fontSize: 15, color: '#123832', display: 'block', marginBottom: 16 }}>
            Qualification enregistrée
          </Text>
          <QualificationReadOnly
            qualification={existingQual}
            userRole={user?.role}
            onEdit={() => startEditing(existingQual)}
          />
        </ProCard>
      )}

      {/* ── Form view ── */}
      {showForm && (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={(changed: Record<string, unknown>) => {
            setWatched((prev) => ({
              productif:
                'productif' in changed
                  ? (changed.productif as QualificationProductif) ?? null
                  : prev.productif,
              motifNonProductif:
                'motifNonProductif' in changed
                  ? (changed.motifNonProductif as MotifNonProductif) ?? null
                  : prev.motifNonProductif,
              opportunite:
                'opportunite' in changed
                  ? (changed.opportunite as QualificationOpportunite) ?? null
                  : prev.opportunite,
              transformation:
                'transformation' in changed
                  ? (changed.transformation as QualificationTransformation) ?? null
                  : prev.transformation,
            }));
            if ('productif' in changed) {
              form.setFieldsValue({ motifNonProductif: undefined, motifNonProductifAutre: undefined });
            }
            if ('opportunite' in changed) {
              form.setFieldsValue({ montantEstimeDevis: undefined, descriptionDevis: undefined });
            }
            if ('transformation' in changed) {
              form.setFieldsValue({ dateRelance: undefined, canalRelance: undefined });
            }
          }}
        >
          {editingAsManager && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 10,
                background: '#FFFBF0',
                border: '1px solid #FFE58F',
                marginBottom: 16,
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <WarningOutlined style={{ color: '#D4A017', fontSize: 14 }} />
                <Text style={{ color: '#8A6914', fontSize: 13 }}>
                  Vous modifiez cette qualification en tant que Manager. Une trace sera conservée.
                </Text>
              </div>
              <Button size="small" onClick={() => setEditingAsManager(false)}>
                Annuler
              </Button>
            </div>
          )}

          <QualificationFormFields
            watched={watched}
            onValuesChange={(changed) => {
              setWatched((prev) => ({
                ...prev,
                ...Object.fromEntries(
                  Object.entries(changed).map(([k, v]) => [k, v ?? null]),
                ),
              }));
            }}
          />

          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              {editingAsManager && (
                <Button onClick={() => setEditingAsManager(false)}>Annuler</Button>
              )}
              <Button
                type="primary"
                htmlType="submit"
                loading={saving}
                icon={<CheckOutlined />}
              >
                {editingAsManager ? 'Enregistrer les modifications' : 'Valider la qualification'}
              </Button>
            </Space>
          </div>
        </Form>
      )}
    </PageContainer>
  );
}
