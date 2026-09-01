'use client';

import { InboxOutlined } from '@ant-design/icons';
import { Alert, App, Button, Modal, Result, Space, Table, Tag, Typography, Upload } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { formatFcfa } from '@/lib/format';
import type { CreateGesteMarketingDto, ImportGestesResultat } from '@/services/api/ProfessionnelService';
import { professionnelService } from '@/services';
import { CategorieGeste } from '@/types';

const { Dragger } = Upload;
const { Text } = Typography;

// Alias d'en-têtes acceptés (comparaison compacte : majuscules, sans ponctuation ni espaces).
const ALIAS_LIBELLE = ['GESTE', 'GESTES', 'LIBELLE', 'LIBELLÉ', 'GESTEMARKETING'];
const ALIAS_CATEGORIE = ['CATEGORIE', 'CATÉGORIE'];
const ALIAS_COUT = ['COUT', 'COÛT', 'COUTINDICATIF', 'COÛTINDICATIF', 'COUTINDICATIFFCFA', 'COUTFCFA'];

// Valeurs de catégorie reconnues dans le fichier → enum backend.
const CATEGORIES: Record<string, CategorieGeste> = {
  REPAS: CategorieGeste.REPAS,
  CADEAU: CategorieGeste.CADEAU,
  FINANCIER: CategorieGeste.FINANCIER,
  ECHANTILLON: CategorieGeste.ECHANTILLON,
  ÉCHANTILLON: CategorieGeste.ECHANTILLON,
  AUTRE: CategorieGeste.AUTRE,
};

type StatutLigne = 'NOUVEAU' | 'EXISTANT' | 'DOUBLON_FICHIER';

interface LigneGeste {
  ligneExcel: number;
  libelle: string;
  categorie?: CategorieGeste;
  categorieBrute: string;
  coutIndicatifFcfa?: number;
  statut: StatutLigne;
}

const STATUT_TAG: Record<StatutLigne, { color: string; label: string }> = {
  NOUVEAU: { color: 'green', label: 'Sera créé' },
  EXISTANT: { color: 'blue', label: 'Déjà existant — sera ignoré' },
  DOUBLON_FICHIER: { color: 'orange', label: 'Doublon dans le fichier — sera ignoré' },
};

function normaliserEnteteCompact(texte: unknown): string {
  return String(texte ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-ZÀ-Ÿ0-9]/g, '');
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Appelé après un import réussi pour recharger la table de la page. */
  onImported: () => void;
}

