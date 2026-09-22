'use client';

import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  PaperClipOutlined,
} from '@ant-design/icons';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import {
  Alert,
  App,
  Button,
  Col,
  Descriptions,
  Form,
  Input,
  List,
  Modal,
  Result,
  Row,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { formatFcfa } from '@/lib/format';
import { ordreMissionService, professionnelService, zoneService } from '@/services';
import { StatutOrdreMission } from '@/types';
import type { Centre, HistoriqueOrdreMission as Entree, OrdreMission, PieceJointeMission, Zone } from '@/types';
import { STATUT_MISSION_CONFIG } from './constants';
import { HistoriqueOrdreMission } from './HistoriqueOrdreMission';

const { Text, Paragraph } = Typography;

type Decision = 'valider' | 'rejeter' | 'modification';

const DECISION_CONFIG: Record<
  Decision,
  { titre: string; bouton: string; champ: string; obligatoire: boolean; placeholder: string; danger?: boolean }
> = {
  valider: {
    titre: 'Valider l’ordre de mission',
    bouton: 'Valider',
    champ: 'Commentaire (facultatif)',
    obligatoire: false,
    placeholder: 'Précisions pour le délégué…',
  },
  rejeter: {
    titre: 'Rejeter l’ordre de mission',
    bouton: 'Rejeter',
    champ: 'Motif du rejet',
    obligatoire: true,
    placeholder: 'Expliquez pourquoi la mission est refusée…',
    danger: true,
  },
  modification: {
    titre: 'Demander une modification',
    bouton: 'Envoyer la demande',
    champ: 'Modifications attendues',
    obligatoire: true,
    placeholder: 'Indiquez au délégué ce qu’il doit corriger avant de resoumettre…',
  },
};

function formatTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
}

