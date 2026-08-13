'use client';

import { InboxOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  App,
  Button,
  Descriptions,
  Progress,
  Result,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  Typography,
  Upload,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import { professionnelService, utilisateurService } from '@/services';
import type { Centre, GesteMarketing, ProfessionnelSante, Specialite, Utilisateur } from '@/types';
import { formatJoursConsultation, formatPotentielCas } from '../utils';
import { demarrerImport, effacerJob, reprendreImport, resultatPartiel, useImportJob } from './importJobStore';
import { listerFeuillesImportables, parserFeuille } from './parseFichier';
import { transformerLignes } from './transformerLignes';
import type { LigneBrute, ProfessionnelAImporter } from './types';

const { Dragger } = Upload;
const { Text } = Typography;

const STATUT_TAG: Record<ProfessionnelAImporter['statut'], { color: string; label: string }> = {
  PRETE: { color: 'green', label: 'Prête' },
  A_VERIFIER: { color: 'orange', label: 'À vérifier' },
  DOUBLON: { color: 'red', label: 'Doublon détecté' },
};

function formatDuree(secondes: number): string {
  if (secondes < 5) return 'quelques secondes';
  if (secondes < 60) return `${secondes} s`;
  const min = Math.floor(secondes / 60);
  const rest = secondes % 60;
  return rest > 0 ? `${min} min ${rest} s` : `${min} min`;
}

export function ImportWizard() {
  const { user } = useAuth();
  const { message } = App.useApp();

  const [step, setStep] = useState(0);

  const estGestionnaire = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;
  const [delegues, setDelegues] = useState<Utilisateur[]>([]);
  const [delegueChoisiId, setDelegueChoisiId] = useState<string | null>(null);

  // Étape 1
  const [file, setFile] = useState<File | null>(null);
  const [feuilles, setFeuilles] = useState<string[]>([]);
  const [feuilleChoisie, setFeuilleChoisie] = useState<string | null>(null);
  const [lignesBrutes, setLignesBrutes] = useState<LigneBrute[]>([]);
  const [lignesIgnorees, setLignesIgnorees] = useState(0);
  const [colonnesManquantes, setColonnesManquantes] = useState<string[]>([]);
  const [chargement, setChargement] = useState(false);

  // Étape 2
  const [lignes, setLignes] = useState<ProfessionnelAImporter[]>([]);
  const [specialitesRef, setSpecialitesRef] = useState<Specialite[]>([]);

  // Étape 4 — piloté par le store global (survit à la navigation et au rechargement de page)
  const job = useImportJob();

  useEffect(() => {
    if (estGestionnaire) {
      utilisateurService.getByRole(UserRole.DELEGUE).then(setDelegues).catch(() => {});
    }
  }, [estGestionnaire]);

  const delegueChoisi = delegues.find((d) => d.id === delegueChoisiId);
  const delegueId = estGestionnaire ? delegueChoisiId ?? undefined : user?.id;
  const zoneId = estGestionnaire ? delegueChoisi?.zoneIds?.[0] : user?.zoneIds?.[0];

  async function handleFileSelected(f: File) {
    setFile(f);
    setChargement(true);
    try {
      const noms = await listerFeuillesImportables(f);
      if (noms.length === 0) {
        message.error("Aucune feuille exploitable trouvée dans ce fichier (en-tête JOUR/CENTRE introuvable).");
      }
      setFeuilles(noms);
      setFeuilleChoisie(noms[0] ?? null);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Fichier illisible.');
    } finally {
      setChargement(false);
    }
    return false;
  }

  async function handleAnalyser() {
    if (!file || !feuilleChoisie) return;
    setChargement(true);
    try {
      const res = await parserFeuille(file, feuilleChoisie);
      setLignesBrutes(res.lignes);
      setLignesIgnorees(res.lignesIgnorees);
      setColonnesManquantes(res.colonnesManquantes);
      setStep(1);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erreur lors de la lecture du fichier.');
    } finally {
      setChargement(false);
    }
  }

  async function handleNormaliser() {
    if (!zoneId) {
      message.error(
        estGestionnaire ? 'Sélectionnez un délégué avant de lancer la normalisation.' : 'Aucune zone associée à votre profil délégué.',
      );
      return;
    }
    setChargement(true);
    try {
      const [centres, specialites, gestes, professionnelsExistants]: [
        Centre[],
        Specialite[],
        GesteMarketing[],
        ProfessionnelSante[],
      ] = await Promise.all([
        professionnelService.getCentres(),
        professionnelService.getSpecialites(),
        professionnelService.getGestesMarketing(),
        professionnelService.getProfessionnels(),
      ]);
      const transformees = transformerLignes(lignesBrutes, {
        zoneId,
        centres,
        specialites,
        gestes,
        professionnelsExistants,
      });
      setLignes(transformees);
      setSpecialitesRef(specialites);
      setStep(2);
    } finally {
      setChargement(false);
    }
  }

  function setActionDoublon(cle: string, action: ProfessionnelAImporter['actionDoublon']) {
    setLignes((prev) => prev.map((l) => (l.cle === cle ? { ...l, actionDoublon: action } : l)));
  }

  function handleSoumettre() {
    if (!user || !delegueId || !zoneId || lignes.length === 0) return;
    const nomDelegue = estGestionnaire && delegueChoisi ? `${delegueChoisi.prenom} ${delegueChoisi.nom}` : `${user.prenom} ${user.nom}`;
    demarrerImport(lignes, delegueId, nomDelegue, zoneId);
  }

  function handleNouvelImport() {
    effacerJob();
    setStep(0);
    setFile(null);
    setFeuilles([]);
    setFeuilleChoisie(null);
    setLignesBrutes([]);
    setLignesIgnorees(0);
    setColonnesManquantes([]);
    setLignes([]);
    setSpecialitesRef([]);
    setDelegueChoisiId(null);
  }

  const rapport = useMemo(() => {
    const centresACreer = new Set(lignes.filter((l) => l.centreACreer).map((l) => l.centreBrut.toUpperCase())).size;
    const specialitesInconnues = new Set(lignes.flatMap((l) => l.specialitesInconnues)).size;
    const gestesInconnus = new Set(lignes.flatMap((l) => l.gestesInconnus)).size;
    const casNonParsables = lignes.filter((l) => l.nbreDeCasBrut && !l.potentielCas).length;
    const joursNonParsables = lignes.filter((l) => l.jrsConsBrut && !l.joursConsultation).length;
    const doublons = lignes.filter((l) => l.statut === 'DOUBLON').length;
    const pretes = lignes.filter((l) => l.statut === 'PRETE').length;
    return { centresACreer, specialitesInconnues, gestesInconnus, casNonParsables, joursNonParsables, doublons, pretes };
  }, [lignes]);

  const columns: ColumnsType<ProfessionnelAImporter> = [
    { title: 'Ligne', dataIndex: 'ligneExcel', width: 70 },
    { title: 'Nom', dataIndex: 'nom' },
    {
      title: 'Centre',
      render: (_, l) => (l.centreACreer ? <Tag color="orange">{l.centreBrut} (à créer)</Tag> : l.centreBrut),
    },
    {
      title: 'Spécialités',
      render: (_, l) => (
        <Space size={4} wrap>
          {l.specialiteIds.map((id) => (
            <Tag key={id} color="green">
              {specialitesRef.find((s) => s.id === id)?.code ?? id}
            </Tag>
          ))}
          {l.specialitesInconnues.map((s) => (
            <Tag key={s} color="orange">
              {s} (?)
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Consultation',
      render: (_, l) =>
        l.joursConsultation ? (
          formatJoursConsultation(l.joursConsultation)
        ) : l.jrsConsBrut ? (
          <Text type="danger">{l.jrsConsBrut}</Text>
        ) : (
          '—'
        ),
    },
    {
      title: 'Potentiel',
      render: (_, l) =>
        l.potentielCas ? (
          formatPotentielCas(l.potentielCas)
        ) : l.nbreDeCasBrut ? (
          <Text type="danger">{l.nbreDeCasBrut}</Text>
        ) : (
          '—'
        ),
    },
    {
      title: 'Statut',
      render: (_, l) => <Tag color={STATUT_TAG[l.statut].color}>{STATUT_TAG[l.statut].label}</Tag>,
    },
    {
      title: 'Action doublon',
      render: (_, l) =>
        l.statut === 'DOUBLON' ? (
          <Select<ProfessionnelAImporter['actionDoublon']>
            size="small"
            style={{ width: 160 }}
            value={l.actionDoublon}
            onChange={(v) => setActionDoublon(l.cle, v)}
            options={[
              { value: 'IGNORER', label: 'Ignorer' },
              { value: 'REMPLACER', label: 'Remplacer' },
              { value: 'CREER_QUAND_MEME', label: 'Créer quand même' },
            ]}
          />
        ) : (
          '—'
        ),
    },
  ];

  return (
    <PageContainer title="Import de professionnels de santé" subTitle="Fichier Excel — plan de tournée">
      <Steps
        current={job ? (job.statut === 'TERMINE' ? 3 : 2) : step}
        items={[{ title: 'Fichier' }, { title: 'Normalisation' }, { title: 'Revue' }, { title: 'Soumission' }]}
        style={{ marginBottom: 32 }}
      />

      {job && job.statut === 'TERMINE' && (
        <Result
          status="success"
          title="Import terminé"
          subTitle={
            <Space direction="vertical">
              <span>Pour {job.delegueNom}</span>
              <span>{resultatPartiel(job).creees} fiche(s) créée(s)</span>
              <span>{resultatPartiel(job).miseAJour} fiche(s) mise(s) à jour</span>
              <span>{resultatPartiel(job).centresCrees} nouveau(x) centre(s) créé(s)</span>
              <span>{resultatPartiel(job).ignorees} ligne(s) ignorée(s)</span>
              <span>{resultatPartiel(job).demandesValidation} demande(s) envoyée(s) à l'administrateur</span>
            </Space>
          }
          extra={
            <Button type="primary" onClick={handleNouvelImport}>
              Nouvel import
            </Button>
          }
        />
      )}

      {job && job.statut !== 'TERMINE' && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Délégué">{job.delegueNom}</Descriptions.Item>
            <Descriptions.Item label="Progression">
              {job.curseur} / {job.total} lignes
            </Descriptions.Item>
          </Descriptions>

          {job.statut === 'EN_COURS' && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Progress percent={Math.round((job.curseur / job.total) * 100)} status="active" />
              <Text type="secondary">
                {job.curseur} / {job.total} ligne{job.total > 1 ? 's' : ''} importée{job.curseur > 1 ? 's' : ''}
                {job.etaSecondes != null ? ` · encore environ ${formatDuree(job.etaSecondes)}` : ''}
                {' · '}vous pouvez quitter cette page, l&apos;import continue en arrière-plan.
              </Text>
            </Space>
          )}

          {job.statut === 'INTERROMPU' && (
            <Alert
              type="warning"
              showIcon
              message="Import interrompu"
              description={`La page a été rechargée pendant l'import : ${job.curseur} / ${job.total} lignes avaient déjà été traitées à ce moment-là. Vous pouvez reprendre à partir de là, sans dupliquer ce qui a déjà été importé.`}
              action={
                <Button size="small" type="primary" onClick={reprendreImport}>
                  Reprendre l&apos;import
                </Button>
              }
            />
          )}

          {job.statut === 'ERREUR' && (
            <Alert
              type="error"
              showIcon
              message="Erreur pendant l'import"
              description={job.erreur ?? 'Une erreur inattendue est survenue.'}
              action={
                <Button size="small" danger onClick={reprendreImport}>
                  Réessayer
                </Button>
              }
            />
          )}
        </Space>
      )}

      {!job && step === 0 && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            type="info"
            showIcon
            message="Format attendu : colonnes JOUR, CENTRE, SPECIALITE, NOM ET PRENOM, NUMERO, JRS/CONS, NBRE DE CAS, ACTION, OBSERVATION."
          />
          {estGestionnaire && (
            <Space direction="vertical">
              <Text strong>Délégué concerné par ce fichier</Text>
              <Select
                style={{ width: 280 }}
                placeholder="Sélectionner un délégué"
                value={delegueChoisiId}
                onChange={setDelegueChoisiId}
                options={delegues.map((d) => ({ value: d.id, label: `${d.prenom} ${d.nom}` }))}
              />
              {delegueChoisiId && !zoneId && (
                <Alert type="warning" showIcon message="Ce délégué n'a aucune zone associée — l'import ne pourra pas être lancé." />
              )}
            </Space>
          )}
          <Dragger
            accept=".xlsx,.xls"
            beforeUpload={handleFileSelected}
            showUploadList={false}
            disabled={chargement || (estGestionnaire && !delegueChoisiId)}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Cliquez ou déposez un fichier Excel ici</p>
            <p className="ant-upload-hint">.xlsx ou .xls</p>
          </Dragger>

          {feuilles.length > 0 && (
            <Space direction="vertical">
              <Text strong>Feuille à importer</Text>
              <Select
                style={{ width: 280 }}
                value={feuilleChoisie}
                onChange={setFeuilleChoisie}
                options={feuilles.map((f) => ({ value: f, label: f }))}
              />
              <Button type="primary" loading={chargement} onClick={handleAnalyser}>
                Analyser le fichier
              </Button>
            </Space>
          )}
        </Space>
      )}

      {!job && step === 1 && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Lignes lues">{lignesBrutes.length}</Descriptions.Item>
            <Descriptions.Item label="Lignes ignorées (sections parasites)">{lignesIgnorees}</Descriptions.Item>
          </Descriptions>
          {colonnesManquantes.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message={`Colonnes non détectées : ${colonnesManquantes.join(', ')}`}
              description="Vérifiez les en-têtes du fichier — ces champs resteront vides."
            />
          )}
          <Button type="primary" loading={chargement} onClick={handleNormaliser}>
            Lancer la normalisation
          </Button>
        </Space>
      )}

      {!job && step === 2 && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Descriptions bordered size="small" column={4}>
            <Descriptions.Item label="Prêtes">{rapport.pretes}</Descriptions.Item>
            <Descriptions.Item label="Doublons">{rapport.doublons}</Descriptions.Item>
            <Descriptions.Item label="Centres à créer">{rapport.centresACreer}</Descriptions.Item>
            <Descriptions.Item label="Spécialités inconnues">{rapport.specialitesInconnues}</Descriptions.Item>
            <Descriptions.Item label="Gestes inconnus">{rapport.gestesInconnus}</Descriptions.Item>
            <Descriptions.Item label="Potentiel non reconnu">{rapport.casNonParsables}</Descriptions.Item>
            <Descriptions.Item label="Jours non reconnus">{rapport.joursNonParsables}</Descriptions.Item>
            <Descriptions.Item label="Total lignes">{lignes.length}</Descriptions.Item>
          </Descriptions>

          <Table<ProfessionnelAImporter>
            rowKey="cle"
            columns={columns}
            dataSource={lignes}
            size="small"
            pagination={{ pageSize: 10 }}
            scroll={{ x: true }}
          />

          <Button type="primary" onClick={handleSoumettre} disabled={lignes.length === 0}>
            Soumettre l'import
          </Button>
        </Space>
      )}
    </PageContainer>
  );
}
