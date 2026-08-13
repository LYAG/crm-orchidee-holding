import type { ReportingService } from '@/services/api/ReportingService';
import type { KpiAdmin, KpiDelegue, KpiManager, PeriodeRapport, TopDelegue } from '@/types';
import { OpportuniteEtape, QualificationTransformation, RdvStatut, StatutProfessionnel } from '@/types';
import { delay } from './_utils';
import { opportunites, qualifications, rendezvous, utilisateurs } from './data';
import { centres, historiqueChangementsStatut, professionnels } from './professionnelsData';

function now() {
  return new Date().toISOString();
}

export class ReportingServiceMock implements ReportingService {
  async getKpiDelegue(delegueId: string, _periode?: PeriodeRapport): Promise<KpiDelegue> {
    await delay();
    const rdvDelegue = rendezvous.filter((r) => r.delegueId === delegueId);
    const rdvSemaine = rdvDelegue.filter((r) => {
      const d = new Date(r.dateHeure);
      const debut = new Date();
      debut.setDate(debut.getDate() - 7);
      return d >= debut;
    }).length;

    const realises = rdvDelegue.filter((r) => r.statut === 'REALISE');
    const transformes = qualifications.filter(
      (q) =>
        rdvDelegue.some((r) => r.id === q.rdvId) &&
        q.transformation === QualificationTransformation.TRANSFORME_CLIENT,
    ).length;
    const tauxTransformation = realises.length > 0 ? transformes / realises.length : 0;

    const pipeline = opportunites
      .filter(
        (o) =>
          o.delegueId === delegueId &&
          ![OpportuniteEtape.GAGNEE, OpportuniteEtape.PERDUE].includes(o.etape),
      )
      .reduce((sum, o) => sum + o.montantEstime, 0);

    const relancesAVenir = qualifications.filter(
      (q) =>
        rdvDelegue.some((r) => r.id === q.rdvId) &&
        q.transformation === QualificationTransformation.RELANCE_NECESSAIRE &&
        q.dateRelance &&
        new Date(q.dateRelance) >= new Date(),
    ).length;

    // Activité sur 4 semaines
    const activiteParSemaine = Array.from({ length: 4 }, (_, i) => {
      const fin = new Date();
      fin.setDate(fin.getDate() - i * 7);
      const debut = new Date(fin);
      debut.setDate(fin.getDate() - 7);
      return {
        semaine: debut.toISOString().split('T')[0],
        nbRdv: rdvDelegue.filter((r) => {
          const d = new Date(r.dateHeure);
          return d >= debut && d < fin;
        }).length,
      };
    }).reverse();

    return { delegueId, rdvSemaine, tauxTransformation, montantPipelineEnCours: pipeline, relancesAVenir, activiteParSemaine };
  }

  async getKpiManager(managerId: string, _periode?: PeriodeRapport): Promise<KpiManager> {
    await delay();
    const manager = utilisateurs.find((u) => u.id === managerId);
    const zoneIds = manager?.zoneIds ?? [];
    const delegueIds = utilisateurs
      .filter((u) => u.role === 'DELEGUE' && u.zoneIds?.some((z) => zoneIds.includes(z)))
      .map((u) => u.id);

    const delegues = await Promise.all(
      delegueIds.map(async (id) => {
        const kpi = await this.getKpiDelegue(id);
        const user = utilisateurs.find((u) => u.id === id);
        return {
          delegueId: id,
          nom: user ? `${user.prenom} ${user.nom}` : id,
          nbRdv: rendezvous.filter((r) => r.delegueId === id).length,
          tauxTransformation: kpi.tauxTransformation,
          montantPipeline: kpi.montantPipelineEnCours,
        };
      }),
    );

    const pipelineGlobal = delegues.reduce((sum, d) => sum + d.montantPipeline, 0);
    const tauxGlobal =
      delegues.length > 0
        ? delegues.reduce((sum, d) => sum + d.tauxTransformation, 0) / delegues.length
        : 0;

    return { managerId, delegues, pipelineGlobal, tauxTransformationGlobal: tauxGlobal };
  }

  async getKpiAdmin(_periode?: PeriodeRapport): Promise<KpiAdmin> {
    await delay();
    const doublonsEnAttente = 0;

    const maintenant = new Date();
    const seuil = new Date(maintenant);
    seuil.setDate(seuil.getDate() - 30);
    const professionnelsNonAttribuesSup30j = professionnels.filter(
      (p) =>
        p.statut === StatutProfessionnel.PNA && new Date(p.dateCreation) < seuil,
    ).length;

    const pipelineTotal = opportunites
      .filter((o) => ![OpportuniteEtape.GAGNEE, OpportuniteEtape.PERDUE].includes(o.etape))
      .reduce((sum, o) => sum + o.montantEstime, 0);

    const rdvRealises = rendezvous.filter((r) => r.statut === RdvStatut.REALISE).length;
    const rdvTotal = rendezvous.filter((r) => r.statut !== RdvStatut.ANNULE).length;
    const transformes = qualifications.filter(
      (q) => q.transformation === QualificationTransformation.TRANSFORME_CLIENT,
    ).length;
    const tauxTransformationGlobal = rdvRealises > 0 ? transformes / rdvRealises : 0;

    const conversionsT3VersT2 = historiqueChangementsStatut.filter(
      (h) => h.statutAvant === StatutProfessionnel.T3 && h.statutApres === StatutProfessionnel.T2,
    ).length;
    const conversionsT2VersT3 = historiqueChangementsStatut.filter(
      (h) => h.statutAvant === StatutProfessionnel.T2 && h.statutApres === StatutProfessionnel.T3,
    ).length;

    const delegueIds = utilisateurs.filter((u) => u.role === 'DELEGUE').map((u) => u.id);
    const topDelegues: TopDelegue[] = (
      await Promise.all(
        delegueIds.map(async (id) => {
          const user = utilisateurs.find((u) => u.id === id);
          const kpi = await this.getKpiDelegue(id);
          return {
            delegueId: id,
            nom: user ? `${user.prenom} ${user.nom}` : id,
            tauxTransformation: kpi.tauxTransformation,
            nbRdv: rendezvous.filter((r) => r.delegueId === id).length,
          };
        }),
      )
    )
      .sort((a, b) => b.tauxTransformation - a.tauxTransformation || b.nbRdv - a.nbRdv)
      .slice(0, 5);

    return {
      doublonsEnAttente,
      professionnelsNonAttribuesSup30j,
      pipelineTotal,
      tauxTransformationGlobal,
      rdvRealises,
      rdvTotal,
      conversionsT3VersT2,
      conversionsT2VersT3,
      topDelegues,
    };
  }

  async exporterCsv(filtres?: { zoneId?: string; delegueId?: string; periode?: PeriodeRapport }): Promise<string> {
    await delay(400);
    let data = [...professionnels];
    if (filtres?.zoneId) {
      const centreIds = centres.filter((c) => c.zoneId === filtres.zoneId).map((c) => c.id);
      data = data.filter((p) => centreIds.includes(p.centreId));
    }
    if (filtres?.delegueId) data = data.filter((p) => p.delegueId === filtres.delegueId);

    const header = 'id,nom,prenom,centreId,statut,delegueId,dateCreation';
    const rows = data.map(
      (p) =>
        `${p.id},"${p.nom}","${p.prenom ?? ''}",${p.centreId},${p.statut},${p.delegueId ?? ''},${p.dateCreation}`,
    );
    return [header, ...rows].join('\n');
  }
}
