'use client';

import {
  ArrowLeftOutlined,
  EyeInvisibleOutlined,
  MailOutlined,
  PaperClipOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import { Alert, App, Button, Segmented, Spin, Tooltip, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { messagerieService } from '@/services';
import type { MessageEmail } from '@/types/messagerie';
import { decomposerAdresse, formatDateHeure, initiales, messageErreur } from './format';

const { Text } = Typography;

interface Props {
  id: string | null;
  /** Chargement du détail ; par défaut la boîte complète (admin). */
  charger?: (id: string) => Promise<MessageEmail>;
  onLu: (id: string, lu: boolean) => void;
  /** Absent : pas de bouton Répondre (manager, messages envoyés). */
  onRepondre?: (m: MessageEmail) => void;
  /** Téléphone : retour à la liste. */
  onRetour: () => void;
}

/**
 * Volet de lecture. Un message reçu est marqué lu à l'ouverture (dans le CRM seulement). Le HTML
 * reçu n'est jamais injecté dans la page : il est rendu dans une iframe `sandbox` sans script.
 */
export function LecteurMessage({ id, charger, onLu, onRepondre, onRetour }: Props) {
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
    // onLu et charger sont recréés à chaque rendu du parent : seul l'id déclenche un chargement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!id) {
    return (
      <div className="oh-mail__vide">
        <MailOutlined />
        <Text type="secondary">Sélectionnez un message pour le lire.</Text>
      </div>
    );
  }

  const courant = resultat?.id === id ? resultat : null;
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

  const expediteur = decomposerAdresse(m?.expediteur);
  const nomExpediteur = expediteur.nom || expediteur.adresse || '—';

  return (
    <article className="oh-mail__message">
      <div className="oh-mail__barre-lecture">
        <Button
          type="text"
          className="oh-mail__retour"
          icon={<ArrowLeftOutlined />}
          onClick={onRetour}
          aria-label="Retour à la liste"
        />
        <span style={{ flex: 1 }} />
        {m?.direction === 'RECU' && m.lu && (
          <Tooltip title="Marquer comme non lu">
            <Button type="text" icon={<EyeInvisibleOutlined />} onClick={marquerNonLu} />
          </Tooltip>
        )}
        {m && onRepondre && m.direction === 'RECU' && (
          <Tooltip title="Répondre">
            <Button type="text" icon={<RollbackOutlined />} onClick={() => onRepondre(m)} />
          </Tooltip>
        )}
      </div>

      {!courant ? (
        <div className="oh-mail__vide">
          <Spin />
        </div>
      ) : courant.erreur ? (
        <Alert type="error" showIcon title={courant.erreur} />
      ) : (
        m && (
          <>
            <h2 className="oh-mail__sujet">{m.sujet || '(sans objet)'}</h2>
            {m.statut === 'ECHEC' && (
              <Alert
                type="error"
                showIcon
                title="Envoi en échec"
                description={m.erreur}
                style={{ marginBottom: 16 }}
              />
            )}

            <header className="oh-mail__entete">
              <span className="oh-mail__avatar" aria-hidden>
                {initiales(nomExpediteur)}
              </span>
              <div className="oh-mail__entete-texte">
                <div className="oh-mail__entete-ligne">
                  <span>
                    <strong>{nomExpediteur}</strong>
                    {expediteur.nom && (
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {' '}
                        &lt;{expediteur.adresse}&gt;
                      </Text>
                    )}
                  </span>
                  <Text type="secondary" className="oh-mail__entete-date">
                    {formatDateHeure(m.dateMessage)}
                  </Text>
                </div>
                <Text type="secondary" className="oh-mail__entete-a">
                  À : {m.destinataires ?? '—'}
                  {m.copie && ` · Cc : ${m.copie}`}
                </Text>
              </div>
            </header>

            {m.piecesJointes.length > 0 && (
              <div className="oh-mail__pj">
                {m.piecesJointes.map((p) => (
                  <span key={p} className="oh-mail__pj-item" title="Consultable dans le webmail">
                    <PaperClipOutlined /> {p}
                  </span>
                ))}
              </div>
            )}

            {m.corpsHtml && (
              <Segmented
                size="small"
                value={vue}
                onChange={(v) => setVue(v as 'texte' | 'html')}
                options={[
                  { value: 'texte', label: 'Texte' },
                  { value: 'html', label: 'Mise en forme' },
                ]}
                style={{ marginBottom: 12 }}
              />
            )}
            {vue === 'html' && m.corpsHtml ? (
              <iframe
                title="Contenu du message"
                sandbox=""
                srcDoc={m.corpsHtml}
                className="oh-mail__html"
              />
            ) : (
              <div className="oh-mail__corps">
                {m.corpsTexte?.trim() ? m.corpsTexte : <Text type="secondary">(message vide)</Text>}
              </div>
            )}

            {onRepondre && m.direction === 'RECU' && (
              <div className="oh-mail__actions">
                <Button icon={<RollbackOutlined />} onClick={() => onRepondre(m)}>
                  Répondre
                </Button>
              </div>
            )}
          </>
        )
      )}
    </article>
  );
}
