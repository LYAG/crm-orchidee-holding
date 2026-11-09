'use client';

import { SearchOutlined } from '@ant-design/icons';
import { Empty, Input, Result, Typography } from 'antd';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { getMenuRoutes, type MenuRoute } from '@/config/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePermissionModules } from '@/hooks/usePermission';
import type { UserRole } from '@/lib/constants';

const { Title, Text } = Typography;

const normaliser = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/**
 * Accueil des Paramètres, à la manière des Paramètres Windows : une tuile par page accessible
 * au rôle courant (mêmes règles que le menu : rôles en dur + matrice Rôles & permissions).
 */
export function ParametresAccueilPage() {
  const { user } = useAuth();
  const modules = usePermissionModules();
  const [recherche, setRecherche] = useState('');

  const pages: MenuRoute[] = useMemo(
    () =>
      user && modules
        ? (getMenuRoutes(user.role as UserRole, modules).routes.find(
            (r) => r.path === '/parametres',
          )?.routes ?? [])
        : [],
    [user, modules],
  );

  const filtre = normaliser(recherche.trim());
  const visibles = filtre
    ? pages.filter((p) => normaliser(`${p.name} ${p.description ?? ''}`).includes(filtre))
    : pages;

  if (!user || !modules) return null;
  if (pages.length === 0) {
    return (
      <Result
        status="403"
        title="Accès refusé"
        subTitle="Aucune page de paramètres n'est accessible à votre rôle."
      />
    );
  }

  return (
    <div className="oh-parametres">
      <Title level={2} className="oh-parametres__titre">
        Paramètres
      </Title>
      <Input
        className="oh-parametres__recherche"
        size="large"
        allowClear
        autoFocus
        placeholder="Rechercher un paramètre"
        suffix={<SearchOutlined style={{ color: 'var(--oh-ink-3)' }} />}
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
      />
      {visibles.length === 0 ? (
        <Empty description="Aucun paramètre ne correspond à la recherche." />
      ) : (
        <nav className="oh-parametres__grille" aria-label="Paramètres">
          {visibles.map((p) => (
            <Link key={p.path} href={p.path} className="oh-parametres__tuile">
              <span className="oh-parametres__icone" aria-hidden>
                {p.icon}
              </span>
              <Text strong className="oh-parametres__nom">
                {p.name}
              </Text>
              {p.description && (
                <Text type="secondary" className="oh-parametres__description">
                  {p.description}
                </Text>
              )}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
