'use client';

import { Button, Result } from 'antd';
import Link from 'next/link';

/** Écran affiché sur la page d'un module désactivé (voir src/config/fonctionnalites.ts). */
export function ModuleDesactive({ nom }: { nom: string }) {
  return (
    <Result
      status="info"
      title={`${nom} : module désactivé`}
      subTitle="Ce module n’est pas disponible pour le moment."
      extra={
        <Link href="/">
          <Button type="primary">Retour au tableau de bord</Button>
        </Link>
      }
    />
  );
}
