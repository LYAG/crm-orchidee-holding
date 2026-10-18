import { UserRole } from '@/lib/constants';
import type { CritereNotationDto, EnregistrerNotationDto, NotationService } from '@/services/api/NotationService';
import type { CritereNotation, NotationMois, NoteCritere, Utilisateur } from '@/types';
import { utilisateurs } from './data';
import { ReportingServiceMock } from './ReportingServiceMock';
import { delay, generateId } from './_utils';

// Même logique que NotationService côté backend : critères automatiques recalculés à la lecture,
// note du mois = moyenne pondérée des critères notés.

const criteres: CritereNotation[] = [
  { id: 'crit-rdv', libelle: 'Objectif de visites', description: "RDV réalisés sur le mois rapportés à l'objectif fixé par le manager.", type: 'OBJECTIF_RDV', poids: 1, actif: true, ordre: 1 },
  { id: 'crit-conv', libelle: 'Objectif de conversion T1 → ST', description: "Conversions T1 → ST du mois rapportées à l'objectif fixé par l'administrateur.", type: 'OBJECTIF_CONVERSION', poids: 1, actif: true, ordre: 2 },
  { id: 'crit-terrain', libelle: 'Qualité du travail terrain', description: 'Préparation des visites, qualité des qualifications et du suivi.', type: 'MANUEL', poids: 1, actif: true, ordre: 3 },
  { id: 'crit-savoir-etre', libelle: 'Savoir-être et implication', description: "Ponctualité, communication, esprit d'équipe.", type: 'MANUEL', poids: 1, actif: true, ordre: 4 },
];

interface NotationStockee {
  delegueId: string;
  annee: number;
  mois: number;
  auteurNom: string;
  commentaire: string | null;
  dateModification: string;
  notes: Record<string, number>;
}

const notations = new Map<string, NotationStockee>();
const reporting = new ReportingServiceMock();

const cle = (delegueId: string, annee: number, mois: number) => `${delegueId}#${annee}#${mois}`;

function utilisateurCourant(): Utilisateur | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const brut = sessionStorage.getItem('crm_mock_user');
    return brut ? (JSON.parse(brut) as Utilisateur) : null;
  } catch {
    return null;
  }
}

function deleguesVisibles(user: Utilisateur | null): Utilisateur[] {
  const delegues = utilisateurs.filter((u) => u.role === UserRole.DELEGUE);
  if (!user) return [];
  if (user.role === UserRole.ADMIN) return delegues;
  if (user.role === UserRole.MANAGER) return delegues.filter((d) => d.managerId === user.id);
  return delegues.filter((d) => d.id === user.id);
}

function tauxSur20(realise: number, objectif: number): number | null {
  if (objectif <= 0) return null;
  return Math.min(20, Math.round((realise * 20 * 100) / objectif) / 100);
}

function dernierMoisNotable(annee: number): number {
  const maintenant = new Date();
  if (annee < maintenant.getFullYear()) return 12;
  return annee === maintenant.getFullYear() ? maintenant.getMonth() + 1 : 0;
}

export class NotationServiceMock implements NotationService {
  async getCriteres(): Promise<CritereNotation[]> {
    await delay();
    return [...criteres].sort((a, b) => a.ordre - b.ordre).map((c) => ({ ...c }));
  }

  async createCritere(data: CritereNotationDto): Promise<CritereNotation> {
    await delay();
    if (data.type !== 'MANUEL') throw new Error('Les critères automatiques existent déjà : modifiez-les plutôt.');
    const critere: CritereNotation = {
      id: generateId('crit'),
      libelle: data.libelle.trim(),
      description: data.description ?? null,
      type: 'MANUEL',
      poids: data.poids,
      actif: data.actif ?? true,
      ordre: data.ordre ?? Math.max(0, ...criteres.map((c) => c.ordre)) + 1,
    };
    criteres.push(critere);
    return { ...critere };
  }

  async updateCritere(id: string, data: CritereNotationDto): Promise<CritereNotation> {
    await delay();
    const critere = criteres.find((c) => c.id === id);
    if (!critere) throw new Error('Critère de notation introuvable.');
    if (critere.type !== data.type) throw new Error("Le type d'un critère ne peut pas être modifié.");
    Object.assign(critere, {
      libelle: data.libelle.trim(),
      description: data.description ?? null,
      poids: data.poids,
      actif: data.actif ?? critere.actif,
      ordre: data.ordre ?? critere.ordre,
    });
    return { ...critere };
  }

  async deleteCritere(id: string): Promise<void> {
    await delay();
    const idx = criteres.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Critère de notation introuvable.');
    if (criteres[idx].type !== 'MANUEL') throw new Error('Un critère automatique ne peut pas être supprimé : désactivez-le.');
    if ([...notations.values()].some((n) => id in n.notes)) {
      throw new Error('Ce critère est déjà utilisé dans des notations : désactivez-le plutôt.');
    }
    criteres.splice(idx, 1);
  }

