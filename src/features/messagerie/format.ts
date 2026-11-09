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

/** « Nom <adresse> » → { nom, adresse } ; une adresse seule donne un nom vide. */
export function decomposerAdresse(texte: string | null | undefined): {
  nom: string;
  adresse: string;
} {
  if (!texte) return { nom: '', adresse: '' };
  const premiere = texte.split(',')[0].trim();
  const m = /^"?([^"<]*?)"?\s*<([^>]+)>/.exec(premiere);
  return m ? { nom: m[1].trim(), adresse: m[2].trim() } : { nom: '', adresse: premiere };
}

/** Initiales pour l'avatar (« Dr Kouassi » → « DK », « saphir@… » → « S »). */
export function initiales(texte: string): string {
  const mots = texte
    .replace(/<.*>|@.*/g, '')
    .split(/[\s._-]+/)
    .filter(Boolean);
  return (mots.length > 1 ? mots[0][0] + mots[1][0] : (mots[0]?.[0] ?? '?')).toUpperCase();
}

/**
 * Raison d'un échec d'envoi, lisible par tous. Le serveur la rédige déjà en français ; les anciens
 * envois gardent le texte technique brut (exceptions Java, codes SMTP), traduit ici.
 */
export function erreurEnvoiLisible(erreur: string | null | undefined): {
  texte: string;
  technique: string | null;
} {
  const brut = (erreur ?? '').trim();
  if (!brut) return { texte: 'L’e-mail n’a pas pu être envoyé.', technique: null };
  if (!/Exception|^Erreur du serveur de messagerie/.test(brut))
    return { texte: brut, technique: null };
  const code = Number(brut.match(/\b([45]\d\d)\b/)?.[1] ?? 0);
  let texte = 'L’e-mail n’a pas pu être envoyé par le serveur de messagerie. Réessayez plus tard.';
  if (/Invalid Addresses|No Such User|User unknown/i.test(brut) || [550, 551, 553].includes(code)) {
    texte =
      'Un destinataire n’existe pas ou son adresse est mal écrite. Vérifiez l’orthographe des adresses.';
  } else if (code === 552) {
    texte = 'La boîte du destinataire est pleine. Réessayez plus tard.';
  } else if (code === 554) {
    texte = 'Le serveur de messagerie a refusé le message (il peut l’avoir jugé indésirable).';
  } else if (code >= 400 && code < 500) {
    texte = 'Le serveur de messagerie est momentanément indisponible. Réessayez plus tard.';
  }
  return { texte, technique: brut };
}
