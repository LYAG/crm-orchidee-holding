/** Miroir du PageDto backend — `page` est 0-indexé (convention Spring), à convertir depuis le `current` 1-indexé d'AntD ProTable. */
export interface PageResponse<T> {
  contenu: T[];
  total: number;
  page: number;
  taille: number;
}
