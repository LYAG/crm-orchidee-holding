import type { MessagerieService } from '@/services/api/MessagerieService';
import type { PageResponse } from '@/types/pagination';
import {
  MESSAGERIE_VALEURS_RECOMMANDEES,
  type CibleDiffusion,
  type CibleDiffusionOption,
  type DiffusionRequest,
  type DirectionMessage,
  type EnvoiEmailRequest,
  type JournalMessagerie,
  type MessageEmail,
  type MessageEmailResume,
  type MessagerieConfig,
  type MessagerieConfigRequest,
  type ReleveResultat,
  type ResultatTest,
  type TypeJournalMessagerie,
} from '@/types/messagerie';
import { UserRole } from '@/lib/constants';
import type { Utilisateur } from '@/types';
import { utilisateurs } from './data';
import { delay, generateId, notFound, paginer } from './_utils';

/** Même clé de session que AuthServiceMock. */
const SESSION_KEY = 'crm_mock_user';

const LIBELLES_CIBLES: Record<CibleDiffusion, string> = {
  MANAGERS: 'Tous les managers',
  DELEGUES: 'Tous les délégués',
  MANAGERS_ET_DELEGUES: 'Tous les managers et délégués',
  MES_DELEGUES: 'Mes délégués',
};

/**
 * Simulation locale : aucun serveur n'est contacté. Les tests réussissent dès qu'un mot de passe
 * est enregistré et que les hôtes sont renseignés ; le mot de passe « faux » simule un refus.
 */
const ilYa = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

function message(
  m: Partial<MessageEmail> & Pick<MessageEmail, 'direction' | 'sujet'>,
): MessageEmail {
  return {
    id: generateId('mail'),
    statut: m.direction === 'RECU' ? 'RECU' : 'ENVOYE',
    expediteur: 'Saphir OH <saphir@orchideeholding.com>',
    destinataires: 'saphir@orchideeholding.com',
    copie: null,
    corpsTexte: '',
    corpsHtml: null,
    piecesJointes: [],
    dateMessage: ilYa(60),
    lu: m.direction === 'ENVOYE',
    dateLecture: null,
    erreur: null,
    ...m,
  };
}

export class MessagerieServiceMock implements MessagerieService {
  private motDePasse: string | null = null;
  private config: MessagerieConfig = {
    ...MESSAGERIE_VALEURS_RECOMMANDEES,
    imapDossier: 'INBOX',
    nomExpediteur: 'Saphir OH',
    envoiActif: false,
    receptionActive: false,
    notificationsActives: true,
    motDePasseDefini: false,
    chiffrementDisponible: true,
    dateDerniereSynchro: null,
    dateModification: null,
  };
  private messages: MessageEmail[] = [
    message({
      direction: 'RECU',
      sujet: 'Demande de documentation — Pharmacie des Deux Plateaux',
      expediteur: 'Dr Kouassi <pharmacie.2plateaux@example.ci>',
      corpsTexte:
        'Bonjour,\n\nPourriez-vous nous transmettre la fiche produit et les conditions de commande ?\n\nCordialement,\nDr Kouassi',
      dateMessage: ilYa(35),
    }),
    message({
      direction: 'RECU',
      sujet: 'Confirmation du rendez-vous de jeudi',
      expediteur: 'Clinique Sainte-Marie <contact@cliniquesm.example.ci>',
      corpsTexte:
        'Bonjour,\n\nNous confirmons le rendez-vous de jeudi à 10 h avec le Dr Yao.\n\nBien à vous.',
      corpsHtml:
        '<p>Bonjour,</p><p>Nous confirmons le rendez-vous de <strong>jeudi à 10 h</strong> avec le Dr Yao.</p><p>Bien à vous.</p>',
      piecesJointes: ['plan-acces.pdf'],
      dateMessage: ilYa(60 * 26),
      lu: true,
    }),
    message({
      direction: 'ENVOYE',
      sujet: 'Test de la messagerie Saphir OH',
      destinataires: 'admin@orchideeholding.com',
      corpsTexte: 'Bonjour,\n\nCet e-mail confirme que le CRM Saphir OH peut envoyer des messages.',
      dateMessage: ilYa(60 * 48),
    }),
  ];
  private journal: JournalMessagerie[] = [];

