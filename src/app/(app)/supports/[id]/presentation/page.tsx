import { Suspense } from 'react';
import { PresentationClient } from './PresentationClient';

export default function PresentationPage() {
  return (
    <Suspense>
      <PresentationClient />
    </Suspense>
  );
}
