'use client';

import { PaperClipOutlined } from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Descriptions,
  Drawer,
  Segmented,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useState } from 'react';
import { messagerieService } from '@/services';
import type { MessageEmail } from '@/types/messagerie';
import { formatDateHeure, messageErreur } from './format';

const { Text } = Typography;

interface Props {
  id: string | null;
  onClose: () => void;
  onLu: (id: string, lu: boolean) => void;
  /** Chargement du détail ; par défaut la boîte complète (admin). */
  charger?: (id: string) => Promise<MessageEmail>;
}

/**
 * Détail d'un message. Un message reçu est marqué lu à l'ouverture (dans le CRM seulement). Le HTML
 * reçu n'est jamais injecté dans la page : il est rendu dans une iframe `sandbox` sans script.
 */
export function MessageDrawer({ id, onClose, onLu, charger }: Props) {
  const { message } = App.useApp();
  const [resultat, setResultat] = useState<{
    id: string;
    message: MessageEmail | null;
    erreur: string | null;
  } | null>(null);
  const [vue, setVue] = useState<'texte' | 'html'>('texte');

  useEffect(() => {
    if (!id) return;
    let annule = false;
    (charger ? charger(id) : messagerieService.getMessage(id))
      .then(async (m) => {
        if (m.direction === 'RECU' && !m.lu) {
          m = await messagerieService.marquerLu(m.id, true);
          onLu(m.id, true);
        }
        if (!annule) {
          setVue(m.corpsHtml && !m.corpsTexte ? 'html' : 'texte');
          setResultat({ id, message: m, erreur: null });
        }
      })
      .catch((err) => {
        if (!annule)
          setResultat({ id, message: null, erreur: messageErreur(err, 'Message indisponible.') });
      });
    return () => {
      annule = true;
    };
    // onLu est recréé à chaque rendu du parent : seul l'id déclenche un chargement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // id null : tiroir en cours de fermeture, on garde le dernier message affiché pendant l'animation.
  const courant = resultat && (id === null || resultat.id === id) ? resultat : null;
  const m = courant?.message ?? null;

  async function marquerNonLu() {
    if (!m) return;
    try {
      const maj = await messagerieService.marquerLu(m.id, false);
      setResultat({ id: m.id, message: maj, erreur: null });
      onLu(m.id, false);
      message.success('Message marqué non lu.');
    } catch (err) {
      message.error(messageErreur(err, 'Action impossible.'));
    }
  }

  return (
    <Drawer
      open={id !== null}
      onClose={onClose}
      size="min(720px, 100vw)"
      destroyOnHidden
      title={m?.sujet || (m ? '(sans objet)' : 'Message')}
      extra={
        m?.direction === 'RECU' && m.lu ? (
          <Button size="small" onClick={marquerNonLu}>
            Marquer non lu
          </Button>
        ) : null
      }
    >
      {!courant ? (
        <Spin />
      ) : courant.erreur ? (
        <Alert type="error" showIcon title={courant.erreur} />
      ) : (
        m && (
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            {m.statut === 'ECHEC' && (
              <Alert type="error" showIcon title="Envoi en échec" description={m.erreur} />
            )}
            <Descriptions
              size="small"
              column={1}
              items={[
                { key: 'de', label: 'De', children: m.expediteur ?? '—' },
                { key: 'a', label: 'À', children: m.destinataires ?? '—' },
                ...(m.copie ? [{ key: 'cc', label: 'Cc', children: m.copie }] : []),
                { key: 'date', label: 'Date', children: formatDateHeure(m.dateMessage) },
              ]}
            />
            {m.piecesJointes.length > 0 && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Pièces jointes (consultables dans le webmail) :
                </Text>
                <Space wrap size={[6, 6]} style={{ display: 'flex', marginTop: 4 }}>
                  {m.piecesJointes.map((p) => (
                    <Tag key={p} icon={<PaperClipOutlined />}>
                      {p}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
            {m.corpsHtml && (
              <Segmented
                value={vue}
                onChange={(v) => setVue(v as 'texte' | 'html')}
                options={[
                  { value: 'texte', label: 'Texte' },
                  { value: 'html', label: 'Mise en forme' },
                ]}
              />
            )}
            {vue === 'html' && m.corpsHtml ? (
              <iframe
                title="Contenu du message"
                sandbox=""
                srcDoc={m.corpsHtml}
                style={{
                  width: '100%',
                  minHeight: 420,
                  border: '1px solid var(--oh-line)',
                  borderRadius: 8,
                  background: '#fff',
                }}
              />
            ) : (
              <div
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  padding: 16,
                  borderRadius: 8,
                  background: 'var(--oh-surface-muted)',
                  border: '1px solid var(--oh-line)',
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                {m.corpsTexte?.trim() ? m.corpsTexte : <Text type="secondary">(message vide)</Text>}
              </div>
            )}
          </Space>
        )
      )}
    </Drawer>
  );
}