  private tracer(type: TypeJournalMessagerie, succes: boolean, texte: string) {
    this.journal.unshift({
      id: generateId('jrn'),
      dateEvenement: new Date().toISOString(),
      type,
      succes,
      message: texte,
    });
  }

  private echec(): string | null {
    if (!this.motDePasse)
      return 'Aucun mot de passe de messagerie n’est enregistré : saisissez-le dans Paramètres > Mail.';
    if (this.motDePasse === 'faux')
      return 'Authentification refusée par le serveur : vérifiez l’identifiant et le mot de passe.';
    return null;
  }

  async getConfig(): Promise<MessagerieConfig> {
    await delay();
    return { ...this.config };
  }

  async enregistrerConfig(c: MessagerieConfigRequest): Promise<MessagerieConfig> {
    await delay();
    if (c.effacerMotDePasse) this.motDePasse = null;
    else if (c.motDePasse) this.motDePasse = c.motDePasse;
    if ((c.envoiActif || c.receptionActive) && !this.motDePasse) {
      throw new Error(
        'Saisissez le mot de passe du compte avant d’activer l’envoi ou la réception.',
      );
    }
    this.config = {
      ...this.config,
      smtpHote: c.smtpHote,
      smtpPort: c.smtpPort,
      smtpSecurite: c.smtpSecurite,
      imapHote: c.imapHote,
      imapPort: c.imapPort,
      imapSecurite: c.imapSecurite,
      imapDossier: c.imapDossier || 'INBOX',
      identifiant: c.identifiant,
      adresseExpediteur: c.adresseExpediteur,
      nomExpediteur: c.nomExpediteur || null,
      envoiActif: c.envoiActif,
      receptionActive: c.receptionActive,
      notificationsActives: c.notificationsActives ?? this.config.notificationsActives,
      motDePasseDefini: this.motDePasse !== null,
      dateModification: new Date().toISOString(),
    };
    this.tracer(
      'CONFIG',
      true,
      `Configuration enregistrée (envoi ${c.envoiActif ? 'actif' : 'inactif'}, réception ${c.receptionActive ? 'active' : 'inactive'}).`,
    );
    return { ...this.config };
  }

  async testerSmtp(destinataire?: string): Promise<ResultatTest> {
    await delay(700);
    const erreur = this.echec();
    if (erreur) {
      if (this.motDePasse) this.tracer('TEST_SMTP', false, erreur);
      return { succes: false, message: erreur, dureeMs: 700 };
    }
    if (destinataire) {
      this.messages.unshift(
        message({
          direction: 'ENVOYE',
          sujet: 'Test de la messagerie Saphir OH',
          destinataires: destinataire,
          corpsTexte:
            'Bonjour,\n\nCet e-mail confirme que le CRM Saphir OH peut envoyer des messages.',
          dateMessage: new Date().toISOString(),
        }),
      );
    }
    const ok = destinataire
      ? `E-mail de test envoyé à ${destinataire}.`
      : `Connexion SMTP réussie à ${this.config.smtpHote}:${this.config.smtpPort}.`;
    this.tracer('TEST_SMTP', true, ok);
    return { succes: true, message: ok, dureeMs: 700 };
  }

  async testerImap(): Promise<ResultatTest> {
    await delay(700);
    const erreur = this.echec();
    if (erreur) {
      if (this.motDePasse) this.tracer('TEST_IMAP', false, erreur);
      return { succes: false, message: erreur, dureeMs: 700 };
    }
    const recus = this.messages.filter((m) => m.direction === 'RECU');
    const ok = `Connexion IMAP réussie : ${recus.length} message(s) dans « ${this.config.imapDossier} », dont ${recus.filter((m) => !m.lu).length} non lu(s).`;
    this.tracer('TEST_IMAP', true, ok);
    return { succes: true, message: ok, dureeMs: 700 };
  }

