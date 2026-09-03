import type { QualificationService } from '@/services/api/QualificationService';
import type { FicheMensuelleProfessionnel, QualificationRDV, VisiteMensuelle } from '@/types';
import { deepClone, delay, generateId, notFound } from './_utils';
import { qualifications as mockQualifications, rendezvous as mockRdv } from './data';
import { centres as mockCentres, professionnels as mockProfessionnels } from './professionnelsData';

const qualifications: QualificationRDV[] = deepClone(mockQualifications);

// Import mutable rdv list to update qualifie flag
import { RdvServiceMock } from './RdvServiceMock';
const rdvService = new RdvServiceMock();

export class QualificationServiceMock implements QualificationService {
  async getByRdv(rdvId: string): Promise<QualificationRDV | null> {
    await delay();
    return qualifications.find((q) => q.rdvId === rdvId) ?? null;
  }

  async create(data: Omit<QualificationRDV, 'id'>): Promise<QualificationRDV> {
    await delay();
    const existing = qualifications.find((q) => q.rdvId === data.rdvId);
    if (existing) throw new Error('Ce RDV est déjà qualifié.');
    const qualification: QualificationRDV = { ...data, id: generateId('qual') };
    qualifications.push(qualification);
    // Marquer le RDV comme qualifié
    await rdvService.update(data.rdvId, { qualifie: true });
    return qualification;
  }

  async update(
    id: string,
    data: Partial<QualificationRDV>,
    managerId: string,
  ): Promise<QualificationRDV> {
    await delay();
    const idx = qualifications.findIndex((q) => q.id === id);
    if (idx === -1) notFound('QualificationRDV', id);
    const timestamp = new Date().toISOString();
    qualifications[idx] = {
      ...qualifications[idx],
      ...data,
      modifiePar: managerId,
      dateModification: timestamp,
      logModification: `[${timestamp}] Modifié par manager ${managerId}.`,
    };
    return qualifications[idx];
  }

  async getFicheMensuelle(delegueId: string, annee: number, mois: number): Promise<FicheMensuelleProfessionnel[]> {
    await delay();
    const rdvDuDelegueEtMois = mockRdv.filter((r) => {
      if (r.delegueId !== delegueId) return false;
      const d = new Date(r.dateHeure);
      return d.getFullYear() === annee && d.getMonth() + 1 === mois;
    });
    const rdvParId = new Map(rdvDuDelegueEtMois.map((r) => [r.id, r]));

    const visitesParProfessionnel = new Map<string, QualificationRDV[]>();
    qualifications
      .filter((q) => q.numeroVisiteMois != null && rdvParId.has(q.rdvId))
      .forEach((q) => {
        const professionnelId = rdvParId.get(q.rdvId)!.professionnelId;
        if (!professionnelId) return;
        const liste = visitesParProfessionnel.get(professionnelId) ?? [];
        liste.push(q);
        visitesParProfessionnel.set(professionnelId, liste);
      });

    return [...visitesParProfessionnel.entries()]
      .map(([professionnelId, qs]) => {
        const professionnel = mockProfessionnels.find((p) => p.id === professionnelId);
        const centre = professionnel ? mockCentres.find((c) => c.id === professionnel.centreId) : undefined;
        const visites: VisiteMensuelle[] = qs
          .sort((a, b) => (a.numeroVisiteMois ?? 0) - (b.numeroVisiteMois ?? 0))
          .map((q) => ({
            numeroVisite: q.numeroVisiteMois!,
            dateVisite: q.dateQualification,
            produitConnuEtPrescrit: q.produitConnuEtPrescrit,
            nombreDeCas: q.nombreDeCas,
            engagementChiffre: q.engagementChiffre,
            engagementRespecte: q.engagementRespecte,
            retourEngagement: q.retourEngagement,
            tousCasBeneficient: q.tousCasBeneficient,
            remerciement: q.remerciement,
            pourquoiNonRespecte: q.pourquoiNonRespecte,
          }));
        return {
          professionnelId,
          professionnelNom: professionnel ? `${professionnel.titre ? professionnel.titre + ' ' : ''}${professionnel.nom} ${professionnel.prenom ?? ''}`.trim() : '?',
          centreId: professionnel?.centreId ?? null,
          centreNom: centre?.nom ?? '?',
          visites,
        };
      })
      .sort((a, b) => a.professionnelNom.localeCompare(b.professionnelNom));
  }
}
