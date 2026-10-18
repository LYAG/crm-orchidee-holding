'use client';

import { useCallback, useEffect, useState } from 'react';
import { messageErreur } from './constants';

interface Resultat<T> {
  cle: string;
  donnees: T | null;
  erreur: string | null;
}

/**
 * Charge des données à chaque changement de `cle` (ex. filtres sérialisés) et sur `recharger()`.
 * L'état n'est modifié que dans les callbacks asynchrones ; `chargement` est dérivé de la clé, et
 * les données précédentes restent affichées pendant un rechargement.
 */
export function useRequete<T>(cle: string, requete: () => Promise<T>, erreurParDefaut = 'Chargement impossible.') {
  const [resultat, setResultat] = useState<Resultat<T> | null>(null);
  const [version, setVersion] = useState(0);
  const cleComplete = `${cle}#${version}`;

  useEffect(() => {
    let annule = false;
    requete()
      .then((donnees) => {
        if (!annule) setResultat({ cle: cleComplete, donnees, erreur: null });
      })
      .catch((err) => {
        if (!annule) setResultat((r) => ({ cle: cleComplete, donnees: r?.donnees ?? null, erreur: messageErreur(err, erreurParDefaut) }));
      });
    return () => {
      annule = true;
    };
    // `requete` est recréée à chaque rendu : seule la clé décide d'un nouveau chargement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleComplete]);

  const recharger = useCallback(() => setVersion((v) => v + 1), []);

  return {
    donnees: resultat?.donnees ?? null,
    erreur: resultat?.cle === cleComplete ? resultat.erreur : null,
    chargement: resultat?.cle !== cleComplete,
    recharger,
  };
}