  async getNotations(annee: number, delegueId?: string): Promise<NotationMois[]> {
    await delay();
    return this.calculer(annee, delegueId);
  }

  /** moisUnique : restreint le calcul à un mois (après une saisie), comme côté backend. */
  private async calculer(annee: number, delegueId?: string, moisUnique?: number): Promise<NotationMois[]> {
    const delegues = deleguesVisibles(utilisateurCourant()).filter((d) => !delegueId || d.id === delegueId);
    const actifs = criteres.filter((c) => c.actif).sort((a, b) => a.ordre - b.ordre);
    const resultat: NotationMois[] = [];

    const premier = moisUnique ?? 1;
    const dernier = moisUnique ?? dernierMoisNotable(annee);
    for (let mois = premier; mois <= dernier; mois++) {
      const [rdv, conversions] = await Promise.all([
        reporting.getProgressionRdv(annee, mois),
        reporting.getProgressionConversions(annee, mois),
      ]);
      for (const d of delegues) {
        const stockee = notations.get(cle(d.id, annee, mois));
        const progRdv = rdv.find((r) => r.delegueId === d.id);
        const progConv = conversions.find((c) => c.delegueId === d.id);
        let somme = 0;
        let poids = 0;
        let complete = true;

        const notes: NoteCritere[] = actifs.map((c) => {
          let note: number | null = null;
          let detail: string | null = null;
          if (c.type === 'MANUEL') {
            note = stockee?.notes[c.id] ?? null;
            complete = complete && note !== null;
          } else if (c.type === 'OBJECTIF_RDV') {
            const realises = progRdv?.nbRdvRealises ?? 0;
            const objectif = progRdv?.objectif ?? 0;
            note = tauxSur20(realises, objectif);
            detail = objectif > 0 ? `${realises} / ${objectif} RDV réalisés` : 'Aucun objectif de RDV fixé';
          } else {
            const converties = progConv?.nbConversions ?? 0;
            const objectif = progConv?.objectif ?? 0;
            note = tauxSur20(converties, objectif);
            detail = objectif > 0 ? `${converties} / ${objectif} conversions T1 → ST` : 'Aucun objectif de conversion fixé';
          }
          if (note !== null) {
            somme += note * c.poids;
            poids += c.poids;
          }
          return { critereId: c.id, libelle: c.libelle, type: c.type, poids: c.poids, note, detail };
        });

        resultat.push({
          delegueId: d.id,
          nomDelegue: `${d.prenom} ${d.nom}`,
          annee,
          mois,
          noteFinale: poids === 0 ? null : Math.round((somme / poids) * 100) / 100,
          saisie: Boolean(stockee),
          complete,
          criteres: notes,
          commentaire: stockee?.commentaire ?? null,
          auteurNom: stockee?.auteurNom ?? null,
          dateModification: stockee?.dateModification ?? null,
        });
      }
    }

    return resultat.sort((a, b) => a.nomDelegue.localeCompare(b.nomDelegue) || a.mois - b.mois);
  }

  async enregistrerNotation(data: EnregistrerNotationDto): Promise<NotationMois> {
    const user = utilisateurCourant();
    if (!user || user.role === UserRole.DELEGUE) throw new Error('Notation réservée aux managers et administrateurs.');
    if (!deleguesVisibles(user).some((d) => d.id === data.delegueId)) {
      throw new Error('Vous ne pouvez noter que les délégués de votre équipe.');
    }
    const maintenant = new Date();
    if (data.annee * 12 + data.mois > maintenant.getFullYear() * 12 + maintenant.getMonth() + 1) {
      throw new Error('Un mois à venir ne peut pas encore être noté.');
    }
    const manuels = new Set(criteres.filter((c) => c.actif && c.type === 'MANUEL').map((c) => c.id));
    for (const [critereId, note] of Object.entries(data.notes)) {
      if (!manuels.has(critereId)) throw new Error('Critère inconnu, inactif ou calculé automatiquement.');
      if (note < 0 || note > 20) throw new Error('Une note doit être comprise entre 0 et 20.');
    }
    notations.set(cle(data.delegueId, data.annee, data.mois), {
      delegueId: data.delegueId,
      annee: data.annee,
      mois: data.mois,
      auteurNom: `${user.prenom} ${user.nom}`,
      commentaire: data.commentaire?.trim() || null,
      dateModification: new Date().toISOString(),
      notes: { ...data.notes },
    });
    const [ligne] = await this.calculer(data.annee, data.delegueId, data.mois);
    if (!ligne) throw new Error('Notation introuvable.');
    return ligne;
  }
}
