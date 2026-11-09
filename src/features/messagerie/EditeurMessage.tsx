'use client';

import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  BoldOutlined,
  CaretDownOutlined,
  ClearOutlined,
  FontColorsOutlined,
  FontSizeOutlined,
  ItalicOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  OrderedListOutlined,
  RedoOutlined,
  StrikethroughOutlined,
  UnderlineOutlined,
  UndoOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { Popover, Tooltip } from 'antd';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

const POLICES = [
  { label: 'Sans Serif', valeur: 'Arial, Helvetica, sans-serif' },
  { label: 'Serif', valeur: 'Georgia, Times New Roman, serif' },
  { label: 'Largeur fixe', valeur: 'Courier New, monospace' },
  { label: 'Large', valeur: 'Verdana, sans-serif' },
  { label: 'Étroit', valeur: 'Arial Narrow, sans-serif' },
];

/** Tailles HTML (1 à 7) produites par execCommand('fontSize'). */
const TAILLES = [
  { label: 'Petite', valeur: '2', px: 12 },
  { label: 'Normale', valeur: '3', px: 14 },
  { label: 'Grande', valeur: '5', px: 20 },
  { label: 'Très grande', valeur: '6', px: 26 },
];

const COULEURS = [
  '#000000',
  '#434343',
  '#666666',
  '#999999',
  '#cccccc',
  '#ffffff',
  '#0f6e52',
  '#1a7f37',
  '#0b5cad',
  '#6f42c1',
  '#c2185b',
  '#d32f2f',
  '#e65100',
  '#f9a825',
  '#2e7d32',
  '#00838f',
  '#1565c0',
  '#4527a0',
];

const ETATS = [
  'bold',
  'italic',
  'underline',
  'strikeThrough',
  'insertOrderedList',
  'insertUnorderedList',
] as const;
type Etat = (typeof ETATS)[number];

interface Props {
  /** HTML ; lu au montage seulement (le parent remonte l'éditeur pour le changer). */
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  id?: string;
  'aria-invalid'?: boolean;
}

/**
 * Zone de rédaction mise en forme, façon webmail : annuler/rétablir, police, taille, gras, italique,
 * souligné, couleur, alignement, listes, retrait, barré et suppression de la mise en forme. Le collage
 * insère du texte brut pour garder des e-mails propres ; le serveur nettoie le HTML avant l'envoi.
 */
