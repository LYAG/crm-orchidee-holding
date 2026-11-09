/**
 * Événement navigateur émis quand le nombre de messages non lus a pu changer (lecture, relève),
 * pour que l'icône Messagerie de l'en-tête se mette à jour sans attendre son rafraîchissement.
 */
export const EVENEMENT_NON_LUS = 'messagerie:non-lus';

export function signalerNonLusModifies(): void {
  window.dispatchEvent(new Event(EVENEMENT_NON_LUS));
}
