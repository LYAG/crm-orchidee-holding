'use client';

import { Skeleton } from 'antd';

interface StatCardProps {
  loading?: boolean;
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  formatter?: (v: number) => string;
  /** Couleur sémantique de l'indicateur (icône, alerte). */
  accent: string;
  /** Fond de la pastille d'icône. */
  bg: string;
  /** Met la carte en évidence lorsque la valeur est non nulle. */
  alert?: boolean;
}

/** Carte d'indicateur clé partagée par les tableaux de bord. */
export function StatCard({
  loading = false,
  icon,
  label,
  value,
  suffix,
  formatter,
  accent,
  bg,
  alert,
}: StatCardProps) {
  const enAlerte = Boolean(alert && value > 0);
  const displayed = formatter ? formatter(value) : value.toLocaleString('fr-FR');

  return (
    <div className="oh-stat" data-alert={enAlerte || undefined} style={{ ['--oh-stat-accent' as string]: accent }}>
      {loading ? (
        <Skeleton active title={false} paragraph={{ rows: 2, width: ['60%', '40%'] }} />
      ) : (
        <>
          <div className="oh-stat__head">
            <span className="oh-stat__label">{label}</span>
            <span className="oh-stat__icon" style={{ background: bg, color: accent }} aria-hidden>
              {icon}
            </span>
          </div>
          <div className="oh-stat__value">
            {displayed}
            {suffix && <span className="oh-stat__suffix">{suffix}</span>}
          </div>
          {enAlerte && <span className="oh-stat__flag">Action requise</span>}
        </>
      )}
    </div>
  );
}