  async envoyer(r: EnvoiEmailRequest): Promise<MessageEmail> {
    await delay();
    if (!this.config.envoiActif)
      throw new Error('L’envoi d’e-mails est désactivé : activez-le dans Paramètres > Mail.');
    const m = message({
      direction: 'ENVOYE',
      sujet: r.sujet,
      destinataires: r.destinataires.join(', '),
      copie: r.copie?.length ? r.copie.join(', ') : null,
      corpsTexte: r.corps,
      corpsHtml: r.corpsHtml ?? null,
      dateMessage: new Date().toISOString(),
    });
    this.messages.unshift(m);
    this.tracer('ENVOI', true, `E-mail « ${r.sujet} » envoyé à ${m.destinataires}.`);
    return { ...m };
  }

  async relever(): Promise<ReleveResultat> {
    await delay(600);
    if (!this.config.receptionActive)
      throw new Error('La réception est désactivée : activez-la dans Paramètres > Mail.');
    const erreur = this.echec();
    if (erreur) {
      this.tracer('RELEVE', false, `Relève impossible : ${erreur}`);
      throw new Error(`Relève impossible : ${erreur}`);
    }
    this.messages.unshift(
      message({
        direction: 'RECU',
        sujet: 'Nouvelle commande — Officine du Plateau',
        expediteur: 'Officine du Plateau <officine.plateau@example.ci>',
        corpsTexte:
          'Bonjour,\n\nVeuillez trouver ci-joint notre bon de commande du mois.\n\nMerci.',
        piecesJointes: ['bon-de-commande.pdf'],
        dateMessage: new Date().toISOString(),
      }),
    );
    this.config.dateDerniereSynchro = new Date().toISOString();
    this.tracer(
      'RELEVE',
      true,
      `1 nouveau(x) message(s) relevé(s) dans « ${this.config.imapDossier} ».`,
    );
    return {
      nouveaux: 1,
      nonLus: this.messages.filter((m) => m.direction === 'RECU' && !m.lu).length,
    };
  }

  async getMessages(
    direction: DirectionMessage,
    page: number,
    taille: number,
    recherche?: string,
  ): Promise<PageResponse<MessageEmailResume>> {
    await delay();
    const motif = recherche?.trim().toLowerCase();
    const liste = this.messages
      .filter((m) => m.direction === direction)
      .filter(
        (m) =>
          !motif ||
          [m.sujet, m.expediteur, m.destinataires].some((v) => v?.toLowerCase().includes(motif)),
      )
      .map<MessageEmailResume>((m) => ({
        id: m.id,
        direction: m.direction,
        statut: m.statut,
        expediteur: m.expediteur,
        destinataires: m.destinataires,
        sujet: m.sujet,
        apercu: m.corpsTexte ? m.corpsTexte.replace(/\s+/g, ' ').trim().slice(0, 160) : null,
        piecesJointes: m.piecesJointes.length > 0,
        dateMessage: m.dateMessage,
        lu: m.lu,
        erreur: m.erreur,
      }));
    return paginer(liste, page, taille);
  }

  async getMessage(id: string): Promise<MessageEmail> {
    await delay();
    const m = this.messages.find((x) => x.id === id) ?? notFound('Message', id);
    return { ...m };
  }

  async marquerLu(id: string, lu: boolean): Promise<MessageEmail> {
    await delay(150);
    const m = this.messages.find((x) => x.id === id) ?? notFound('Message', id);
    m.lu = lu;
    m.dateLecture = lu ? new Date().toISOString() : null;
    return { ...m };
  }

  async getNonLus(): Promise<number> {
    await delay(100);
    return this.messages.filter((m) => m.direction === 'RECU' && !m.lu).length;
  }

