// En-tête/pied de page standard Orchidée Holding pour tout document imprimé ou exporté en PDF
// depuis l'application (rapports, classements, etc. — voir ConversionsTab.tsx pour un premier
// usage). Un seul gabarit partagé : toute nouvelle fonctionnalité d'impression doit passer par
// `envelopperDocumentImprimable` plutôt que de redéfinir son propre en-tête/pied de page.
//
// Le logo doit être déposé dans public/logo-orchidee-holding.png (aucun logo n'existe encore
// dans le projet — ni ici, ni côté app mobile). Tant qu'il est absent, l'en-tête s'affiche
// sans l'emblème plutôt que de casser l'impression (voir <img onerror>).

const LOGO_SRC = '/logo-orchidee-holding.png';

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
  <div style="margin-top:32px; padding-top:10px; border-top:1px solid #E0E0E0; font-size:10px; color:#555; text-align:center;">
    <div>
      SARL au capital de 1.000.000 F CFA / Siège social : <strong>RCI</strong> Abidjan, Cocody-2 plateaux /
      RC : N CI-ABJ-2019-B-18595 / NCC : 1949692G / Régime d'imposition : TEE/
      Cel : 07 08 99 82 20 / tel : 27 35 99 52 81
    </div>
    <div>infos@orchideeholding.com</div>
  </div>
`;

/**
 * Enveloppe un fragment HTML (le corps du rapport/document) avec l'en-tête et le pied de page
 * standard de l'entreprise, dans un document HTML complet prêt pour window.print() (ouvert dans
 * un onglet/fenêtre séparé — voir ConversionsTab.tsx pour l'usage complet).
 */
export function envelopperDocumentImprimable(titre: string, corpsHtml: string): string {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8" />
    <title>${titre}</title>
    <style>
      body { font-family: Arial, Helvetica, sans-serif; color: #123832; padding: 32px; }
      @media print {
        body { padding: 16px; }
      }
    </style>
    </head><body>
    ${ENTETE_HTML}
    ${corpsHtml}
    ${PIED_PAGE_HTML}
  </body></html>`;
}
