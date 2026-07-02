'use client';

import {
  CalendarOutlined,
  CloseCircleOutlined,
  EuroOutlined,
  PlusOutlined,
  SendOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import {
  App,
  Badge,
  Button,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { opportuniteService, rdvService } from '@/services';
import { DevisStatut, OpportuniteEtape } from '@/types';
import type { Devis, Opportunite, Prospect, RendezVous, Utilisateur } from '@/types';
import { DEVIS_STATUT_CONFIG, ETAPE_MAP, ETAPES_CONFIG } from './constants';

const { Text, Title } = Typography;

interface Props {
  open: boolean;
  opportunite: Opportunite | null;
  prospectMap: Record<string, Prospect>;
  utilisateurMap: Record<string, Utilisateur>;
  onClose: () => void;
  onUpdate: (updated: Opportunite) => void;
}

export function OpportuniteDetailDrawer({
  open,
  opportunite: opp,
  prospectMap,
  utilisateurMap,
  onClose,
  onUpdate,
}: Props) {
  const { user } = useAuth();
  const { message } = App.useApp();
  const [rdvList, setRdvList] = useState<RendezVous[]>([]);
  const [addingNote, setAddingNote] = useState(false);
  const [addingDevis, setAddingDevis] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [devisForm] = Form.useForm();
  const [devisLoading, setDevisLoading] = useState(false);

  useEffect(() => {
    if (!opp || !open) return;
    setRdvList([]);
    if (opp.rdvIds.length > 0) {
      Promise.all(opp.rdvIds.map((id) => rdvService.getById(id)))
        .then(setRdvList)
        .catch(() => {});
    }
  }, [opp, open]);

  if (!opp) return null;

  const currentOpp = opp; // capture for closures
  const prospect = prospectMap[opp.prospectId];
  const delegue = utilisateurMap[opp.delegueId];
  const etapeConfig = ETAPE_MAP[opp.etape];
  const isClosed =
    opp.etape === OpportuniteEtape.GAGNEE || opp.etape === OpportuniteEtape.PERDUE;

  async function handleMarquerGagnee() {
    Modal.confirm({
      title: 'Marquer comme gagnée ?',
      content: 'Le prospect deviendra client. Cette action ne peut pas être annulée.',
      okText: 'Confirmer',
      onOk: async () => {
        try {
          const updated = await opportuniteService.marquerGagnee(currentOpp.id);
          message.success('Opportunité gagnée — prospect passé en statut Client.');
          onUpdate(updated);
        } catch {
          message.error('Erreur lors de la mise à jour.');
        }
      },
    });
  }

  async function handleMarquerPerdue() {
    let motif = '';
    Modal.confirm({
      title: 'Motif de la perte',
      content: (
        <Input.TextArea
          rows={3}
          placeholder="Raison de la perte (obligatoire)…"
          onChange={(e) => { motif = e.target.value; }}
        />
      ),
      okText: 'Confirmer',
      onOk: async () => {
        if (!motif.trim()) {
          message.warning('Veuillez indiquer un motif de perte.');
          return Promise.reject();
        }
        const updated = await opportuniteService.marquerPerdue(currentOpp.id, motif);
        message.success('Opportunité marquée comme perdue.');
        onUpdate(updated);
      },
    });
  }

  async function handleAddNote() {
    if (!noteText.trim() || !user) return;
    setNoteLoading(true);
    try {
      const updated = await opportuniteService.ajouterNote(currentOpp.id, {
        contenu: noteText,
        auteurId: user.id,
      });
      setNoteText('');
      setAddingNote(false);
      onUpdate(updated);
    } catch {
      message.error('Erreur lors de l\'ajout de la note.');
    } finally {
      setNoteLoading(false);
    }
  }

  async function handleAddDevis(values: { montant: number; description?: string }) {
    setDevisLoading(true);
    try {
      const updated = await opportuniteService.ajouterDevis(currentOpp.id, {
        montant: values.montant,
        description: values.description,
        dateEnvoi: new Date().toISOString().split('T')[0],
        statut: DevisStatut.EN_ATTENTE,
      });
      devisForm.resetFields();
      setAddingDevis(false);
      onUpdate(updated);
      message.success('Devis ajouté. L\'opportunité est passée en étape "Devis envoyé".');
    } catch {
      message.error('Erreur lors de l\'ajout du devis.');
    } finally {
      setDevisLoading(false);
    }
  }

  async function handleUpdateDevisStatut(devis: Devis, statut: DevisStatut) {
    try {
      const updated = await opportuniteService.mettreAJourDevis(currentOpp.id, devis.id, { statut });
      onUpdate(updated);
      message.success(`Devis ${DEVIS_STATUT_CONFIG[statut].label.toLowerCase()}.`);
    } catch {
      message.error('Erreur lors de la mise à jour du devis.');
    }
  }

  async function handleChangerEtape(etape: OpportuniteEtape) {
    try {
      const updated = await opportuniteService.changerEtape(currentOpp.id, etape);
      onUpdate(updated);
      message.success(`Étape mise à jour : ${ETAPE_MAP[etape].label}.`);
    } catch {
      message.error('Erreur lors du changement d\'étape.');
    }
  }

  const devisColumns = [
    {
      title: 'Montant',
      dataIndex: 'montant',
      key: 'montant',
      render: (m: number) => `${m.toLocaleString('fr-FR')} €`,
    },
    {
      title: 'Date envoi',
      dataIndex: 'dateEnvoi',
      key: 'dateEnvoi',
      render: (d: string) => new Date(d).toLocaleDateString('fr-FR'),
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      render: (s: DevisStatut) => (
        <Tag color={DEVIS_STATUT_CONFIG[s].color}>{DEVIS_STATUT_CONFIG[s].label}</Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, devis: Devis) =>
        devis.statut === DevisStatut.EN_ATTENTE ? (
          <Space size={4}>
            <Button
              size="small"
              type="primary"
              ghost
              onClick={() => handleUpdateDevisStatut(devis, DevisStatut.ACCEPTE)}
            >
              Accepté
            </Button>
            <Button
              size="small"
              danger
              ghost
              onClick={() => handleUpdateDevisStatut(devis, DevisStatut.REFUSE)}
            >
              Refusé
            </Button>
          </Space>
        ) : null,
    },
  ];

  return (
    <Drawer
      title={
        <Space>
          <Tag color={etapeConfig.tagColor}>{etapeConfig.label}</Tag>
          <Text strong style={{ fontSize: 15 }}>
            {opp.titre}
          </Text>
        </Space>
      }
      open={open}
      onClose={onClose}
      width={520}
      extra={
        !isClosed && (
          <Select
            size="small"
            value={opp.etape}
            onChange={handleChangerEtape}
            style={{ width: 160 }}
            options={ETAPES_CONFIG.filter(
              (e) =>
                e.key !== OpportuniteEtape.GAGNEE && e.key !== OpportuniteEtape.PERDUE,
            ).map((e) => ({ value: e.key, label: e.label }))}
          />
        )
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* KPI row */}
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Prospect">
            {prospect ? `${prospect.nom} ${prospect.prenom ?? ''} — ${prospect.entreprise}` : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Délégué">
            {delegue ? `${delegue.prenom} ${delegue.nom}` : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Montant estimé">
            <Text strong>
              <EuroOutlined /> {opp.montantEstime.toLocaleString('fr-FR')} €
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Probabilité">
            <Space>
              <Progress
                percent={opp.probabilite}
                size="small"
                strokeColor={etapeConfig.color}
                style={{ width: 80, marginBottom: 0 }}
              />
              <Text>{opp.probabilite}%</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Dernière MAJ">
            {new Date(opp.dateDerniereMaj).toLocaleDateString('fr-FR')}
          </Descriptions.Item>
          {opp.motifPerte && (
            <Descriptions.Item label="Motif perte" span={2}>
              <Text type="danger">{opp.motifPerte}</Text>
            </Descriptions.Item>
          )}
        </Descriptions>

        {/* RDV liés */}
        <div>
          <Title level={5} style={{ marginBottom: 8 }}>
            <CalendarOutlined /> RDV liés ({rdvList.length})
          </Title>
          {rdvList.length === 0 ? (
            <Text type="secondary">Aucun RDV lié.</Text>
          ) : (
            <List
              size="small"
              dataSource={rdvList}
              renderItem={(rdv) => (
                <List.Item>
                  <Space>
                    <Badge
                      status={rdv.qualifie ? 'success' : 'default'}
                      text={new Date(rdv.dateHeure).toLocaleString('fr-FR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    />
                    <Text type="secondary">({rdv.dureeMinutes} min)</Text>
                    {rdv.qualifie && <Tag color="green" style={{ fontSize: 10 }}>Qualifié</Tag>}
                  </Space>
                </List.Item>
              )}
            />
          )}
        </div>

        {/* Devis */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Title level={5} style={{ marginBottom: 0 }}>
              <EuroOutlined /> Devis ({opp.devis.length})
            </Title>
            {!isClosed && (
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={() => setAddingDevis(!addingDevis)}
              >
                Ajouter
              </Button>
            )}
          </div>
          {addingDevis && (
            <Form form={devisForm} layout="inline" onFinish={handleAddDevis} style={{ marginBottom: 12, background: '#fafafa', padding: 10, borderRadius: 6 }}>
              <Form.Item name="montant" rules={[{ required: true }]}>
                <InputNumber placeholder="Montant €" min={0} step={500} />
              </Form.Item>
              <Form.Item name="description">
                <Input placeholder="Description (optionnel)" style={{ width: 160 }} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={devisLoading} icon={<SendOutlined />}>
                  Envoyer
                </Button>
              </Form.Item>
            </Form>
          )}
          {opp.devis.length > 0 ? (
            <Table
              dataSource={opp.devis}
              columns={devisColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          ) : (
            <Text type="secondary">Aucun devis associé.</Text>
          )}
        </div>

        {/* Notes */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Title level={5} style={{ marginBottom: 0 }}>
              Notes de suivi ({opp.notes.length})
            </Title>
            {!isClosed && (
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={() => setAddingNote(!addingNote)}
              >
                Ajouter
              </Button>
            )}
          </div>
          {addingNote && (
            <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
              <Input.TextArea
                rows={2}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Rédiger une note…"
                style={{ flex: 1 }}
              />
              <Button
                type="primary"
                loading={noteLoading}
                onClick={handleAddNote}
                disabled={!noteText.trim()}
              >
                OK
              </Button>
            </Space.Compact>
          )}
          {opp.notes.length === 0 ? (
            <Text type="secondary">Aucune note.</Text>
          ) : (
            <List
              size="small"
              dataSource={[...opp.notes].reverse()}
              renderItem={(note) => (
                <List.Item>
                  <Space direction="vertical" size={0} style={{ width: '100%' }}>
                    <Text style={{ fontSize: 13 }}>{note.contenu}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {utilisateurMap[note.auteurId]
                        ? `${utilisateurMap[note.auteurId].prenom} ${utilisateurMap[note.auteurId].nom}`
                        : note.auteurId}{' '}
                      · {new Date(note.date).toLocaleDateString('fr-FR')}
                    </Text>
                  </Space>
                </List.Item>
              )}
            />
          )}
        </div>

        {/* Actions gagnée / perdue */}
        {!isClosed && (
          <Space style={{ width: '100%' }}>
            <Button
              type="primary"
              icon={<TrophyOutlined />}
              onClick={handleMarquerGagnee}
              style={{ background: '#2E7D32', borderColor: '#2E7D32', flex: 1 }}
              block
            >
              Marquer comme gagnée
            </Button>
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={handleMarquerPerdue}
              block
            >
              Perdue
            </Button>
          </Space>
        )}
      </Space>
    </Drawer>
  );
}
