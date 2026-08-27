'use client';

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Col,
  Modal,
  Progress,
  Row,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { supportService } from '@/services';
import type { MetriquePresentation, SupportCommercial } from '@/types';

const { Title, Text } = Typography;

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

interface Props {
  support: SupportCommercial;
  rdvId?: string;
  tempsMoyenParSlide: number;
}

export function PresentationMode({ support, rdvId, tempsMoyenParSlide }: Props) {
  const router = useRouter();

  const [pdfState, setPdfState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageAspect, setPageAspect] = useState(4 / 3);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [phase, setPhase] = useState<'presenting' | 'summary'>('presenting');
  const [displayGlobal, setDisplayGlobal] = useState(0);
  const [displaySlide, setDisplaySlide] = useState(0);
  const [savedMetrique, setSavedMetrique] = useState<MetriquePresentation | null>(null);

  const globalRef = useRef(0);
  const slideRef = useRef(0);
  const timingsRef = useRef<number[]>([]);

  // Chargement du PDF réel du support (une seule fois) — rendu page par page via pdf.js,
  // plus de contenu simulé : le nombre de pages fait foi (support.nombreSlides vient du
  // backend mais peut être obsolète si le fichier a changé entre-temps hors de ce flux).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString();
        const blob = await supportService.getFichier(support.id);
        const buffer = await blob.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
        if (cancelled) return;
        pdfDocRef.current = doc;
        timingsRef.current = new Array(doc.numPages).fill(0);
        setNumPages(doc.numPages);
        setPdfState('ready');
      } catch (err) {
        if (cancelled) return;
        setPdfError(err instanceof Error ? err.message : 'Impossible de charger le document.');
        setPdfState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [support.id]);

  // Rendu de la page courante sur le canvas.
  useEffect(() => {
    if (pdfState !== 'ready' || !pdfDocRef.current) return;
    let cancelled = false;
    (async () => {
      const page = await pdfDocRef.current!.getPage(currentSlide + 1);
      if (cancelled || !canvasRef.current) return;
      const baseViewport = page.getViewport({ scale: 1 });
      setPageAspect(baseViewport.width / baseViewport.height);
      const scale = 1400 / baseViewport.width;
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    })();
    return () => {
      cancelled = true;
    };
  }, [pdfState, currentSlide]);

  // Timer
  useEffect(() => {
    if (phase !== 'presenting' || pdfState !== 'ready') return;
    const id = setInterval(() => {
      globalRef.current += 1;
      slideRef.current += 1;
      setDisplayGlobal(globalRef.current);
      setDisplaySlide(slideRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, [phase, pdfState]);

  // Keyboard navigation
  useEffect(() => {
    if (phase !== 'presenting' || pdfState !== 'ready') return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape') {
        handleExitRequest();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentSlide, pdfState]);

  // Save metric when entering summary phase
  useEffect(() => {
    if (phase !== 'summary') return;
    const dureeMinimale = numPages * tempsMoyenParSlide;
    const dureeTotal = globalRef.current;
    supportService
      .enregistrerMetrique({
        supportId: support.id,
        rdvId,
        datePresentation: new Date().toISOString(),
        dureeTotal,
        dureeMinimaleAttendue: dureeMinimale,
        conforme: dureeTotal >= dureeMinimale,
        slides: Array.from({ length: numPages }, (_, i) => ({
          slideIndex: i,
          titreSlide: `Page ${i + 1}`,
          tempsPasse: timingsRef.current[i] ?? 0,
        })),
      })
      .then(setSavedMetrique)
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function handleNext() {
    timingsRef.current[currentSlide] = slideRef.current;
    if (currentSlide >= numPages - 1) {
      setPhase('summary');
      return;
    }
    slideRef.current = 0;
    setDisplaySlide(0);
    setCurrentSlide((s) => s + 1);
  }

  function handlePrev() {
    if (currentSlide === 0) return;
    timingsRef.current[currentSlide] = slideRef.current;
    slideRef.current = 0;
    setDisplaySlide(0);
    setCurrentSlide((s) => s - 1);
  }

  function handleExitRequest() {
    Modal.confirm({
      title: 'Quitter la présentation ?',
      content: 'La session en cours sera perdue.',
      okText: 'Quitter',
      okButtonProps: { danger: true },
      cancelText: 'Continuer',
      onOk: () => router.back(),
    });
  }

  if (pdfState === 'loading') {
    return (
      <FullscreenMessage>
        <Spin size="large" />
        <Text style={{ color: '#888' }}>Chargement du document…</Text>
      </FullscreenMessage>
    );
  }

  if (pdfState === 'error') {
    return (
      <FullscreenMessage>
        <Text style={{ color: '#e05252', fontSize: 16 }}>{pdfError}</Text>
        <Button onClick={() => router.back()}>Retour</Button>
      </FullscreenMessage>
    );
  }

  if (phase === 'summary') {
    if (!savedMetrique) {
      return (
        <FullscreenMessage>
          <Spin size="large" />
          <Text style={{ color: '#888' }}>Enregistrement des résultats…</Text>
        </FullscreenMessage>
      );
    }
    return (
      <PresentationSummary
        metrique={savedMetrique}
        support={support}
        onReturn={() => router.back()}
      />
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#111',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <Text style={{ color: '#aaa', fontSize: 13 }}>
          {support.titre}
        </Text>

        {/* Timers */}
        <Space size="large">
          <Space>
            <Text style={{ color: '#aaa', fontSize: 12 }}>Slide</Text>
            <Text
              style={{
                color: '#fff',
                fontFamily: 'monospace',
                fontSize: 20,
                fontWeight: 'bold',
              }}
            >
              {formatTime(displaySlide)}
            </Text>
          </Space>
          <Space>
            <Text style={{ color: '#aaa', fontSize: 12 }}>Total</Text>
            <Text
              style={{
                color: '#0F6E52',
                fontFamily: 'monospace',
                fontSize: 20,
                fontWeight: 'bold',
              }}
            >
              {formatTime(displayGlobal)}
            </Text>
          </Space>
        </Space>

        <Button size="small" onClick={handleExitRequest} style={{ color: '#aaa', borderColor: '#555', background: 'transparent' }}>
          Quitter
        </Button>
      </div>

      {/* Slide canvas */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 80px',
          position: 'relative',
        }}
      >
        {/* Prev button */}
        <Button
          type="text"
          icon={<LeftOutlined style={{ fontSize: 24 }} />}
          disabled={currentSlide === 0}
          onClick={handlePrev}
          style={{
            position: 'absolute',
            left: 16,
            color: currentSlide === 0 ? '#444' : '#fff',
            height: 64,
            width: 48,
          }}
        />

        {/* Slide body — rendu réel du PDF (page courante) */}
        <div
          style={{
            width: '100%',
            maxWidth: 1100,
            aspectRatio: pageAspect,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
            position: 'relative',
            overflow: 'hidden',
            background: '#fff',
          }}
        >
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

          {/* Slide number badge */}
          <div
            style={{
              position: 'absolute',
              top: 20,
              right: 24,
              background: 'rgba(0,0,0,0.55)',
              borderRadius: 20,
              padding: '2px 12px',
            }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
              {currentSlide + 1} / {numPages}
            </Text>
          </div>
        </div>

        {/* Next button */}
        <Button
          type="text"
          icon={<RightOutlined style={{ fontSize: 24 }} />}
          onClick={handleNext}
          style={{
            position: 'absolute',
            right: 16,
            color: '#fff',
            height: 64,
            width: 48,
          }}
        />
      </div>

      {/* Bottom progress bar */}
      <div style={{ padding: '0 24px 16px' }}>
        <Progress
          percent={numPages > 0 ? Math.round(((currentSlide + 1) / numPages) * 100) : 0}
          showInfo={false}
          strokeColor="#0F6E52"
          trailColor="rgba(255,255,255,0.1)"
          size="small"
        />
        <Text style={{ color: '#666', fontSize: 11, display: 'block', textAlign: 'center', marginTop: 4 }}>
          Utilisez ← → ou Espace pour naviguer
        </Text>
      </div>
    </div>
  );
}

function FullscreenMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#111',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      {children}
    </div>
  );
}

// ─── Summary ──────────────────────────────────────────────────────────────────

interface SummaryProps {
  metrique: MetriquePresentation;
  support: SupportCommercial;
  onReturn: () => void;
}

function PresentationSummary({ metrique, support, onReturn }: SummaryProps) {
  const { conforme, dureeTotal, dureeMinimaleAttendue, slides } = metrique;

  const columns = [
    {
      title: 'Slide',
      dataIndex: 'slideIndex',
      key: 'index',
      width: 70,
      render: (idx: number) => `${idx + 1}`,
    },
    {
      title: 'Titre',
      dataIndex: 'titreSlide',
      key: 'titre',
    },
    {
      title: 'Temps passé',
      dataIndex: 'tempsPasse',
      key: 'temps',
      width: 130,
      render: (sec: number) => formatTime(sec),
    },
    {
      title: '',
      key: 'bar',
      render: (_: unknown, row: { tempsPasse: number }) => {
        const pct = Math.min(100, Math.round((row.tempsPasse / (tempsMoyenParSlide ?? 120)) * 100));
        return (
          <Progress
            percent={pct}
            size="small"
            showInfo={false}
            strokeColor={pct >= 100 ? '#0F6E52' : '#E65100'}
          />
        );
      },
    },
  ];

  const tempsMoyenParSlide = slides.length > 0 ? Math.round(dureeMinimaleAttendue / slides.length) : 120;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0a0a',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        overflow: 'auto',
      }}
    >
      <div style={{ width: '100%', maxWidth: 760 }}>
        <Title level={2} style={{ color: '#fff', textAlign: 'center', marginBottom: 4 }}>
          Présentation terminée
        </Title>
        <Text style={{ color: '#888', display: 'block', textAlign: 'center', marginBottom: 32 }}>
          {support.titre}
        </Text>

        {/* KPI row */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <div style={statCardStyle}>
              <Text style={{ color: '#888', fontSize: 12 }}>Durée totale</Text>
              <div style={{ color: '#fff', fontSize: 28, fontFamily: 'monospace', fontWeight: 'bold', marginTop: 4 }}>
                {formatTime(dureeTotal)}
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={statCardStyle}>
              <Text style={{ color: '#888', fontSize: 12 }}>Durée minimale attendue</Text>
              <div style={{ color: '#aaa', fontSize: 28, fontFamily: 'monospace', fontWeight: 'bold', marginTop: 4 }}>
                {formatTime(dureeMinimaleAttendue)}
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ ...statCardStyle, borderColor: conforme ? '#0F6E52' : '#c0392b' }}>
              <Text style={{ color: '#888', fontSize: 12 }}>Conformité</Text>
              <div style={{ marginTop: 8 }}>
                {conforme ? (
                  <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontSize: 16, padding: '4px 12px' }}>
                    Conforme
                  </Tag>
                ) : (
                  <Tag icon={<CloseCircleOutlined />} color="error" style={{ fontSize: 16, padding: '4px 12px' }}>
                    Non conforme
                  </Tag>
                )}
              </div>
            </div>
          </Col>
        </Row>

        {/* Per-slide table */}
        <div style={{ background: '#1a1a1a', borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
          <Table
            dataSource={slides}
            columns={columns}
            rowKey="slideIndex"
            pagination={false}
            size="small"
            style={{ background: 'transparent' }}
            className="dark-table"
          />
        </div>

        <div style={{ textAlign: 'center' }}>
          <Tooltip title="La métrique a été enregistrée">
            <Badge status="success" text={<Text style={{ color: '#666', fontSize: 12 }}>Résultats sauvegardés</Text>} />
          </Tooltip>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Button type="primary" size="large" onClick={onReturn}>
            Retour
          </Button>
        </div>
      </div>
    </div>
  );
}

const statCardStyle: React.CSSProperties = {
  background: '#1a1a1a',
  border: '1px solid #2a2a2a',
  borderRadius: 8,
  padding: '16px 20px',
  textAlign: 'center',
};
