import type { PageResponse } from '@/types/pagination';
import type {
  CibleDiffusionOption,
  DiffusionRequest,
  DirectionMessage,
  EnvoiEmailRequest,
  JournalMessagerie,
  MessageEmail,
  MessageEmailResume,
  MessagerieConfig,
  MessagerieConfigRequest,
  ReleveResultat,
  ResultatTest,
} from '@/types/messagerie';

/** Messagerie e-mail du CRM (SMTP/IMAP) — réservée à l'administrateur, sauf les envois groupés. */
export interface MessagerieService {
  getConfig(): Promise<MessagerieConfig>;
  enregistrerConfig(config: MessagerieConfigRequest): Promise<MessagerieConfig>;
  /** Sans destinataire : connexion + authentification SMTP ; avec : envoi réel d'un e-mail de test. */
  testerSmtp(destinataire?: string): Promise<ResultatTest>;
  testerImap(): Promise<ResultatTest>;
  envoyer(requete: EnvoiEmailRequest): Promise<MessageEmail>;
  /** Relève immédiate de la boîte de réception (IMAP). */
  relever(): Promise<ReleveResultat>;
  /** `page` 0-indexé. */
  getMessages(
    direction: DirectionMessage,
    page: number,
    taille: number,
    recherche?: string,
  ): Promise<PageResponse<MessageEmailResume>>;
  getMessage(id: string): Promise<MessageEmail>;
  marquerLu(id: string, lu: boolean): Promise<MessageEmail>;
  getNonLus(): Promise<number>;
  getJournal(): Promise<JournalMessagerie[]>;

  // Envois groupés — ouverts à l'admin (managers, délégués) et aux managers (leurs délégués).
  /** Groupes accessibles à l'utilisateur connecté, avec leurs effectifs. */
  getCiblesDiffusion(): Promise<CibleDiffusionOption[]>;
  /** Envoi en copie cachée ; les réponses arrivent à l'adresse de l'expéditeur. */
  envoyerDiffusion(requete: DiffusionRequest): Promise<MessageEmail>;
  /** Envois groupés de l'utilisateur connecté. `page` 0-indexé. */
  getMesEnvois(page: number, taille: number): Promise<PageResponse<MessageEmailResume>>;
  getMonEnvoi(id: string): Promise<MessageEmail>;
}
