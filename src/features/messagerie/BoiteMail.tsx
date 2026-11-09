'use client';

import {
  CloudDownloadOutlined,
  EditOutlined,
  InboxOutlined,
  LeftOutlined,
  PaperClipOutlined,
  ReloadOutlined,
  RightOutlined,
  SendOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Alert, App, Button, Input, Spin, Tooltip, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { messagerieService } from '@/services';
import type { MessageEmail, MessageEmailResume } from '@/types/messagerie';
import {
  decomposerAdresse,
  formatDateHeure,
  formatDateListe,
  messageErreur,
  nomCourt,
} from './format';
import { htmlDepuisTexte } from './EditeurMessage';
import { LecteurMessage } from './LecteurMessage';
import { NouveauMessageModal, type ModeRedaction } from './NouveauMessageModal';
import { signalerNonLusModifies } from './nonLus';

const { Text } = Typography;
const TAILLE_PAGE = 25;

/** RECU / ENVOYE : boîte du CRM (admin) ; MES_ENVOIS : envois groupés de l'utilisateur (manager). */
export type Dossier = 'RECU' | 'ENVOYE' | 'MES_ENVOIS';

const DOSSIERS: Record<Dossier, { libelle: string; icone: React.ReactNode }> = {
  RECU: { libelle: 'Boîte de réception', icone: <InboxOutlined /> },
  ENVOYE: { libelle: 'Envoyés', icone: <SendOutlined /> },
  MES_ENVOIS: { libelle: 'Envois à mes délégués', icone: <TeamOutlined /> },
};

interface Props {
  dossiers: Dossier[];
  modesRedaction: ModeRedaction[];
}

type Reponse = { destinataires: string[]; sujet: string; corps: string };

/**
 * Messagerie en trois volets, à la manière d'un webmail : dossiers, liste des messages, lecture.
 * Sur téléphone, un seul volet à la fois (liste, puis message avec un bouton retour).
 */
export function BoiteMail({ dossiers, modesRedaction }: Props) {
  const { message } = App.useApp();
  const [dossier, setDossier] = useState<Dossier>(dossiers[0]);
  const [page, setPage] = useState(0);
  const [saisie, setSaisie] = useState('');
  const [recherche, setRecherche] = useState('');
  const [lignes, setLignes] = useState<MessageEmailResume[]>([]);
  const [total, setTotal] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [releve, setReleve] = useState(false);
  const [nonLus, setNonLus] = useState(0);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [redaction, setRedaction] = useState<{ initial: Reponse | null; cle: number } | null>(null);
  const recus = dossier === 'RECU';
  const mesEnvois = dossier === 'MES_ENVOIS';
  const peutRepondre = modesRedaction.includes('adresses');

  const charger = useCallback(() => {
    setChargement(true);
    (mesEnvois
      ? messagerieService.getMesEnvois(page, TAILLE_PAGE)
      : messagerieService.getMessages(dossier, page, TAILLE_PAGE, recherche || undefined)
    )
      .then((p) => {
        setLignes(p.contenu);
        setTotal(p.total);
        setErreur(null);
      })
      .catch((err) => setErreur(messageErreur(err, 'Messages indisponibles.')))
      .finally(() => setChargement(false));
  }, [dossier, mesEnvois, page, recherche]);

  const rafraichirNonLus = useCallback(() => {
    if (!dossiers.includes('RECU')) return;
    messagerieService
      .getNonLus()
      .then((n) => {
        setNonLus(n);
        signalerNonLusModifies();
      })
      .catch(() => {});
  }, [dossiers]);

  useEffect(() => {
    queueMicrotask(charger);
  }, [charger]);

  useEffect(() => {
    queueMicrotask(rafraichirNonLus);
  }, [rafraichirNonLus]);

  function changerDossier(d: Dossier) {
    setDossier(d);
    setPage(0);
    setSaisie('');
    setRecherche('');
    setOuvert(null);
  }

  async function relever() {
    setReleve(true);
    try {
      const r = await messagerieService.relever();
      message.success(
        r.nouveaux === 0 ? 'Aucun nouveau message.' : `${r.nouveaux} nouveau(x) message(s).`,
      );
      setPage(0);
      charger();
      rafraichirNonLus();
    } catch (err) {
      message.error(messageErreur(err, 'Relève impossible.'));
    } finally {
      setReleve(false);
    }
  }

  function apresLecture(id: string, lu: boolean) {
    setLignes((ls) => ls.map((l) => (l.id === id ? { ...l, lu } : l)));
    rafraichirNonLus();
  }

  function repondre(m: MessageEmail) {
    const { adresse } = decomposerAdresse(m.expediteur);
    const sujet = m.sujet ?? '';
    const entete = `Le ${formatDateHeure(m.dateMessage)}, ${m.expediteur ?? ''} a écrit :`;
    setRedaction({
      initial: {
        destinataires: adresse ? [adresse] : [],
        sujet: /^re\s*:/i.test(sujet) ? sujet : `Re : ${sujet}`,
        corps:
          `<div><br></div><div><br></div><div>${htmlDepuisTexte(entete)}</div>` +
          '<blockquote style="margin: 0 0 0 6px; padding-left: 12px; border-left: 2px solid #c8d3cf; color: #5b6b66">' +
          `${htmlDepuisTexte(m.corpsTexte ?? '')}</blockquote>`,
      },
      cle: Date.now(),
    });
  }

  const debut = total === 0 ? 0 : page * TAILLE_PAGE + 1;
  const fin = Math.min(total, (page + 1) * TAILLE_PAGE);

  return (
    <div className={`oh-mail${ouvert ? ' oh-mail--lecture' : ''}`}>
      {/* ── Dossiers ─────────────────────────────────────────────── */}
      <nav className="oh-mail__dossiers" aria-label="Dossiers">
        <Button
          type="primary"
          size="large"
          icon={<EditOutlined />}
          className="oh-mail__nouveau"
          onClick={() => setRedaction({ initial: null, cle: Date.now() })}
        >
          {peutRepondre ? 'Nouveau message' : 'Nouvel envoi groupé'}
        </Button>
        <div className="oh-mail__liste-dossiers">
          {dossiers.map((d) => (
            <button
              key={d}
              type="button"
              className={`oh-mail__dossier${d === dossier ? ' is-actif' : ''}`}
              onClick={() => changerDossier(d)}
            >
              {DOSSIERS[d].icone}
              <span className="oh-mail__dossier-nom">{DOSSIERS[d].libelle}</span>
              {d === 'RECU' && nonLus > 0 && <span className="oh-mail__compteur">{nonLus}</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Liste ────────────────────────────────────────────────── */}
      <section className="oh-mail__liste" aria-label={DOSSIERS[dossier].libelle}>
        <div className="oh-mail__barre">
          {mesEnvois ? (
            <Text type="secondary" className="oh-mail__aide">
              Les réponses arrivent dans votre propre boîte mail.
            </Text>
          ) : (
            <Input.Search
              allowClear
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              placeholder="Rechercher dans les messages"
              onSearch={(v) => {
                setPage(0);
                setRecherche(v.trim());
              }}
            />
          )}
          <div className="oh-mail__outils">
            {recus && (
              <Tooltip title="Relever la boîte maintenant">
                <Button
                  type="text"
                  icon={<CloudDownloadOutlined />}
                  loading={releve}
                  onClick={relever}
                  aria-label="Relever"
                />
              </Tooltip>
            )}
            <Tooltip title="Actualiser">
              <Button
                type="text"
                icon={<ReloadOutlined />}
                onClick={charger}
                aria-label="Actualiser"
              />
            </Tooltip>
            <span style={{ flex: 1 }} />
            <Text type="secondary" className="oh-mail__pagination">
              {debut}–{fin} sur {total}
            </Text>
            <Button
              type="text"
              icon={<LeftOutlined />}
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Page précédente"
            />
            <Button
              type="text"
              icon={<RightOutlined />}
              disabled={fin >= total}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Page suivante"
            />
          </div>
        </div>

        {erreur && <Alert type="error" showIcon title={erreur} style={{ margin: 12 }} />}

        <div className="oh-mail__lignes">
          {chargement && lignes.length === 0 ? (
            <div className="oh-mail__vide">
              <Spin />
            </div>
          ) : lignes.length === 0 ? (
            <div className="oh-mail__vide">
              {DOSSIERS[dossier].icone}
              <Text type="secondary">
                {recherche
                  ? 'Aucun message ne correspond à la recherche.'
                  : recus
                    ? 'Aucun message reçu.'
                    : mesEnvois
                      ? 'Aucun envoi groupé pour le moment.'
                      : 'Aucun message envoyé.'}
              </Text>
            </div>
          ) : (
            lignes.map((m) => {
              const nonLu = recus && !m.lu;
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`oh-mail__ligne${nonLu ? ' is-non-lu' : ''}${m.id === ouvert ? ' is-actif' : ''}`}
                  onClick={() => setOuvert(m.id)}
                >
                  <span className="oh-mail__ligne-haut">
                    <span className="oh-mail__correspondant">
                      {recus ? nomCourt(m.expediteur) : `À : ${nomCourt(m.destinataires)}`}
                    </span>
                    {m.piecesJointes && <PaperClipOutlined className="oh-mail__trombone" />}
                    <span className="oh-mail__date">{formatDateListe(m.dateMessage)}</span>
                  </span>
                  <span className="oh-mail__ligne-sujet">
                    {m.statut === 'ECHEC' && <span className="oh-mail__echec">Échec</span>}
                    {m.sujet || '(sans objet)'}
                  </span>
                  {m.apercu && <span className="oh-mail__apercu">{m.apercu}</span>}
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* ── Lecture ──────────────────────────────────────────────── */}
      <section className="oh-mail__lecture" aria-label="Message">
        <LecteurMessage
          id={ouvert}
          charger={mesEnvois ? (id) => messagerieService.getMonEnvoi(id) : undefined}
          onLu={apresLecture}
          onRepondre={peutRepondre ? repondre : undefined}
          onRetour={() => setOuvert(null)}
        />
      </section>

      <NouveauMessageModal
        key={redaction?.cle ?? 'fermee'}
        modes={modesRedaction}
        open={redaction !== null}
        initial={redaction?.initial ?? null}
        onClose={() => setRedaction(null)}
        onEnvoye={() => {
          setRedaction(null);
          if (!recus) {
            setPage(0);
            charger();
          }
        }}
      />
    </div>
  );
}
