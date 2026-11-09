import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CreerMotDePassePage } from '@/features/auth/CreerMotDePassePage';

export const metadata: Metadata = {
  title: 'Créer mon mot de passe — Saphir OH',
  // Le jeton est dans l'adresse : ne jamais le transmettre à un autre site.
  referrer: 'no-referrer',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense>
      <CreerMotDePassePage />
    </Suspense>
  );
}
