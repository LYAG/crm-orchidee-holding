'use client';

import { CheckOutlined, ClockCircleOutlined, DownloadOutlined, ExportOutlined } from '@ant-design/icons';
import { Alert, Button, Progress, Space, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { formationService } from '@/services';
import type { LeconParcours } from '@/types/formation';
import { TYPES_LECON, messageErreur, telecharger } from './constants';

const { Paragraph, Text } = Typography;

type Integration =
  | { kind: 'iframe'; src: string; lecteurVideo: boolean }
  | { kind: 'video'; src: string }
  | { kind: 'image'; src: string }
  | { kind: 'pdf'; src: string };

/**
 * Convertit un lien en contenu lisible dans l'outil : lecteurs YouTube, Vimeo, Dailymotion,
 * Google Drive, fichiers vidéo / image / PDF directs ; sinon page intégrée en iframe.
 */
export function integration(url: string): Integration {
  const youtube = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i);
  if (youtube) return { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${youtube[1]}?rel=0`, lecteurVideo: true };
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo) return { kind: 'iframe', src: `https://player.vimeo.com/video/${vimeo[1]}`, lecteurVideo: true };
  const dailymotion = url.match(/dailymotion\.com\/video\/([a-z0-9]+)/i);
  if (dailymotion) return { kind: 'iframe', src: `https://www.dailymotion.com/embed/video/${dailymotion[1]}`, lecteurVideo: true };
  const drive = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/i);
  if (drive) return { kind: 'iframe', src: `https://drive.google.com/file/d/${drive[1]}/preview`, lecteurVideo: false };
  const chemin = url.split(/[?#]/)[0].toLowerCase();
  if (/\.(mp4|webm|ogg|ogv|mov)$/.test(chemin)) return { kind: 'video', src: url };
  if (/\.(png|jpe?g|gif|webp|svg)$/.test(chemin)) return { kind: 'image', src: url };
  if (chemin.endsWith('.pdf')) return { kind: 'pdf', src: url };
  return { kind: 'iframe', src: url, lecteurVideo: false };
}

function formatChrono(secondes: number): string {
  const s = Math.max(0, Math.ceil(secondes));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function formatOctets(o: number): string {
  if (o < 1024 * 1024) return `${Math.round(o / 1024)} Ko`;
  return `${(o / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
}

const cadre = { width: '100%', border: '1px solid var(--oh-line)', borderRadius: 8, background: '#000' } as const;

interface Props {
  affectationId: string;
  lecon: LeconParcours;
  /** Valide la consultation (le serveur revérifie le temps minimal). */
  onValider: () => Promise<void>;
  onFermer: () => void;
}

/**
 * Lecture d'une leçon dans l'outil : texte, lecteur vidéo intégré, PDF ou image ; jauge de
 * chargement des supports téléversés ; temps minimal de consultation avant de pouvoir valider.
 * Le chronomètre démarre une fois le contenu chargé et se met en pause quand l'onglet est masqué.
 */
export function LecteurLecon({ affectationId, lecon, onValider, onFermer }: Props) {
  const lien = lecon.url ? integration(lecon.url) : null;
  // Sans support à charger (texte seul), la leçon est prête immédiatement.
  const [pret, setPret] = useState(!lecon.aFichier && !lien);
  const [chargement, setChargement] = useState<{ charge: number; total: number | null } | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ecoule, setEcoule] = useState(0);
  const [envoi, setEnvoi] = useState(false);
  const blobRef = useRef<string | null>(null);

  const minimum = lecon.consultee ? 0 : lecon.tempsMinimalSecondes;
  const restant = Math.max(0, minimum - ecoule);
  const type = lecon.fichierType ?? '';

  // Téléchargement du support téléversé, avec jauge de progression.
  useEffect(() => {
    if (!lecon.aFichier) return;
    let annule = false;
    formationService
      .getFichierLeconApprenant(affectationId, lecon.id, (charge, total) => {
        if (!annule) setChargement({ charge, total });
      })
      .then((b) => {
        if (annule) return;
        blobRef.current = URL.createObjectURL(b);
        setBlobUrl(blobRef.current);
        setChargement(null);
        // Une vidéo devient « prête » quand le lecteur a ses premières images (onLoadedData).
        if (!(lecon.fichierType ?? '').startsWith('video/')) setPret(true);
      })
      .catch((err) => !annule && setErreur(messageErreur(err, 'Support indisponible.')));
    return () => {
      annule = true;
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    };
  }, [affectationId, lecon.id, lecon.aFichier, lecon.fichierType]);

  // Chronomètre de consultation : uniquement contenu prêt et onglet visible.
  useEffect(() => {
    if (!pret || minimum === 0) return;
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') setEcoule((e) => e + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [pret, minimum]);

  async function valider() {
    setEnvoi(true);
    try {
      await onValider();
    } catch (err) {
      setErreur(messageErreur(err, 'Validation impossible.'));
    } finally {
      setEnvoi(false);
    }
  }

  const surChargement = () => setPret(true);
  const pourcentage = chargement?.total ? Math.round((chargement.charge * 100) / chargement.total) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: '100%' }}>
      <Text type="secondary">{TYPES_LECON[lecon.type]}</Text>
      {erreur && <Alert type="error" showIcon message={erreur} />}

      {/* Support téléversé : jauge, puis affichage en ligne. */}
      {lecon.aFichier && !blobUrl && !erreur && (
        <div style={{ padding: 24, border: '1px dashed var(--oh-line-strong)', borderRadius: 8, textAlign: 'center' }}>
          <Text>Chargement de {lecon.fichierNom ?? 'du support'}…</Text>
          <Progress
            percent={pourcentage ?? 99}
            status="active"
            strokeColor="#0F6E52"
            showInfo={pourcentage != null}
            style={{ marginTop: 8 }}
          />
          {chargement && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatOctets(chargement.charge)}
              {chargement.total ? ` / ${formatOctets(chargement.total)}` : ''}
            </Text>
          )}
        </div>
      )}
      {blobUrl && type.startsWith('video/') && (
        <video src={blobUrl} controls controlsList="nodownload" onLoadedData={surChargement} style={{ ...cadre, maxHeight: '60vh' }} />
      )}
      {blobUrl && type.startsWith('image/') && (
        // Aperçu d’un Blob local : next/image ne s’applique pas aux URL blob:.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={blobUrl} alt={lecon.titre} style={{ maxWidth: '100%', borderRadius: 8 }} />
      )}
      {blobUrl && type === 'application/pdf' && (
        <iframe src={blobUrl} title={lecon.titre} style={{ ...cadre, height: '65vh', background: '#fff' }} />
      )}
      {blobUrl && !type.startsWith('video/') && !type.startsWith('image/') && type !== 'application/pdf' && (
        <Alert
          type="info"
          showIcon
          message="Ce format ne s’affiche pas dans le navigateur."
          action={
            <Button size="small" icon={<DownloadOutlined />} onClick={() => fetch(blobUrl).then((r) => r.blob()).then((b) => telecharger(b, lecon.fichierNom ?? 'support'))}>
              Télécharger
            </Button>
          }
        />
      )}

      {/* Lien : lecteur ou page intégrés dans l'outil. */}
      {lien?.kind === 'iframe' && (
        <>
          <div style={{ position: 'relative', width: '100%', paddingTop: lien.lecteurVideo ? '56.25%' : undefined }}>
            <iframe
              src={lien.src}
              title={lecon.titre}
              onLoad={surChargement}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              style={
                lien.lecteurVideo
                  ? { ...cadre, position: 'absolute', inset: 0, height: '100%' }
                  : { ...cadre, height: '65vh', background: '#fff' }
              }
            />
          </div>
          {!lien.lecteurVideo && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Si la page ne s’affiche pas (certains sites refusent l’intégration),{' '}
              <a href={lecon.url!} target="_blank" rel="noreferrer">
                ouvrez-la dans un nouvel onglet <ExportOutlined />
              </a>
              .
            </Text>
          )}
        </>
      )}
      {lien?.kind === 'video' && <video src={lien.src} controls onLoadedData={surChargement} style={{ ...cadre, maxHeight: '60vh' }} />}
      {lien?.kind === 'pdf' && <iframe src={lien.src} title={lecon.titre} onLoad={surChargement} style={{ ...cadre, height: '65vh', background: '#fff' }} />}
      {lien?.kind === 'image' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={lien.src} alt={lecon.titre} onLoad={surChargement} style={{ maxWidth: '100%', borderRadius: 8 }} />
      )}

      {lecon.contenu && <Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.7, margin: 0 }}>{lecon.contenu}</Paragraph>}

      {/* Validation : après le temps minimal de consultation. */}
      <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--oh-line)' }}>
        {lecon.consultee ? (
          <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
            <Text type="success">
              <CheckOutlined /> Leçon déjà consultée
            </Text>
            <Button onClick={onFermer}>Fermer</Button>
          </Space>
        ) : (
          <Space orientation="vertical" style={{ width: '100%' }}>
            {minimum > 0 && (
              <>
                <Progress percent={Math.round(((minimum - restant) * 100) / minimum)} strokeColor="#0F6E52" showInfo={false} size="small" />
                <Text type="secondary">
                  <ClockCircleOutlined />{' '}
                  {!pret
                    ? 'Le temps de consultation démarre une fois le contenu chargé.'
                    : restant > 0
                      ? `Temps minimal de consultation : encore ${formatChrono(restant)}`
                      : 'Temps minimal atteint : vous pouvez valider la leçon.'}
                </Text>
              </>
            )}
            <Button type="primary" icon={<CheckOutlined />} block disabled={!pret || restant > 0} loading={envoi} onClick={valider}>
              {restant > 0 && pret ? `J’ai terminé la lecture (${formatChrono(restant)})` : 'J’ai terminé la lecture'}
            </Button>
          </Space>
        )}
      </div>
    </div>
  );
}
