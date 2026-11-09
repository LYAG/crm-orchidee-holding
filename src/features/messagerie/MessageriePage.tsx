'use client';

import { PageContainer } from '@ant-design/pro-components';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import { BoiteMail, type Dossier } from './BoiteMail';
import type { ModeRedaction } from './NouveauMessageModal';

const DOSSIERS_ADMIN: Dossier[] = ['RECU', 'ENVOYE'];
const DOSSIERS_MANAGER: Dossier[] = ['MES_ENVOIS'];
const MODES_ADMIN: ModeRedaction[] = ['adresses', 'groupe'];
const MODES_MANAGER: ModeRedaction[] = ['groupe'];

/**
 * Messagerie (icône de l'en-tête). Admin : boîte du CRM (reçus, envoyés) et envois groupés aux
 * managers/délégués. Manager : envois groupés à ses délégués et historique de ses envois.
 */
export function MessageriePage() {
  const { user } = useAuth();
  if (!user) return null;
  const admin = user.role === UserRole.ADMIN;

  return (
    <PageContainer title="Messagerie">
      <BoiteMail
        key={user.role}
        dossiers={admin ? DOSSIERS_ADMIN : DOSSIERS_MANAGER}
        modesRedaction={admin ? MODES_ADMIN : MODES_MANAGER}
      />
    </PageContainer>
  );
}
