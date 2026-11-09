import type { MessagerieService } from '@/services/api/MessagerieService';
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
import { apiFetch, qs } from './httpClient';

export class MessagerieServiceReal implements MessagerieService {
  async getConfig(): Promise<MessagerieConfig> {
    return apiFetch<MessagerieConfig>('/messagerie/config');
  }

  async enregistrerConfig(config: MessagerieConfigRequest): Promise<MessagerieConfig> {
    return apiFetch<MessagerieConfig>('/messagerie/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async testerSmtp(destinataire?: string): Promise<ResultatTest> {
    return apiFetch<ResultatTest>('/messagerie/config/test-smtp', {
      method: 'POST',
      body: JSON.stringify({ destinataire: destinataire || null }),
    });
  }

  async testerImap(): Promise<ResultatTest> {
    return apiFetch<ResultatTest>('/messagerie/config/test-imap', { method: 'POST' });
  }

  async envoyer(requete: EnvoiEmailRequest): Promise<MessageEmail> {
    return apiFetch<MessageEmail>('/messagerie/envoyer', {
      method: 'POST',
      body: JSON.stringify(requete),
    });
  }

  async relever(): Promise<ReleveResultat> {
    return apiFetch<ReleveResultat>('/messagerie/relever', { method: 'POST' });
  }

  async getMessages(
    direction: DirectionMessage,
    page: number,
    taille: number,
    recherche?: string,
  ): Promise<PageResponse<MessageEmailResume>> {
    return apiFetch<PageResponse<MessageEmailResume>>(
      `/messagerie/messages${qs({ direction, page, size: taille, recherche })}`,
    );
  }

  async getMessage(id: string): Promise<MessageEmail> {
    return apiFetch<MessageEmail>(`/messagerie/messages/${id}`);
  }

  async marquerLu(id: string, lu: boolean): Promise<MessageEmail> {
    return apiFetch<MessageEmail>(`/messagerie/messages/${id}/lu${qs({ lu: String(lu) })}`, {
      method: 'PUT',
    });
  }

  async getNonLus(): Promise<number> {
    return (await apiFetch<{ nonLus: number }>('/messagerie/messages/non-lus')).nonLus;
  }

  async getJournal(): Promise<JournalMessagerie[]> {
    return apiFetch<JournalMessagerie[]>('/messagerie/journal');
  }

  async getCiblesDiffusion(): Promise<CibleDiffusionOption[]> {
    return apiFetch<CibleDiffusionOption[]>('/messagerie/diffusion/cibles');
  }

  async envoyerDiffusion(requete: DiffusionRequest): Promise<MessageEmail> {
    return apiFetch<MessageEmail>('/messagerie/diffusion', {
      method: 'POST',
      body: JSON.stringify(requete),
    });
  }

  async getMesEnvois(page: number, taille: number): Promise<PageResponse<MessageEmailResume>> {
    return apiFetch<PageResponse<MessageEmailResume>>(
      `/messagerie/diffusion/envois${qs({ page, size: taille })}`,
    );
  }

  async getMonEnvoi(id: string): Promise<MessageEmail> {
    return apiFetch<MessageEmail>(`/messagerie/diffusion/envois/${id}`);
  }
}
