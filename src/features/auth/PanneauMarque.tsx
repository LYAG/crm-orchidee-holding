import { CalendarOutlined, ReadOutlined, RiseOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import Image from 'next/image';

const { Title, Text } = Typography;

const ATOUTS = [
  {
    icone: <CalendarOutlined />,
    titre: 'Terrain',
    texte: 'Professionnels de santé, rendez-vous et ordres de mission.',
  },
  {
    icone: <RiseOutlined />,
    titre: 'Performance',
    texte: 'Opportunités, objectifs et reporting de vos équipes.',
  },
  {
    icone: <ReadOutlined />,
    titre: 'Formation',
    texte: 'Parcours, quiz et suivi de la montée en compétences.',
  },
];

/** Panneau de marque des pages d'accès (connexion, création de mot de passe) ; masqué sur mobile. */
export function PanneauMarque() {
  const annee = new Date().getFullYear();
  return (
    <aside className="oh-login__brand">
      <div className="oh-login__marque">
        <Image
          src="/images/logo-saphir-vert.png"
          alt=""
          width={44}
          height={44}
          priority
          className="oh-login__logo"
        />
        <span className="oh-login__marque-texte">
          <strong>Saphir OH</strong>
          <span>Orchidée Holding</span>
        </span>
      </div>

      <div className="oh-login__accroche">
        <Title level={1} className="oh-login__title">
          Votre activité commerciale, réunie en un seul espace.
        </Title>
        <Text className="oh-login__lead">
          Le CRM des équipes d’Orchidée Holding : du terrain au reporting, chaque collaborateur
          retrouve ce dont il a besoin.
        </Text>
        <ul className="oh-login__atouts">
          {ATOUTS.map((a) => (
            <li key={a.titre}>
              <span className="oh-login__atout-icone" aria-hidden>
                {a.icone}
              </span>
              <span>
                <strong>{a.titre}</strong>
                <span>{a.texte}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Text className="oh-login__legal">© {annee} Orchidée Holding — Usage interne</Text>
    </aside>
  );
}
