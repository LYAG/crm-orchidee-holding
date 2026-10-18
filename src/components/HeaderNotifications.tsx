'use client';

import {
  AlertOutlined,
  BellOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloudUploadOutlined,
  ReadOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Badge, Button, Empty, Popover, Spin, Tag, Typography } from 'antd';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { UserRole } from '@/lib/constants';
import { useImportJob } from '@/features/professionnels/import/importJobStore';
import { formationService, professionnelService, rdvService, reportingService } from '@/services';
import { QualificationTransformation, RdvStatut, StatutDemandeValidation, TypeDemandeValidation } from '@/types';
import type { Utilisateur } from '@/types';

const { Text } = Typography;

interface AlertItem {
  key: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  link?: string;
  type: 'error' | 'warning' | 'info' | 'success';
}

interface Props {
  user: Utilisateur;
}

export function HeaderNotifications({ user }: Props) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const importJob = useImportJob();

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, user.role]);

  const importAlert: AlertItem | null = !importJob
    ? null
    : importJob.statut === 'TERMINE'
      ? null
      : importJob.statut === 'INTERROMPU'
        ? {
            key: 'import',
            icon: <CloudUploadOutlined />,
            type: 'warning',
            title: 'Import interrompu',
            description: `${importJob.curseur} / ${importJob.total} lignes traitées pour ${importJob.delegueNom} — reprendre l'import.`,
            link: '/professionnels/import',
          }
        : importJob.statut === 'ERREUR'
          ? {
              key: 'import',
              icon: <CloudUploadOutlined />,
              type: 'error',
              title: "Erreur pendant l'import",
              description: importJob.erreur ?? 'Une erreur est survenue — cliquez pour reprendre.',
              link: '/professionnels/import',
            }
          : {
              key: 'import',
              icon: <CloudUploadOutlined />,
              type: 'info',
              title: `Import en cours — ${Math.round((importJob.curseur / importJob.total) * 100)} %`,
              description: `${importJob.curseur} / ${importJob.total} lignes pour ${importJob.delegueNom}.`,
              link: '/professionnels/import',
            };

  const alertsAffiches = importAlert ? [importAlert, ...alerts] : alerts;

  async function load() {
    setLoading(true);
    try {
      const items: AlertItem[] = [];

      if (user.role === UserRole.ADMIN) {
        const kpi = await reportingService.getKpiAdmin();

        if (kpi.professionnelsNonAttribuesSup30j > 0) {
          items.push({
            key: 'pna',
            icon: <TeamOutlined />,
            type: 'warning',
            title: `${kpi.professionnelsNonAttribuesSup30j} PNA non attribué${kpi.professionnelsNonAttribuesSup30j > 1 ? 's' : ''} > 30 j`,
            description: 'Ces professionnels attendent une affectation à un délégué.',
            link: '/professionnels',
          });
        }

        const demandesEnAttente = await professionnelService.getDemandesValidation(StatutDemandeValidation.EN_ATTENTE);
        if (demandesEnAttente.length > 0) {
          items.push({
            key: 'demandes-validation',
            icon: <SafetyCertificateOutlined />,
            type: 'info',
            title: `${demandesEnAttente.length} demande${demandesEnAttente.length > 1 ? 's' : ''} en attente de validation`,
            description: 'Centres, spécialités, gestes, doublons et classifications à valider.',
            link: '/validations',
          });
        }
      }

      if (user.role === UserRole.MANAGER) {
        const kpi = await reportingService.getKpiManager(user.id);
        const lowPerformers = kpi.delegues.filter((d) => d.tauxTransformation < 0.2 && d.nbRdv > 2);

        if (lowPerformers.length > 0) {
          items.push({
            key: 'perf',
            icon: <AlertOutlined />,
            type: 'warning',
            title: `${lowPerformers.length} délégué${lowPerformers.length > 1 ? 's' : ''} sous objectif`,
            description: lowPerformers.map((d) => d.nom.split(' ')[0]).join(', ') + ' — taux < 20 %.',
            link: '/reporting',
          });
        }

        // Count unqualified past RDV across team
        const teamRdv = await rdvService.getAll({});
        const nonQualifies = teamRdv.filter(
          (r) =>
            r.statut === RdvStatut.REALISE &&
            !r.qualifie &&
            new Date(r.dateHeure) < new Date(),
        );
        if (nonQualifies.length > 0) {
          items.push({
            key: 'nonqual',
            icon: <CalendarOutlined />,
            type: 'info',
            title: `${nonQualifies.length} RDV non qualifié${nonQualifies.length > 1 ? 's' : ''}`,
            description: 'Des rendez-vous réalisés attendent encore leur qualification.',
            link: '/rdv',
          });
        }

        // Demandes de changement de classification proposées par l'équipe
        const equipeIds = kpi.delegues.map((d) => d.delegueId);
        const demandesEquipe = (
          await professionnelService.getDemandesValidation(StatutDemandeValidation.EN_ATTENTE)
        ).filter(
          (d) => d.type === TypeDemandeValidation.CHANGEMENT_CLASSIFICATION && equipeIds.includes(d.delegueId),
        );
        if (demandesEquipe.length > 0) {
          items.push({
            key: 'demandes-classification',
            icon: <SafetyCertificateOutlined />,
            type: 'info',
            title: `${demandesEquipe.length} demande${demandesEquipe.length > 1 ? 's' : ''} de classification à valider`,
            description: 'Changements de classification proposés par votre équipe.',
            link: '/validations',
          });
        }
      }

      if (user.role === UserRole.DELEGUE) {
        // Relances à venir
        const rdvs = await rdvService.getAll({ delegueId: user.id });
        const qualPromises = rdvs
          .filter((r) => r.statut === RdvStatut.REALISE && r.qualifie)
          .map((r) =>
            rdvService
              ? import('@/services').then((mod) =>
                  mod.qualificationService.getByRdv(r.id),
                )
              : Promise.resolve(null),
          );

        const qualifications = await Promise.all(qualPromises);
        const now = new Date();
        const relances = qualifications
          .filter(
            (q) =>
              q &&
              q.transformation === QualificationTransformation.RELANCE_NECESSAIRE &&
              q.dateRelance &&
              new Date(q.dateRelance) >= now,
          )
          .sort((a, b) =>
            new Date(a!.dateRelance!).getTime() - new Date(b!.dateRelance!).getTime(),
          );

        if (relances.length > 0) {
          const next = relances[0];
          const dateLabel = next?.dateRelance
            ? new Date(next.dateRelance).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
              })
            : '';
          items.push({
            key: 'relances',
            icon: <CalendarOutlined />,
            type: 'info',
            title: `${relances.length} relance${relances.length > 1 ? 's' : ''} à venir`,
            description: `Prochaine le ${dateLabel}.`,
            link: '/',
          });
        }

        // Non qualifiés
        const nonQualifies = rdvs.filter(
          (r) =>
            r.statut === RdvStatut.REALISE &&
            !r.qualifie &&
            new Date(r.dateHeure) < new Date(),
        );
        if (nonQualifies.length > 0) {
          items.push({
            key: 'nonqual',
            icon: <CalendarOutlined />,
            type: 'warning',
            title: `${nonQualifies.length} RDV à qualifier`,
            description: 'Des rendez-vous réalisés n\'ont pas encore été qualifiés.',
            link: '/rdv',
          });
        }

        // Mes demandes de changement de classification en attente
        const mesDemandes = (
          await professionnelService.getDemandesValidation(StatutDemandeValidation.EN_ATTENTE)
        ).filter(
          (d) => d.type === TypeDemandeValidation.CHANGEMENT_CLASSIFICATION && d.delegueId === user.id,
        );
        if (mesDemandes.length > 0) {
          items.push({
            key: 'mes-demandes-classification',
            icon: <SafetyCertificateOutlined />,
            type: 'info',
            title: `${mesDemandes.length} demande${mesDemandes.length > 1 ? 's' : ''} de classification en attente`,
            description: "En attente de validation par votre manager ou l'administrateur.",
            link: '/validations',
          });
        }
      }

      // Notifications du module Formation (tous rôles), isolées pour ne pas bloquer les autres alertes.
      try {
        const nonLues = (await formationService.getNotifications()).filter((n) => !n.lue);
        if (nonLues.length > 0) {
          items.push({
            key: 'formation',
            icon: <ReadOutlined />,
            type: 'info',
            title: `${nonLues.length} notification${nonLues.length > 1 ? 's' : ''} Formation`,
            description: nonLues[0].titre,
            link: '/formation/notifications',
          });
        }
      } catch {
        // Module Formation indisponible : on ignore.
      }

      setAlerts(items);
    } catch {
      // Silent — notifications ne doivent pas bloquer l'app
    } finally {
      setLoading(false);
    }
  }

  const TYPE_STYLES: Record<AlertItem['type'], { bg: string; color: string; border: string }> = {
    error:   { bg: '#FDF5F4', color: '#C2362F', border: '#F3CFCC' },
    warning: { bg: '#FDF6EE', color: '#A84A00', border: '#F4D9B8' },
    info:    { bg: '#F0F4FF', color: '#1F5FA8', border: '#BBDEFB' },
    success: { bg: '#EDFAF5', color: '#1E7A4C', border: '#C9DFD5' },
  };

  const content = (
    <div style={{ width: 'min(340px, calc(100vw - 32px))' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px 10px',
          borderBottom: '1px solid #E3EAE7',
        }}
      >
        <Text strong style={{ fontSize: 14, color: '#123832' }}>
          Notifications
        </Text>
        {alertsAffiches.length > 0 && (
          <Tag
            style={{
              background: '#FBECEB',
              color: '#C2362F',
              border: 'none',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 11,
              padding: '0 8px',
            }}
          >
            {alertsAffiches.length} action{alertsAffiches.length > 1 ? 's' : ''}
          </Tag>
        )}
      </div>

      {/* Content */}
      <div style={{ maxHeight: 360, overflowY: 'auto', padding: '8px 0' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Spin size="small" />
          </div>
        ) : alertsAffiches.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: '#627A74', fontSize: 13 }}>
                Aucune action en attente
              </span>
            }
            style={{ padding: '24px 16px' }}
          />
        ) : (
          alertsAffiches.map((alert) => {
            const style = TYPE_STYLES[alert.type];
            const row = (
              <div
                key={alert.key}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '10px 16px',
                  margin: '2px 8px',
                  borderRadius: 8,
                  background: style.bg,
                  border: `1px solid ${style.border}`,
                  cursor: alert.link ? 'pointer' : 'default',
                  transition: 'opacity 0.15s',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `${style.color}18`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: style.color,
                    fontSize: 15,
                    flexShrink: 0,
                  }}
                >
                  {alert.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    strong
                    style={{ display: 'block', fontSize: 13, color: '#123832', lineHeight: 1.3 }}
                  >
                    {alert.title}
                  </Text>
                  <Text
                    type="secondary"
                    style={{ display: 'block', fontSize: 12, marginTop: 2, lineHeight: 1.4 }}
                  >
                    {alert.description}
                  </Text>
                </div>
              </div>
            );

            return alert.link ? (
              <Link key={alert.key} href={alert.link} onClick={() => setOpen(false)}>
                {row}
              </Link>
            ) : (
              row
            );
          })
        )}
      </div>

      {/* Footer */}
      {!loading && alertsAffiches.length === 0 && (
        <div
          style={{
            padding: '8px 16px 12px',
            borderTop: '1px solid #E3EAE7',
            textAlign: 'center',
          }}
        >
          <CheckCircleOutlined style={{ color: '#0F6E52', marginRight: 6 }} />
          <Text style={{ fontSize: 12, color: '#627A74' }}>
            Tout est à jour
          </Text>
        </div>
      )}
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
      styles={{
        root: { padding: 0 },
        container: {
          padding: 0,
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          border: '1px solid #E3EAE7',
        },
      }}
    >
      <Button
        type="text"
        shape="circle"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          color: alertsAffiches.length > 0 ? '#123832' : '#627A74',
        }}
      >
        <Badge
          count={alertsAffiches.length}
          size="small"
          offset={[-2, 2]}
          styles={{
            indicator: {
              background: '#C2362F',
              boxShadow: 'none',
              minWidth: 16,
              height: 16,
              lineHeight: '16px',
              fontSize: 10,
              fontWeight: 700,
            },
          }}
        >
          <BellOutlined style={{ fontSize: 18 }} />
        </Badge>
      </Button>
    </Popover>
  );
}
