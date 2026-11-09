/** Messagerie e-mail du CRM (miroir des DTO du package backend `messagerie`). */

export type SecuriteConnexion = 'SSL' | 'STARTTLS' | 'AUCUNE';
export type DirectionMessage = 'ENVOYE' | 'RECU';
export type StatutMessage = 'ENVOYE' | 'ECHEC' | 'RECU';
export type TypeJournalMessagerie = 'CONFIG' | 'TEST_SMTP' | 'TEST_IMAP' | 'ENVOI' | 'RELEVE';

/** Le mot de passe n'est jamais renvoyé : seulement `motDePasseDefini`. */
export interface MessagerieConfig {
  smtpHote: string | null;
  smtpPort: number;
  smtpSecurite: SecuriteConnexion;
  imapHote: string | null;
  imapPort: number;
  imapSecurite: SecuriteConnexion;
  imapDossier: string;
  identifiant: string | null;
  adresseExpediteur: string | null;
  nomExpediteur: string | null;
  envoiActif: boolean;
  receptionActive: boolean;
  motDePasseDefini: boolean;
  /** Faux tant que le serveur n'a pas de clé MESSAGERIE_CLE_CHIFFREMENT : aucun mot de passe enregistrable. */
  chiffrementDisponible: boolean;
  dateDerniereSynchro: string | null;
  dateModification: string | null;
}

/** `motDePasse` vide ou absent : le mot de passe enregistré est conservé. */
export interface MessagerieConfigRequest {
  smtpHote: string;
  smtpPort: number;
  smtpSecurite: SecuriteConnexion;
  imapHote: string;
  imapPort: number;
  imapSecurite: SecuriteConnexion;
  imapDossier?: string;
  identifiant: string;
  motDePasse?: string;
  effacerMotDePasse?: boolean;
  adresseExpediteur: string;
  nomExpediteur?: string;
  envoiActif: boolean;
  receptionActive: boolean;
}

export interface ResultatTest {
  succes: boolean;
  message: string;
  dureeMs: number;
}

export interface ReleveResultat {
  nouveaux: number;
  nonLus: number;
}

export interface EnvoiEmailRequest {
  destinataires: string[];
  copie?: string[];
  sujet: string;
  corps: string;
}

export interface MessageEmailResume {
  id: string;
  direction: DirectionMessage;
  statut: StatutMessage;
  expediteur: string | null;
  destinataires: string | null;
  sujet: string | null;
  apercu: string | null;
  piecesJointes: boolean;
  dateMessage: string | null;
  lu: boolean;
  erreur: string | null;
}

export interface MessageEmail {
  id: string;
  direction: DirectionMessage;
  statut: StatutMessage;
  expediteur: string | null;
  destinataires: string | null;
  copie: string | null;
  sujet: string | null;
  corpsTexte: string | null;
  /** HTML brut, non nettoyé : à n'afficher que dans une iframe `sandbox`. */
  corpsHtml: string | null;
  piecesJointes: string[];
  dateMessage: string | null;
  lu: boolean;
  dateLecture: string | null;
  erreur: string | null;
}

export interface JournalMessagerie {
  id: string;
  dateEvenement: string;
  type: TypeJournalMessagerie;
  succes: boolean;
  message: string | null;
}

/** Réglages SSL/TLS recommandés par l'hébergeur (le mot de passe est celui du compte de messagerie). */
export const MESSAGERIE_VALEURS_RECOMMANDEES: Omit<
  MessagerieConfigRequest,
  'motDePasse' | 'envoiActif' | 'receptionActive'
> = {
  smtpHote: 'mail.orchideeholding.com',
  smtpPort: 465,
  smtpSecurite: 'SSL',
  imapHote: 'mail.orchideeholding.com',
  imapPort: 993,
  imapSecurite: 'SSL',
  imapDossier: 'INBOX',
  identifiant: 'saphir@orchideeholding.com',
  adresseExpediteur: 'saphir@orchideeholding.com',
  nomExpediteur: 'Saphir OH',
};
