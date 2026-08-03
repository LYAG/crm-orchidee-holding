'use client';

import { GiftOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Empty, Timeline } from 'antd';
import { useEffect, useState } from 'react';
import { formatFcfa } from '@/lib/format';
import { professionnelService } from '@/services';
import type { GesteMarketing, GesteRealise } from '@/types';
import { EnregistrerGesteModal } from './EnregistrerGesteModal';

interface Props {
  professionnelId: string;
}

export function GestesTab({ professionnelId }: Props) {
  const [gestesRealises, setGestesRealises] = useState<GesteRealise[]>([]);
  const [gestesMarketing, setGestesMarketing] = useState<GesteMarketing[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  function load() {
    professionnelService.getGestesRealises(professionnelId).then(setGestesRealises);
  }

  useEffect(() => {
    load();
    professionnelService.getGestesMarketing().then(setGestesMarketing);
  }, [professionnelId]);

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)} style={{ marginBottom: 20 }}>
        Enregistrer un geste
      </Button>

      {gestesRealises.length === 0 ? (
        <Empty description="Aucun geste enregistré" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Timeline
          items={gestesRealises.map((g) => {
            const libelle = gestesMarketing.find((gm) => gm.id === g.gesteMarketingId)?.libelle ?? g.gesteMarketingId;
            return {
              dot: <GiftOutlined style={{ color: '#0F6E52' }} />,
              children: (
                <div key={g.id}>
                  <div style={{ fontWeight: 600, color: '#123832' }}>
                    {libelle} {g.coutFcfa != null && <span style={{ color: '#8FB0A8', fontWeight: 400 }}>— {formatFcfa(g.coutFcfa)}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#8FB0A8' }}>{g.date}</div>
                  {g.commentaire && <div style={{ fontSize: 13, marginTop: 4 }}>{g.commentaire}</div>}
                </div>
              ),
            };
          })}
        />
      )}

      <EnregistrerGesteModal
        open={modalOpen}
        professionnelId={professionnelId}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </div>
  );
}