export function EditeurMessage({ value, onChange, placeholder, id, ...rest }: Props) {
  const zone = useRef<HTMLDivElement>(null);
  const selection = useRef<Range | null>(null);
  const [actifs, setActifs] = useState<Partial<Record<Etat, boolean>>>({});
  const [vide, setVide] = useState(() => !texteDepuisHtml(value ?? '').trim());
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [police, setPolice] = useState(POLICES[0].label);

  useEffect(() => {
    if (zone.current) zone.current.innerHTML = value ?? '';
    try {
      document.execCommand('styleWithCSS', false, 'true');
    } catch {
      /* navigateur sans styleWithCSS : balises <font>, nettoyées aussi par le serveur */
    }
    // Lecture unique de la valeur initiale : l'éditeur n'est pas contrôlé.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const majEtats = useCallback(() => {
    const sel = document.getSelection();
    if (!sel || sel.rangeCount === 0 || !zone.current?.contains(sel.anchorNode)) return;
    selection.current = sel.getRangeAt(0).cloneRange();
    const e: Partial<Record<Etat, boolean>> = {};
    for (const c of ETATS) e[c] = document.queryCommandState(c);
    setActifs(e);
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', majEtats);
    return () => document.removeEventListener('selectionchange', majEtats);
  }, [majEtats]);

  function signaler() {
    const html = zone.current?.innerHTML ?? '';
    setVide(!texteDepuisHtml(html).trim());
    onChange?.(html);
  }

  function executer(commande: string, valeur?: string) {
    const el = zone.current;
    if (!el) return;
    el.focus();
    const sel = document.getSelection();
    if (selection.current && sel) {
      sel.removeAllRanges();
      sel.addRange(selection.current);
    }
    document.execCommand(commande, false, valeur);
    setOuvert(null);
    signaler();
    majEtats();
  }

  const menu = { ouvert, setOuvert };

  return (
    <div className="oh-editeur" aria-invalid={rest['aria-invalid']}>
      <div className="oh-editeur__barre" role="toolbar" aria-label="Mise en forme">
        <Bouton
          titre="Annuler (Ctrl+Z)"
          icone={<UndoOutlined />}
          onClick={() => executer('undo')}
        />
        <Bouton
          titre="Rétablir (Ctrl+Y)"
          icone={<RedoOutlined />}
          onClick={() => executer('redo')}
        />
        <Separateur />
        <Menu
          {...menu}
          cle="police"
          titre="Police"
          large
          declencheur={<span className="oh-editeur__police">{police}</span>}
        >
          <ul className="oh-editeur__liste">
            {POLICES.map((p) => (
              <li key={p.label}>
                <button
                  type="button"
                  className={p.label === police ? 'is-actif' : undefined}
                  style={{ fontFamily: p.valeur }}
                  onClick={() => {
                    setPolice(p.label);
                    executer('fontName', p.valeur);
                  }}
                >
                  {p.label}
                </button>
              </li>
            ))}
          </ul>
        </Menu>
        <Separateur />
        <Menu {...menu} cle="taille" titre="Taille" declencheur={<FontSizeOutlined />}>
          <ul className="oh-editeur__liste">
            {TAILLES.map((t) => (
              <li key={t.valeur}>
                <button
                  type="button"
                  style={{ fontSize: t.px }}
                  onClick={() => executer('fontSize', t.valeur)}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </Menu>
        <Separateur />
        <Bouton
          titre="Gras (Ctrl+B)"
          icone={<BoldOutlined />}
          actif={actifs.bold}
          onClick={() => executer('bold')}
        />
        <Bouton
          titre="Italique (Ctrl+I)"
          icone={<ItalicOutlined />}
          actif={actifs.italic}
          onClick={() => executer('italic')}
        />
        <Bouton
          titre="Souligné (Ctrl+U)"
          icone={<UnderlineOutlined />}
          actif={actifs.underline}
          onClick={() => executer('underline')}
        />
        <Menu {...menu} cle="couleur" titre="Couleur du texte" declencheur={<FontColorsOutlined />}>
          <div className="oh-editeur__couleurs">
            {COULEURS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                aria-label={`Couleur ${c}`}
                style={{ background: c }}
                onClick={() => executer('foreColor', c)}
              />
            ))}
          </div>
        </Menu>
        <Separateur />
        <Menu {...menu} cle="alignement" titre="Aligner" declencheur={<AlignLeftOutlined />}>
          <div className="oh-editeur__rangee">
            <Bouton
              titre="Aligner à gauche"
              icone={<AlignLeftOutlined />}
              onClick={() => executer('justifyLeft')}
            />
            <Bouton
              titre="Centrer"
              icone={<AlignCenterOutlined />}
              onClick={() => executer('justifyCenter')}
            />
            <Bouton
              titre="Aligner à droite"
              icone={<AlignRightOutlined />}
              onClick={() => executer('justifyRight')}
            />
          </div>
        </Menu>
        <Bouton
          titre="Liste numérotée"
          icone={<OrderedListOutlined />}
          actif={actifs.insertOrderedList}
          onClick={() => executer('insertOrderedList')}
        />
        <Bouton
          titre="Liste à puces"
          icone={<UnorderedListOutlined />}
          actif={actifs.insertUnorderedList}
          onClick={() => executer('insertUnorderedList')}
        />
        <Separateur />
        <Menu {...menu} cle="plus" titre="Plus d’options de mise en forme" declencheur={null}>
          <div className="oh-editeur__rangee">
            <Bouton
              titre="Diminuer le retrait"
              icone={<MenuFoldOutlined />}
              onClick={() => executer('outdent')}
            />
            <Bouton
              titre="Augmenter le retrait"
              icone={<MenuUnfoldOutlined />}
              onClick={() => executer('indent')}
            />
            <Bouton
              titre="Barré"
              icone={<StrikethroughOutlined />}
              actif={actifs.strikeThrough}
              onClick={() => executer('strikeThrough')}
            />
            <Bouton
              titre="Supprimer la mise en forme"
              icone={<ClearOutlined />}
              onClick={() => executer('removeFormat')}
            />
          </div>
        </Menu>
      </div>

      <div
        ref={zone}
        id={id}
        className={`oh-editeur__zone${vide ? ' is-vide' : ''}`}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Message"
        data-placeholder={placeholder}
        onInput={signaler}
        onBlur={signaler}
        onPaste={(e) => {
          e.preventDefault();
          document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
        }}
      />
    </div>
  );
}

/** Bouton qui ne prend pas le focus : la sélection reste dans le texte. */
function Bouton({
  titre,
  icone,
  onClick,
  actif,
}: {
  titre: string;
  icone: ReactNode;
  onClick: () => void;
  actif?: boolean;
}) {
  return (
    <Tooltip title={titre} mouseEnterDelay={0.4}>
      <button
        type="button"
        className={`oh-editeur__btn${actif ? ' is-actif' : ''}`}
        aria-label={titre}
        aria-pressed={actif}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
      >
        {icone}
      </button>
    </Tooltip>
  );
}

/** Menu déroulant de la barre ; un seul ouvert à la fois. */
function Menu({
  cle,
  titre,
  declencheur,
  children,
  large,
  ouvert,
  setOuvert,
}: {
  cle: string;
  titre: string;
  declencheur: ReactNode;
  children: ReactNode;
  large?: boolean;
  ouvert: string | null;
  setOuvert: (cle: string | null) => void;
}) {
  const estOuvert = ouvert === cle;
  return (
    <Popover
      open={estOuvert}
      onOpenChange={(o) => setOuvert(o ? cle : null)}
      trigger="click"
      placement="bottomLeft"
      arrow={false}
      content={<div onMouseDown={(e) => e.preventDefault()}>{children}</div>}
      styles={{ container: { padding: 6 } }}
    >
      <Tooltip title={estOuvert ? undefined : titre} mouseEnterDelay={0.4}>
        <button
          type="button"
          className={`oh-editeur__btn${large ? ' oh-editeur__btn--large' : ''}`}
          aria-label={titre}
          aria-haspopup="true"
          aria-expanded={estOuvert}
          onMouseDown={(e) => e.preventDefault()}
        >
          {declencheur}
          <CaretDownOutlined className="oh-editeur__caret" />
        </button>
      </Tooltip>
    </Popover>
  );
}

function Separateur() {
  return <span className="oh-editeur__sep" aria-hidden />;
}

const BLOCS = new Set([
  'P',
  'DIV',
  'LI',
  'BLOCKQUOTE',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'UL',
  'OL',
]);

/**
 * Version texte du HTML rédigé (partie texte de l'e-mail, aperçus, recherche). DOMParser produit un
 * document inerte : aucune image ni aucun script n'est chargé.
 */
export function texteDepuisHtml(html: string): string {
  if (!html) return '';
  if (typeof DOMParser === 'undefined') return html.replace(/<[^>]+>/g, '');
  const doc = new DOMParser().parseFromString(html, 'text/html');
  let sortie = '';
  const parcourir = (n: Node) => {
    if (n.nodeType === Node.TEXT_NODE) {
      sortie += (n.textContent ?? '').replace(/ /g, ' ');
      return;
    }
    if (!(n instanceof Element)) return;
    if (n.tagName === 'BR') {
      sortie += '\n';
      return;
    }
    const bloc = BLOCS.has(n.tagName);
    if (bloc && sortie && !sortie.endsWith('\n')) sortie += '\n';
    if (n.tagName === 'LI') {
      const parent = n.parentElement;
      sortie += parent?.tagName === 'OL' ? `${Array.from(parent.children).indexOf(n) + 1}. ` : '• ';
    }
    if (n.tagName === 'BLOCKQUOTE') {
      const avant = sortie.length;
      n.childNodes.forEach(parcourir);
      const cite = sortie.slice(avant).replace(/\n+$/, '');
      sortie =
        sortie.slice(0, avant) +
        cite
          .split('\n')
          .map((l) => `> ${l}`)
          .join('\n');
    } else {
      n.childNodes.forEach(parcourir);
    }
    if (bloc && !sortie.endsWith('\n')) sortie += '\n';
  };
  doc.body.childNodes.forEach(parcourir);
  return sortie.replace(/\n{3,}/g, '\n\n').trim();
}

/** Texte brut → HTML de l'éditeur (citation d'une réponse). */
export function htmlDepuisTexte(texte: string): string {
  return texte
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}
