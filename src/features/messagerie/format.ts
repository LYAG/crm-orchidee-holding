export function messageErreur(err: unknown, defaut: string): string {
  return err instanceof Error && err.message ? err.message : defaut;
}

export function formatDateHeure(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Date courte de liste : heure si aujourd'hui, sinon jour et mois (année si différente). */
export function formatDateListe(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const maintenant = new Date();
  if (d.toDateString() === maintenant.toDateString()) {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    ...(d.getFullYear() !== maintenant.getFullYear() ? { year: 'numeric' } : {}),
  });
}

/** « Nom <adresse> » → « Nom » pour l'affichage en liste. */
export function nomCourt(adresses: string | null | undefined): string {
  if (!adresses) return '—';
  // Envoi groupé : « Mes délégués (3) : a@x, b@y » → « Mes délégués (3) ».
  const groupe = /^([^@,]+\(\d+\)) : /.exec(adresses);
  if (groupe) return groupe[1];
  const premiere = adresses.split(',')[0].trim();
  const m = /^"?([^"<]+?)"?\s*<[^>]+>$/.exec(premiere);
  const nom = m ? m[1].trim() : premiere;
  const autres = adresses.split(',').length - 1;
  return autres > 0 ? `${nom} +${autres}` : nom;
}
