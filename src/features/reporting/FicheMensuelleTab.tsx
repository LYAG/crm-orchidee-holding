'use client';

import { PrinterOutlined } from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { App, Button, DatePicker, Select, Space, Table, Tag, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import { construireLigneFiltres, construireTableauHtml, imprimerRapport } from '@/lib/impression';
import { qualificationService, utilisateurService } from '@/services';
import type { FicheMensuelleProfessionnel, Utilisateur } from '@/types';

const { Text } = Typography;

// Fiche de suivi mensuel (calquée sur la fiche papier "Planning Mensuel — Fiche de Suivi"
// Orchidée Holding) : jusqu'à 3 visites qualifiées par professionnel et par mois calendaire,
// saisies depuis l'app mobile délégué (voir mobile-crm-oh, app/rdv/[id]/qualification.tsx).
// Lecture seule ici — aucune saisie web pour l'instant, uniquement consultation/impression.
function ouiNon(v: boolean | undefined): string {
  return v === true ? 'Oui' : v === false ? 'Non' : '—';
}

export function FicheMensuelleTab() {
  const { user } = useAuth();
  const { message } = App.useApp();

  const [delegues, setDelegues] = useState<Utilisateur[]>([]);
  const [delegueId, setDelegueId] = useState<string | undefined>();
  const [mois, setMois] = useState<Dayjs>(dayjs());
  const [fiches, setFiches] = useState<FicheMensuelleProfessionnel[]>([]);
  const [loading, setLoading] = useState(false);

  // Hooks déclarés inconditionnellement (avant tout `return`) : user peut valoir undefined le
  // temps de la restauration de session (voir useAuth), le rendu se limite alors à `null` plus
  // bas, mais l'ordre des hooks ne doit jamais dépendre de cette valeur.
  const isManager = user?.role === UserRole.MANAGER;
  const isAdmin = user?.role === UserRole.ADMIN;
  const peutChoisirDelegue = isManager || isAdmin;
  const userId = user?.id;

  useEffect(() => {
    if (!peutChoisirDelegue || !userId) return;
    const fn = isManager ? utilisateurService.getDeleguesByManager(userId) : utilisateurService.getByRole(UserRole.DELEGUE);
    fn.then((liste) => {
      setDelegues(liste);
      setDelegueId((actuel) => actuel ?? liste[0]?.id);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peutChoisirDelegue, userId]);

  const delegueCible = peutChoisirDelegue ? delegueId : userId;

  useEffect(() => {
    if (!delegueCible) return;
    setLoading(true);
    qualificationService
      .getFicheMensuelle(delegueCible, mois.year(), mois.month() + 1)
      .then(setFiches)
      .catch(() => message.error('Erreur lors du chargement de la fiche mensuelle.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delegueCible, mois]);

  if (!user) return null;
  const currentUser = user;

  const lignes = fiches.flatMap((f) =>
    f.visites.map((v) => ({
      key: `${f.professionnelId}_${v.numeroVisite}`,
      professionnelNom: f.professionnelNom,
      centreNom: f.centreNom,
      ...v,
    }))
  );

  function handleImprimer() {
    const delegueNom = delegues.find((d) => d.id === delegueId);
    const resumeFiltres = construireLigneFiltres([
      { label: 'Délégué', valeur: delegueNom ? `${delegueNom.prenom} ${delegueNom.nom}` : peutChoisirDelegue ? undefined : `${currentUser.prenom} ${currentUser.nom}` },
      { label: 'Mois', valeur: mois.format('MMMM YYYY') },
    ]);
    const entetes = [
      'Professionnel',
      'Centre',
      'N° visite',
      'Date',
      'Produit connu et prescrit',
      'Nb de cas',
      'Engagement chiffré',
      'Engagement respecté',
      'Retour',
      'Tous cas bénéficient',
      'Remerciement / Pourquoi',
    ];
    const corpsLignes = lignes.map((l) => [
      l.professionnelNom,
      l.centreNom,
      l.numeroVisite,
      dayjs(l.dateVisite).format('DD/MM/YYYY'),
      l.numeroVisite === 1 ? ouiNon(l.produitConnuEtPrescrit) : '—',
      l.numeroVisite === 1 && l.nombreDeCas != null ? l.nombreDeCas : '—',
      l.numeroVisite === 2 && l.engagementChiffre != null ? l.engagementChiffre : '—',
      l.numeroVisite === 2 ? ouiNon(l.engagementRespecte) : '—',
      l.numeroVisite === 2 ? l.retourEngagement ?? '—' : '—',
      l.numeroVisite === 3 ? ouiNon(l.tousCasBeneficient) : '—',
      l.numeroVisite === 3 ? l.remerciement ?? l.pourquoiNonRespecte ?? '—' : l.numeroVisite === 2 ? l.pourquoiNonRespecte ?? '—' : '—',
    ]);
    const corps = `
      <h1 style="font-size:18px; margin:0;">Planning Mensuel — Fiche de Suivi</h1>
      <p style="color:#6B8A82; font-size:13px; margin:4px 0 16px;">
        ${resumeFiltres} · Généré le ${dayjs().format('DD/MM/YYYY à HH:mm')}
      </p>
      ${construireTableauHtml(entetes, corpsLignes)}
    `;
    imprimerRapport('Planning Mensuel — Fiche de Suivi', corps);
  }

  return (
    <div>
      <ProCard bordered style={{ marginBottom: 16, borderRadius: 12 }} bodyStyle={{ padding: '14px 20px' }}>
        <Space wrap>
          <Text style={{ fontSize: 13, fontWeight: 600, color: '#1F4E45' }}>Filtres :</Text>
          {peutChoisirDelegue && (
            <Select
              placeholder="Délégué"
              style={{ width: 200 }}
              value={delegueId}
              onChange={setDelegueId}
              options={delegues.map((d) => ({ value: d.id, label: `${d.prenom} ${d.nom}` }))}
            />
          )}
          <DatePicker picker="month" allowClear={false} value={mois} onChange={(v) => v && setMois(v)} format="MMMM YYYY" />
        </Space>
      </ProCard>

      <ProCard
        title="Planning Mensuel — Fiche de Suivi"
        bordered
        style={{ borderRadius: 12 }}
        bodyStyle={{ padding: 0 }}
        extra={
          <Button size="small" icon={<PrinterOutlined />} onClick={handleImprimer} disabled={lignes.length === 0}>
            Imprimer / PDF
          </Button>
        }
      >
        <Table
          size="small"
          loading={loading}
          dataSource={lignes}
          rowKey="key"
          pagination={{ pageSize: 20 }}
          columns={[
            { title: 'Professionnel', dataIndex: 'professionnelNom' },
            { title: 'Centre', dataIndex: 'centreNom' },
            { title: 'N° visite', dataIndex: 'numeroVisite', render: (v) => <Tag>{v}</Tag> },
            { title: 'Date', dataIndex: 'dateVisite', render: (v) => dayjs(v).format('DD/MM/YYYY') },
            {
              title: '1ère visite',
              children: [
                { title: 'Produit connu et prescrit', render: (_, r) => (r.numeroVisite === 1 ? ouiNon(r.produitConnuEtPrescrit) : '—') },
                { title: 'Nb de cas', render: (_, r) => (r.numeroVisite === 1 ? (r.nombreDeCas ?? '—') : '—') },
              ],
            },
            {
              title: '2ème visite',
              children: [
                { title: 'Engagement chiffré', render: (_, r) => (r.numeroVisite === 2 ? (r.engagementChiffre ?? '—') : '—') },
                { title: 'Respecté', render: (_, r) => (r.numeroVisite === 2 ? ouiNon(r.engagementRespecte) : '—') },
                { title: 'Retour / Pourquoi', render: (_, r) => (r.numeroVisite === 2 ? r.retourEngagement ?? r.pourquoiNonRespecte ?? '—' : '—') },
              ],
            },
            {
              title: '3ème visite',
              children: [
                { title: 'Tous cas bénéficient', render: (_, r) => (r.numeroVisite === 3 ? ouiNon(r.tousCasBeneficient) : '—') },
                { title: 'Remerciement / Pourquoi', render: (_, r) => (r.numeroVisite === 3 ? r.remerciement ?? r.pourquoiNonRespecte ?? '—' : '—') },
              ],
            },
          ]}
        />
      </ProCard>
    </div>
  );
}