export function OrdreMissionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<{ texte?: string }>();

  const [mission, setMission] = useState<OrdreMission | null>(null);
  const [historique, setHistorique] = useState<Entree[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const charger = useCallback(async () => {
    setErreur(null);
    try {
      const [m, h] = await Promise.all([
        ordreMissionService.getById(params.id),
        ordreMissionService.getHistorique(params.id),
      ]);
      setMission(m);
      setHistorique(h);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Ordre de mission introuvable.');
    } finally {
      setChargement(false);
    }
  }, [params.id]);

  useEffect(() => {
    charger();
    // Libellés uniquement : en cas d'échec on retombe sur les identifiants bruts.
    zoneService.getAll().then(setZones).catch(() => {});
    professionnelService.getCentres().then(setCentres).catch(() => {});
  }, [charger]);

  async function confirmerDecision() {
    if (!mission || !decision) return;
    const { texte } = await form.validateFields();
    const valeur = texte?.trim();
    setEnvoi(true);
    try {
      if (decision === 'valider') await ordreMissionService.valider(mission.id, valeur || undefined);
      else if (decision === 'rejeter') await ordreMissionService.rejeter(mission.id, valeur!);
      else await ordreMissionService.demanderModification(mission.id, valeur!);
      message.success(
        decision === 'valider'
          ? 'Ordre de mission validé.'
          : decision === 'rejeter'
            ? 'Ordre de mission rejeté.'
            : 'Demande de modification envoyée au délégué.',
      );
      setDecision(null);
      form.resetFields();
      await charger();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erreur lors du traitement.');
    } finally {
      setEnvoi(false);
    }
  }

  async function telecharger(pj: PieceJointeMission) {
    if (!mission) return;
    try {
      const blob = await ordreMissionService.telechargerPieceJointe(mission.id, pj.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pj.nomFichier;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Téléchargement impossible.');
    }
  }

  if (chargement) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (erreur || !mission) {
    return (
      <Result
        status="404"
        title="Ordre de mission indisponible"
        subTitle={erreur}
        extra={
          <Button type="primary" onClick={() => router.push('/ordres-mission')}>
            Retour à la liste
          </Button>
        }
      />
    );
  }

  const statut = STATUT_MISSION_CONFIG[mission.statut];
  const aTraiter = mission.statut === StatutOrdreMission.SOUMIS;
  const zoneMap = Object.fromEntries(zones.map((z) => [z.id, z.nom]));
  const centreMap = Object.fromEntries(centres.map((c) => [c.id, c.nom]));
  const nbJours = dayjs(mission.dateFin).diff(dayjs(mission.dateDebut), 'day') + 1;

  const lignesBudget = [
    { key: 'avance', poste: 'Avance de fonds', montant: mission.budget.avanceFonds },
    { key: 'transport', poste: 'Transport', montant: mission.budget.transport },
    { key: 'hebergement', poste: 'Hébergement', montant: mission.budget.hebergement },
    { key: 'restauration', poste: 'Restauration', montant: mission.budget.restauration },
  ];

  const cfg = decision ? DECISION_CONFIG[decision] : null;

  return (
    <PageContainer
      title={`Ordre de mission ${mission.reference}`}
      tags={<Tag color={statut.color}>{statut.label}</Tag>}
      onBack={() => router.push('/ordres-mission')}
      backIcon={<ArrowLeftOutlined />}
      extra={
        aTraiter
          ? [
              <Button key="modif" icon={<EditOutlined />} onClick={() => setDecision('modification')}>
                Demander modification
              </Button>,
              <Button key="rejet" danger icon={<CloseOutlined />} onClick={() => setDecision('rejeter')}>
                Rejeter
              </Button>,
              <Button key="valid" type="primary" icon={<CheckOutlined />} onClick={() => setDecision('valider')}>
                Valider
              </Button>,
            ]
          : undefined
      }
    >
      {mission.statut === StatutOrdreMission.REJETE && mission.motifRejet && (
        <Alert type="error" showIcon title="Motif du rejet" description={mission.motifRejet} style={{ marginBottom: 16 }} />
      )}
      {mission.statut !== StatutOrdreMission.REJETE && mission.commentaireManager && (
        <Alert
          type={mission.statut === StatutOrdreMission.MODIFICATION_DEMANDEE ? 'warning' : 'info'}
          showIcon
          title="Commentaire du manager"
          description={mission.commentaireManager}
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <ProCard title="Informations" style={{ marginBottom: 16 }}>
            <Descriptions column={{ xs: 1, md: 2 }} size="small">
              <Descriptions.Item label="Délégué">{mission.nomDelegue}</Descriptions.Item>
              <Descriptions.Item label="Manager">{mission.nomManager}</Descriptions.Item>
              <Descriptions.Item label="Type de mission">{mission.typeMissionLibelle}</Descriptions.Item>
              <Descriptions.Item label="Moyen de transport">{mission.moyenTransportLibelle}</Descriptions.Item>
              <Descriptions.Item label="Période">
                {dayjs(mission.dateDebut).format('DD/MM/YYYY')} → {dayjs(mission.dateFin).format('DD/MM/YYYY')} (
                {nbJours} jour{nbJours > 1 ? 's' : ''})
              </Descriptions.Item>
              <Descriptions.Item label="Soumise le">
                {mission.dateSoumission ? dayjs(mission.dateSoumission).format('DD/MM/YYYY à HH:mm') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Zone(s)" span={2}>
                {mission.zoneIds.length > 0
                  ? mission.zoneIds.map((id) => <Tag key={id}>{zoneMap[id] ?? id}</Tag>)
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Centre(s)" span={2}>
                {mission.centreIds.length > 0
                  ? mission.centreIds.map((id) => <Tag key={id}>{centreMap[id] ?? id}</Tag>)
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Objet / motif" span={2}>
                <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>{mission.objet}</Paragraph>
              </Descriptions.Item>
            </Descriptions>
          </ProCard>

          <ProCard title="Budget estimé" style={{ marginBottom: 16 }}>
            <Table
              size="small"
              pagination={false}
              dataSource={lignesBudget}
              columns={[
                { title: 'Poste', dataIndex: 'poste' },
                {
                  title: 'Montant',
                  dataIndex: 'montant',
                  align: 'right',
                  render: (m: number) => formatFcfa(m),
                },
              ]}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}>
                    <Text strong>Total</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Text strong>{formatFcfa(mission.budgetTotal)}</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </ProCard>

          <ProCard title={`Pièces jointes (${mission.piecesJointes.length})`}>
            <List
              locale={{ emptyText: 'Aucun justificatif joint.' }}
              dataSource={mission.piecesJointes}
              renderItem={(pj) => (
                <List.Item
                  actions={[
                    <Button key="dl" type="link" size="small" onClick={() => telecharger(pj)}>
                      Télécharger
                    </Button>,
                  ]}
                >
                  <Space>
                    <PaperClipOutlined />
                    <span>{pj.nomFichier}</span>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatTaille(pj.taille)} · {dayjs(pj.dateAjout).format('DD/MM/YYYY')}
                    </Text>
                  </Space>
                </List.Item>
              )}
            />
          </ProCard>
        </Col>

        <Col xs={24} xl={8}>
          <ProCard title="Historique des actions">
            <HistoriqueOrdreMission entrees={historique} />
          </ProCard>
        </Col>
      </Row>

      <Modal
        open={decision !== null}
        title={cfg?.titre}
        okText={cfg?.bouton}
        cancelText="Annuler"
        okButtonProps={{ danger: cfg?.danger, loading: envoi }}
        onOk={confirmerDecision}
        onCancel={() => {
          setDecision(null);
          form.resetFields();
        }}
        destroyOnHidden
      >
        {cfg && (
          <Form form={form} layout="vertical" preserve={false}>
            <Form.Item
              name="texte"
              label={cfg.champ}
              rules={
                cfg.obligatoire
                  ? [{ required: true, whitespace: true, message: `${cfg.champ} obligatoire.` }]
                  : []
              }
            >
              <Input.TextArea rows={4} placeholder={cfg.placeholder} maxLength={1000} showCount />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </PageContainer>
  );
}
