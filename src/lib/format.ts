export function formatFcfa(montant: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(montant)} FCFA`;
}
