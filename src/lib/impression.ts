// En-tête/pied de page standard Orchidée Holding pour tout document imprimé ou exporté en PDF
// depuis l'application (rapports, classements, etc. — voir ConversionsTab.tsx pour un premier
// usage). Un seul gabarit partagé : toute nouvelle fonctionnalité d'impression doit passer par
// `envelopperDocumentImprimable` plutôt que de redéfinir son propre en-tête/pied de page.
//
const LOGO_SRC = '/images/logo-orchidee-holding.png';

const ENTETE_HTML = `
  <div style="display:flex; align-items:center; gap:16px; border-bottom:2px solid #0F6E52; padding-bottom:10px; margin-bottom:20px;">
    <img src="${LOGO_SRC}" alt="Orchidée Holding" style="width:56px; height:56px; border-radius:50%; object-fit:cover;"
      onerror="this.style.display='none'" />
    <div>
      <div style="font-family:Georgia,'Times New Roman',serif; font-size:22px; font-weight:700; color:#2E7D32; line-height:1.1;">
        ORCHIDEE <span style="font-size:16px;">HOLDING</span>
      </div>
      <div style="font-size:11px; color:#4F6F63;">Unité de production et promotion de spécialités parapharmaceutiques</div>
    </div>
  </div>
`;

const PIED_PAGE_HTML = `
  <div style="margin-top:12px; padding-top:10px; border-top:1px solid #E0E0E0; font-size:10px; color:#555; text-align:center;">
    <div>
      SARL au capital de 1.000.000 F CFA / Siège social : <strong>RCI</strong> Abidjan, Cocody-2 plateaux /
      RC : N CI-ABJ-2019-B-18595 / NCC : 1949692G / Régime d'imposition : TEE/
      Cel : 07 08 99 82 20 / tel : 27 35 99 52 81
    </div>
    <div>infos@orchideeholding.com</div>
  </div>
`;

export function escapeHtml(texte: string): string {
  return texte.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

/**
 * Ligne de résumé des filtres actifs, affichée en tête d'un rapport imprimé — pour que le
 * document reste compréhensible une fois détaché de l'écran qui l'a produit (voir chaque table
 * du module Reporting équipe, filtrable). Les filtres à valeur vide/undefined sont omis.
 */
export function construireLigneFiltres(filtres: { label: string; valeur: string | undefined }[]): string {
  const actifs = filtres.filter((f): f is { label: string; valeur: string } => !!f.valeur);
  if (actifs.length === 0) return 'Aucun filtre appliqué.';
  return actifs.map((f) => `${f.label} : ${escapeHtml(f.valeur)}`).join(' · ');
}

/** Tableau HTML générique (style commun) pour les rapports imprimés à partir de données déjà formatées en chaînes. */
export function construireTableauHtml(entetes: string[], lignes: (string | number)[][]): string {
  if (lignes.length === 0) {
    return '<p style="color:#8FB0A8; font-size:13px;">Aucune donnée pour ce filtre.</p>';
  }
  return `<table style="width:100%; border-collapse:collapse; font-size:13px;">
    <thead><tr style="background:#F3F7F5;">
      ${entetes.map((e) => `<th style="text-align:left; padding:6px 8px; border-bottom:1px solid #E7F3F0;">${escapeHtml(e)}</th>`).join('')}
    </tr></thead>
    <tbody>
      ${lignes
        .map(
          (ligne) =>
            `<tr style="border-bottom:1px solid #F0F0F0;">${ligne
              .map((cellule) => `<td style="padding:6px 8px;">${typeof cellule === 'number' ? cellule : escapeHtml(cellule)}</td>`)
              .join('')}</tr>`
        )
        .join('')}
    </tbody>
  </table>`;
}

/**
 * Ouvre un onglet séparé avec le rapport (en-tête/pied de page standard + corps fourni) et lance
 * directement le dialogue d'impression du navigateur — couvre à la fois l'impression physique et
 * le téléchargement PDF ("Enregistrer en PDF" comme imprimante), sans dépendance PDF dédiée.
 */
export function imprimerRapport(titre: string, corpsHtml: string): void {
  const fenetre = window.open('', '_blank');
  if (!fenetre) return;
  fenetre.document.write(envelopperDocumentImprimable(titre, corpsHtml));
  fenetre.document.close();
  fenetre.onload = () => fenetre.print();
}

/**
 * Enveloppe un fragment HTML (le corps du rapport/document) avec l'en-tête et le pied de page
 * standard de l'entreprise, dans un document HTML complet prêt pour window.print() (ouvert dans
 * un onglet/fenêtre séparé — voir ConversionsTab.tsx pour l'usage complet).
 *
 * En-tête/pied de page sur CHAQUE page imprimée, pas seulement la première/dernière : tout le
 * document est un unique <table>, avec l'en-tête en <thead> et le pied de page en <tfoot> —
 * quand le navigateur découpe une table en plusieurs pages à l'impression, thead/tfoot sont
 * répétés automatiquement en haut/bas de CHAQUE page. Volontairement PAS `position: fixed` +
 * marge de @page : cette dernière rouvrirait la zone de marge où Chrome/Edge dessinent leur
 * propre en-tête/pied de page (titre, URL, numéro de page, date), qu'on supprime justement via
 * `@page { margin: 0 }` — la table, elle, vit entièrement dans le padding du body, pas dans la
 * marge de page, donc les deux mécanismes ne se marchent pas dessus.
 */
export function envelopperDocumentImprimable(titre: string, corpsHtml: string): string {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8" />
    <title>${titre}</title>
    <style>
      body {
        font-family: Arial, Helvetica, sans-serif; color: #123832; padding: 32px; margin: 0;
      }
      table.gabarit-impression { width: 100%; border-collapse: collapse; }
      table.gabarit-impression > tbody > tr > td { padding: 0; }
      /* margin: 0 sur @page supprime l'en-tête/pied de page que le navigateur ajoute lui-même
         à l'impression (titre de l'onglet, URL, numéro de page, date/heure) — Chrome/Edge n'ont
         alors plus d'espace de marge où les dessiner. On recrée l'espace perdu via le padding du
         body ci-dessus plutôt que via la marge de page. */
      @page { margin: 0; }
      @media print {
        body { padding: 16px 24px; }
      }
    </style>
    </head><body>
    <table class="gabarit-impression">
      <thead><tr><td>${ENTETE_HTML}</td></tr></thead>
      <tfoot><tr><td>${PIED_PAGE_HTML}</td></tr></tfoot>
      <tbody><tr><td>${corpsHtml}</td></tr></tbody>
    </table>
  </body></html>`;
}
