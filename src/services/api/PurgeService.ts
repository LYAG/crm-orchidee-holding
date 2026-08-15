export interface PurgeableTable {
  nom: string;
  nombreLignes: number;
}

export interface PurgeTableResult {
  table: string;
  lignesSupprimees: number;
}

export interface PurgeResult {
  resultats: PurgeTableResult[];
}

export interface PurgeService {
  /** Liste des tables purgeables avec leur nombre de lignes actuel. */
  getTablesPurgeables(): Promise<PurgeableTable[]>;
  /** `confirmation` doit valoir exactement "PURGER". */
  purger(tables: string[], confirmation: string): Promise<PurgeResult>;
}