export function ImportGestesModal({ open, onClose, onImported }: Props) {
  const { message } = App.useApp();

  const [lignes, setLignes] = useState<LigneGeste[]>([]);
  const [chargement, setChargement] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [resultat, setResultat] = useState<ImportGestesResultat | null>(null);

  function reset() {
    setLignes([]);
    setResultat(null);
    setChargement(false);
    setEnvoiEnCours(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleFileSelected(file: File): Promise<boolean> {
    setChargement(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) throw new Error('Fichier vide.');
      const grille: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      // Cherche l'en-tête (colonne libellé obligatoire) dans les 5 premières lignes.
      let indexEntete = -1;
      let idxLibelle = -1;
      let idxCategorie = -1;
      let idxCout = -1;
      for (let i = 0; i < Math.min(grille.length, 5); i++) {
        const entetes = grille[i].map(normaliserEnteteCompact);
        const idx = entetes.findIndex((e) => ALIAS_LIBELLE.map(normaliserEnteteCompact).includes(e));
        if (idx >= 0) {
          indexEntete = i;
          idxLibelle = idx;
          idxCategorie = entetes.findIndex((e) => ALIAS_CATEGORIE.map(normaliserEnteteCompact).includes(e));
          idxCout = entetes.findIndex((e) => ALIAS_COUT.map(normaliserEnteteCompact).includes(e));
          break;
        }
      }
      if (indexEntete < 0) {
        message.error("En-tête introuvable : le fichier doit contenir une colonne GESTE (ou LIBELLE).");
        return false;
      }

      const parsees: LigneGeste[] = [];
      for (let i = indexEntete + 1; i < grille.length; i++) {
        const row = grille[i];
        const libelle = String(row[idxLibelle] ?? '').trim();
        if (!libelle) continue;
        const categorieBrute = idxCategorie >= 0 ? String(row[idxCategorie] ?? '').trim() : '';
        const coutBrut = idxCout >= 0 ? String(row[idxCout] ?? '').replace(/[^\d]/g, '') : '';
        parsees.push({
          ligneExcel: i + 1,
          libelle,
          categorie: CATEGORIES[categorieBrute.toUpperCase()],
          categorieBrute,
          coutIndicatifFcfa: coutBrut ? Number(coutBrut) : undefined,
          statut: 'NOUVEAU',
        });
      }
      if (parsees.length === 0) {
        message.error('Aucune ligne exploitable trouvée dans ce fichier.');
        return false;
      }

      // Marquage informatif : existants en base + doublons internes au fichier.
      const existants = await professionnelService.verifierGestesExistants(parsees.map((l) => l.libelle));
      const existantsSet = new Set(existants.map((l) => l.trim().toLowerCase()));
      const vus = new Set<string>();
      setLignes(
        parsees.map((l) => {
          const cle = l.libelle.toLowerCase();
          const statut: StatutLigne = existantsSet.has(cle) ? 'EXISTANT' : vus.has(cle) ? 'DOUBLON_FICHIER' : 'NOUVEAU';
          vus.add(cle);
          return { ...l, statut };
        }),
      );
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Fichier illisible.');
    } finally {
      setChargement(false);
    }
    return false;
  }

  async function handleImporter() {
    setEnvoiEnCours(true);
    try {
      // On envoie toutes les lignes : le backend est idempotent et ignore lui-même
      // les libellés déjà existants (le marquage de la prévisualisation n'est qu'informatif).
      const dtos: CreateGesteMarketingDto[] = lignes.map((l) => ({
        libelle: l.libelle,
        categorie: l.categorie,
        coutIndicatifFcfa: l.coutIndicatifFcfa,
        actif: true,
      }));
      const res = await professionnelService.importerGestesMarketing(dtos);
      setResultat(res);
      onImported();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Erreur lors de l'import.");
    } finally {
      setEnvoiEnCours(false);
    }
  }

  const nbACreer = lignes.filter((l) => l.statut === 'NOUVEAU').length;
  const nbIgnores = lignes.length - nbACreer;

  const columns: ColumnsType<LigneGeste> = [
    { title: 'Ligne', dataIndex: 'ligneExcel', width: 70 },
    { title: 'Geste', dataIndex: 'libelle', render: (v: string) => <Text strong>{v}</Text> },
    {
      title: 'Catégorie',
      render: (_, l) =>
        l.categorie ? <Tag>{l.categorie}</Tag> : l.categorieBrute ? <Tag color="orange">{l.categorieBrute} (?)</Tag> : '—',
    },
    {
      title: 'Coût indicatif',
      render: (_, l) => (l.coutIndicatifFcfa != null ? formatFcfa(l.coutIndicatifFcfa) : '—'),
    },
    {
      title: 'Statut',
      render: (_, l) => <Tag color={STATUT_TAG[l.statut].color}>{STATUT_TAG[l.statut].label}</Tag>,
    },
  ];

  return (
    <Modal
      open={open}
      title="Importer des gestes marketing"
      onCancel={handleClose}
      width={760}
      footer={null}
      destroyOnClose>
      {resultat ? (
        <Result
          status="success"
          title="Import terminé"
          subTitle={
            <Space direction="vertical">
              <span>{resultat.crees} geste(s) créé(s)</span>
              <span>{resultat.ignores} déjà existant(s) ignoré(s)</span>
              {resultat.libellesIgnores.length > 0 && (
                <Text type="secondary">Ignorés : {resultat.libellesIgnores.join(', ')}</Text>
              )}
            </Space>
          }
          extra={
            <Button type="primary" onClick={handleClose}>
              Fermer
            </Button>
          }
        />
      ) : lignes.length === 0 ? (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            type="info"
            showIcon
            message="Format attendu : une colonne GESTE (ou LIBELLE), et en option CATEGORIE (Repas, Cadeau, Financier, Échantillon, Autre) et COUT."
          />
          <Dragger accept=".xlsx,.xls,.csv" beforeUpload={handleFileSelected} showUploadList={false} disabled={chargement}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Cliquez ou déposez un fichier ici</p>
            <p className="ant-upload-hint">.xlsx, .xls ou .csv</p>
          </Dragger>
        </Space>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            type={nbACreer > 0 ? 'success' : 'warning'}
            showIcon
            message={
              nbACreer > 0
                ? `${nbACreer} geste(s) seront créés — ${nbIgnores} ligne(s) ignorée(s) (déjà existantes ou en doublon).`
                : 'Tous les gestes du fichier existent déjà : rien ne sera créé.'
            }
          />
          <Table<LigneGeste>
            rowKey="ligneExcel"
            columns={columns}
            dataSource={lignes}
            size="small"
            pagination={{ pageSize: 8 }}
          />
          <Space>
            <Button onClick={reset}>Choisir un autre fichier</Button>
            <Button type="primary" loading={envoiEnCours} disabled={nbACreer === 0} onClick={handleImporter}>
              Valider l&apos;import ({nbACreer})
            </Button>
          </Space>
        </Space>
      )}
    </Modal>
  );
}
