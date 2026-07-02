'use client';

import { Spin } from 'antd';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supportService } from '@/services';
import { PresentationMode } from '@/features/supports/PresentationMode';
import type { ParametresApp, SupportCommercial } from '@/types';

export function PresentationClient() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const rdvId = searchParams.get('rdvId') ?? undefined;

  const [support, setSupport] = useState<SupportCommercial | null>(null);
  const [parametres, setParametres] = useState<ParametresApp | null>(null);

  useEffect(() => {
    if (!params.id) return;
    Promise.all([supportService.getById(params.id), supportService.getParametres()])
      .then(([s, p]) => {
        setSupport(s);
        setParametres(p);
      })
      .catch(() => {});
  }, [params.id]);

  if (!support || !parametres) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111',
          zIndex: 9999,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <PresentationMode
      support={support}
      rdvId={rdvId}
      tempsMoyenParSlide={parametres.tempsMoyenParSlide}
    />
  );
}
