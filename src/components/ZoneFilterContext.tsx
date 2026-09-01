'use client';

import { createContext, useContext, useState } from 'react';

/**
 * Zone sélectionnée dans le header (MANAGER/ADMIN) — filtre global que les pages
 * de données appliquent à leurs chargements. `undefined` = toutes les zones.
 */
export interface ZoneFilterContextValue {
  zoneFiltreId: string | undefined;
  setZoneFiltreId: (zoneId: string | undefined) => void;
}

const ZoneFilterContext = createContext<ZoneFilterContextValue>({
  zoneFiltreId: undefined,
  setZoneFiltreId: () => {},
});

export function ZoneFilterProvider({ children }: { children: React.ReactNode }) {
  const [zoneFiltreId, setZoneFiltreId] = useState<string | undefined>();
  return (
    <ZoneFilterContext.Provider value={{ zoneFiltreId, setZoneFiltreId }}>{children}</ZoneFilterContext.Provider>
  );
}

export function useZoneFilter() {
  return useContext(ZoneFilterContext);
}
