'use client';

import { MailOutlined } from '@ant-design/icons';
import { Badge, Button, Tooltip } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EVENEMENT_NON_LUS } from '@/features/messagerie/nonLus';
import { messagerieService } from '@/services';

const RAFRAICHISSEMENT_MS = 60_000;

/** Accès à la Messagerie depuis l'en-tête ; l'admin y voit le nombre de messages reçus non lus. */
export function HeaderMessagerie({ compterNonLus }: { compterNonLus: boolean }) {
  const router = useRouter();
  const [nonLus, setNonLus] = useState(0);

  useEffect(() => {
    if (!compterNonLus) return;
    let actif = true;
    const charger = () =>
      messagerieService
        .getNonLus()
        .then((n) => actif && setNonLus(n))
        .catch(() => {});
    queueMicrotask(charger);
    const minuteur = window.setInterval(charger, RAFRAICHISSEMENT_MS);
    window.addEventListener(EVENEMENT_NON_LUS, charger);
    return () => {
      actif = false;
      window.clearInterval(minuteur);
      window.removeEventListener(EVENEMENT_NON_LUS, charger);
    };
  }, [compterNonLus]);

  return (
    <Tooltip title={nonLus > 0 ? `Messagerie — ${nonLus} non lu(s)` : 'Messagerie'}>
      <Button
        type="text"
        shape="circle"
        aria-label="Messagerie"
        onClick={() => router.push('/messagerie')}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          color: nonLus > 0 ? '#123832' : '#627A74',
        }}
      >
        <Badge
          count={nonLus}
          size="small"
          offset={[-2, 2]}
          styles={{
            indicator: {
              background: 'var(--oh-brand)',
              boxShadow: 'none',
              minWidth: 16,
              height: 16,
              lineHeight: '16px',
              fontSize: 10,
              fontWeight: 700,
            },
          }}
        >
          <MailOutlined style={{ fontSize: 18 }} />
        </Badge>
      </Button>
    </Tooltip>
  );
}
