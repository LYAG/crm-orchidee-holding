'use client';

import { PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Drawer, Space, Tabs, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { professionnelService, zoneService } from '@/services';
import type { Centre, ProfessionnelSante, Specialite, Zone } from '@/types';
import { DisponibilitesTab } from './DisponibilitesTab';
import { GestesTab } from './GestesTab';
import { HistoriqueRdvTab } from './HistoriqueRdvTab';
import { InformationsTab } from './InformationsTab';

const { Text } = Typography;

interface Props {
  open: boolean;
  professionnel: ProfessionnelSante | null;
  onClose: () => void;
  onChanged: () => void;
}

export function ProfessionnelDrawer({ open, professionnel, onClose, onChanged }: Props) {
  const [pro, setPro] = useState<ProfessionnelSante | null>(professionnel);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [specialites, setSpecialites] = useState<Specialite[]>([]);

  useEffect(() => {
    setPro(professionnel);
  }, [professionnel]);

  useEffect(() => {
    if (open) {
      professionnelService.getCentres().then(setCentres).catch(() => {});
      zoneService.getAll().then(setZones).catch(() => {});
      professionnelService.getSpecialites().then(setSpecialites).catch(() => {});
    }
  }, [open]);

  async function refresh() {
    if (!pro) return;
    const updated = await professionnelService.getProfessionnelById(pro.id);
    setPro(updated);
    onChanged();
  }

  if (!pro) return null;

  const centre = centres.find((c) => c.id === pro.centreId);
  const zone = centre ? zones.find((z) => z.id === centre.zoneId) : undefined;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={520}
      title={
        <Space size={12}>
          <Avatar size={40} style={{ background: '#E8F5E9', color: '#2E6B5B', fontWeight: 700 }} icon={<UserOutlined />} />
          <div>
            <Text strong style={{ display: 'block', fontSize: 15 }}>
              {pro.titre ? `${pro.titre} ` : ''}
              {pro.nom} {pro.prenom ?? ''}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {centre?.nom}
              {zone ? ` — ${zone.nom}` : ''}
            </Text>
          </div>
        </Space>
      }
      extra={
        pro.telephones[0] && (
          <a href={`tel:${pro.telephones[0]}`}>
            <Tag icon={<PhoneOutlined />} style={{ borderRadius: 6 }}>
              {pro.telephones[0]}
            </Tag>
          </a>
        )
      }
    >
      <Tabs
        items={[
          {
            key: 'informations',
            label: 'Informations',
            children: (
              <InformationsTab
                professionnel={pro}
                centres={centres}
                specialites={specialites}
                onSaved={(updated) => {
                  setPro(updated);
                  onChanged();
                }}
              />
            ),
          },
          {
            key: 'disponibilites',
            label: 'Disponibilités',
            children: (
              <DisponibilitesTab
                professionnel={pro}
                onSaved={(updated) => {
                  setPro(updated);
                  onChanged();
                }}
              />
            ),
          },
          {
            key: 'gestes',
            label: 'Gestes marketing',
            children: <GestesTab professionnelId={pro.id} />,
          },
          {
            key: 'rdv',
            label: 'Historique RDV',
            children: <HistoriqueRdvTab professionnel={pro} onProfessionnelChanged={refresh} />,
          },
        ]}
      />
    </Drawer>
  );
}