  async getJournal(): Promise<JournalMessagerie[]> {
    await delay();
    return this.journal.slice(0, 100);
  }

  // ─── Envois groupés ────────────────────────────────────────────────────────
  // Démo locale : l'activation de l'envoi n'est pas exigée ici, la configuration du mock étant
  // perdue à chaque rechargement (changer de compte pour tester un manager la réinitialise).

  /** Auteur de chaque envoi groupé, pour l'historique personnel. */
  private auteurs = new Map<string, string>();

  private utilisateurConnecte(): Utilisateur {
    const brut = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SESSION_KEY) : null;
    const u = brut ? (JSON.parse(brut) as Utilisateur) : null;
    if (!u) throw new Error('Session expirée.');
    return u;
  }

  private destinataires(cible: CibleDiffusion, moi: Utilisateur): Utilisateur[] {
    const managers = utilisateurs.filter((u) => u.role === UserRole.MANAGER);
    const delegues = utilisateurs.filter((u) => u.role === UserRole.DELEGUE);
    const liste =
      cible === 'MANAGERS'
        ? managers
        : cible === 'DELEGUES'
          ? delegues
          : cible === 'MANAGERS_ET_DELEGUES'
            ? [...managers, ...delegues]
            : delegues.filter((d) => d.managerId === moi.id);
    return liste.filter((u) => u.id !== moi.id).sort((a, b) => a.nom.localeCompare(b.nom));
  }

  async getCiblesDiffusion(): Promise<CibleDiffusionOption[]> {
    await delay();
    const moi = this.utilisateurConnecte();
    const cibles: CibleDiffusion[] =
      moi.role === UserRole.ADMIN
        ? ['MANAGERS', 'DELEGUES', 'MANAGERS_ET_DELEGUES']
        : moi.role === UserRole.MANAGER
          ? ['MES_DELEGUES']
          : [];
    return cibles.map((cible) => {
      const d = this.destinataires(cible, moi);
      return {
        cible,
        libelle: LIBELLES_CIBLES[cible],
        nombre: d.length,
        apercuNoms: d.slice(0, 8).map((u) => `${u.prenom} ${u.nom}`),
        repondreA: moi.email,
      };
    });
  }

  async envoyerDiffusion(r: DiffusionRequest): Promise<MessageEmail> {
    await delay(800);
    const moi = this.utilisateurConnecte();
    const d = this.destinataires(r.cible, moi);
    if (d.length === 0)
      throw new Error(`Aucun destinataire dans le groupe « ${LIBELLES_CIBLES[r.cible]} ».`);
    const m = message({
      direction: 'ENVOYE',
      sujet: r.sujet,
      expediteur: `${moi.prenom} ${moi.nom} <${moi.email}> via ${this.config.adresseExpediteur}`,
      destinataires: `${LIBELLES_CIBLES[r.cible]} (${d.length}) : ${d.map((u) => u.email).join(', ')}`,
      corpsTexte: r.corps,
      corpsHtml: r.corpsHtml ?? null,
      dateMessage: new Date().toISOString(),
    });
    this.messages.unshift(m);
    this.auteurs.set(m.id, moi.id);
    this.tracer(
      'ENVOI',
      true,
      `Envoi groupé « ${r.sujet} » de ${moi.prenom} ${moi.nom} (${d.length} destinataire(s)).`,
    );
    return { ...m };
  }

  async getMesEnvois(page: number, taille: number): Promise<PageResponse<MessageEmailResume>> {
    const moi = this.utilisateurConnecte();
    const tous = await this.getMessages('ENVOYE', 0, 10_000);
    return paginer(
      tous.contenu.filter((m) => this.auteurs.get(m.id) === moi.id),
      page,
      taille,
    );
  }

  async getMonEnvoi(id: string): Promise<MessageEmail> {
    const moi = this.utilisateurConnecte();
    if (this.auteurs.get(id) !== moi.id) throw new Error('Ce message ne vous appartient pas.');
    return this.getMessage(id);
  }
}
