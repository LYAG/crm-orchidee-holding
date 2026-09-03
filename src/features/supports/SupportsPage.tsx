'use client';

import {
  ClockCircleOutlined,
  DeleteOutlined,
  FileOutlined,
  FilePdfOutlined,
  PlayCircleOutlined,
  SlidersOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { App, Button, Col, Empty, Modal, Row, Skeleton, Tag, Typography } from 'antd';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supportService } from '@/services';
import { ImportSupportModal } from './ImportSupportModal';
import type { ParametresApp, SupportCommercial } from '@/types';
import { SupportType } from '@/types';

const { Text } = Typography;

const TYPE_CONFIG: Record<SupportType, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  [SupportType.PPT]: {
    color: '#E65100',
    bg: '#FFF3E0',
    border: '#FFE0B2',
    icon: <SlidersOutlined />,
  },
  [SupportType.PDF]: {
    color: '#C62828',
    bg: '#FFEBEE',
    border: '#FFCDD2',
    icon: <FilePdfOutlined />,
  },
};

function formatDureeMin(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m} min` : `${m} min ${s} s`;
}

function SupportCard({
  support,
  dureeMin,
  onDelete,
}: {
  support: SupportCommercial;
  dureeMin: number;
  onDelete: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[support.type];
  const dateVersion = new Date(support.dateVersion).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #E7F3F0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'all 0.18s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = `${cfg.color}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = '#E7F3F0';
      }}
    >
      {/* Accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${cfg.color} 0%, ${cfg.color}80 100%)` }} />

      {/* Header */}
      <div style={{ padding: '16px 18px 14px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              color: cfg.color,
              flexShrink: 0,
            }}
          >
            {cfg.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text
              strong
              style={{
                fontSize: 15,
                color: '#123832',
                display: 'block',
                lineHeight: 1.3,
                marginBottom: 6,
              }}
            >
              {support.titre}
            </Text>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: cfg.bg,
                color: cfg.color,
                borderRadius: 5,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 700,
                border: `1px solid ${cfg.border}`,
              }}
            >
              <FileOutlined style={{ fontSize: 10 }} />
              {support.type}
            </div>
          </div>
        </div>

        {/* Meta pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: '#EFF6F4',
              color: '#0F6E52',
              borderRadius: 5,
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <SlidersOutlined style={{ fontSize: 11 }} />
            {support.nombreSlides} slides
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: '#E3F2FD',
              color: '#1565C0',
              borderRadius: 5,
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <ClockCircleOutlined style={{ fontSize: 11 }} />
            {formatDureeMin(dureeMin)} min
          </div>
        </div>

        {/* Version */}
        <Text type="secondary" style={{ fontSize: 11, marginTop: 10, display: 'block' }}>
          Version du {dateVersion}
        </Text>
      </div>

      {/* Footer action */}
      <div
        style={{
          padding: '12px 18px',
          borderTop: '1px solid #E7F3F0',
          background: '#F7FAF9',
        }}
      >
        <Row gutter={8} style={{ alignItems: 'center' }}>
          <Col flex="1">
            <Link href={`/supports/${support.id}/presentation`} style={{ display: 'block' }}>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                style={{ width: '100%', borderRadius: 8 }}
              >
                Lancer la présentation
              </Button>
            </Link>
          </Col>
          <Col>
            <Button
              danger
              type="default"
              icon={<DeleteOutlined />}
              style={{ borderRadius: 8 }}
              onClick={() => onDelete(support.id)}
            />
          </Col>
        </Row>
      </div>
    </div>
  );
}

export function SupportsPage() {
  const { message } = App.useApp();
  const [supports, setSupports] = useState<SupportCommercial[]>([]);
  const [parametres, setParametres] = useState<ParametresApp>({ tempsMoyenParSlide: 120 });
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);

  const refreshSupports = () => {
    setLoading(true);
    // Fetchs indépendants : un paramétrage indisponible ne doit jamais effacer une liste
    // de supports pourtant bien récupérée (Promise.all échouerait globalement sinon).
    Promise.allSettled([supportService.getAll(), supportService.getParametres()])
      .then(([s, p]) => {
        if (s.status === 'fulfilled') setSupports(s.value);
        if (p.status === 'fulfilled') setParametres(p.value);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshSupports();
  }, []);

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Supprimer ce support ?',
      content: 'Cette action rendra le support indisponible dans la bibliothèque.',
      okText: 'Supprimer',
      okButtonProps: { danger: true },
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          await supportService.delete(id);
          setSupports((current) => current.filter((support) => support.id !== id));
          message.success('Support supprimé.');
        } catch {
          message.error('Impossible de supprimer le support.');
        }
      },
    });
  };

  return (
    <PageContainer
      title="Supports commerciaux"
      subTitle={supports.length > 0 ? `${supports.length} support${supports.length > 1 ? 's' : ''} disponible${supports.length > 1 ? 's' : ''}` : undefined}
      tags={
        <Tag
          style={{
            background: '#FFF3E0',
            color: '#E65100',
            border: 'none',
            fontWeight: 600,
            borderRadius: 6,
          }}
        >
          Bibliothèque
        </Tag>
      }
      extra={
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={() => setImportOpen(true)}
        >
          Importer un support
        </Button>
      }
    >
      {loading ? (
        <Row gutter={[16, 16]}>
          {[1, 2, 3].map((i) => (
            <Col key={i} xs={24} sm={12} lg={8}>
              <div
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  border: '1px solid #E7F3F0',
                  padding: 20,
                }}
              >
                <Skeleton active avatar paragraph={{ rows: 3 }} />
              </div>
            </Col>
          ))}
        </Row>
      ) : supports.length === 0 ? (
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #E7F3F0',
            padding: '60px 24px',
            textAlign: 'center',
          }}
        >
          <Empty description="Aucun support commercial disponible." />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {supports.map((s) => (
            <Col key={s.id} xs={24} sm={12} lg={8}>
              <SupportCard
                support={s}
                dureeMin={s.nombreSlides * parametres.tempsMoyenParSlide}
                onDelete={handleDelete}
              />
            </Col>
          ))}
        </Row>
      )}
      <ImportSupportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={() => refreshSupports()}
      />
    </PageContainer>
  );
}
