'use client';

import { ArrowLeftOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Result, Spin } from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { formationService } from '@/services';
import type { ResultatTentative } from '@/types/formation';
import { messageErreur } from './constants';
import { ResultatTentativeView } from './ResultatTentativeView';

/** Résultat d'une tentative pour le délégué, selon les règles de publication de l'évaluation. */
export function ResultatApprenantPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [resultat, setResultat] = useState<ResultatTentative | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    formationService
      .getResultat(id)
      .then(setResultat)
      .catch((err) => setErreur(messageErreur(err, 'Résultat indisponible.')));
  }, [id]);

  if (erreur) return <Result status="404" title="Résultat indisponible" subTitle={erreur} extra={<Button onClick={() => router.push('/formation/mon-espace')}>Mon espace</Button>} />;
  if (!resultat) return <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spin size="large" /></div>;

  return (
    <PageContainer
      title={`${resultat.titre} — tentative ${resultat.numero}`}
      extra={[
        <Button key="r" icon={<ArrowLeftOutlined />} onClick={() => router.push(`/formation/mon-espace/${resultat.affectationId}`)}>
          Retour à la formation
        </Button>,
      ]}
    >
      <div style={{ maxWidth: 860 }}>
        <ResultatTentativeView resultat={resultat} />
      </div>
    </PageContainer>
  );
}
