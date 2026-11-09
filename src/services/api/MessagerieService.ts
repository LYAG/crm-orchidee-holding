import type { PageResponse } from '@/types/pagination';
import type {
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

/** Messagerie e-mail du CRM (SMTP/IMAP) — réservée à l'administrateur. */
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
}
