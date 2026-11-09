import type { InvitationResultat } from '@/services/api/UtilisateurService';

/** Liens de création de mot de passe simulés (partagés entre les mocks utilisateur et auth). */
interface InvitationMock {
  email: string;
  dateExpiration: string;
  utilise: boolean;
}

export const invitationsMock = new Map<string, InvitationMock>();

const VALIDITE_MS = 72 * 3600 * 1000;

/**
 * Crée un lien (les précédents de l'utilisateur sont annulés). En mode mock, l'envoi d'e-mails
 * n'est pas branché : le lien est rendu à l'admin, comme quand la messagerie est désactivée.
 */
export function creerInvitationMock(email: string): InvitationResultat {
  annulerInvitationsMock(email);
  const jeton = Array.from(crypto.getRandomValues(new Uint8Array(24)), (o) =>
    o.toString(16).padStart(2, '0'),
  ).join('');
  const dateExpiration = new Date(Date.now() + VALIDITE_MS).toISOString();
  invitationsMock.set(jeton, { email, dateExpiration, utilise: false });
  const origine = typeof window === 'undefined' ? '' : window.location.origin;
  return {
    envoyee: false,
    destinataire: email,
    dateExpiration,
    lien: `${origine}/creer-mot-de-passe?jeton=${jeton}`,
    message:
      "L'e-mail n'a pas pu être envoyé : l'envoi d'e-mails n'est pas activé dans Paramètres > Mail. Transmettez le lien vous-même.",
  };
}

export function annulerInvitationsMock(email: string) {
  for (const [jeton, inv] of invitationsMock) {
    if (inv.email === email && !inv.utilise) invitationsMock.delete(jeton);
  }
}
