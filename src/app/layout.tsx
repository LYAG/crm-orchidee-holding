import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import AntdProvider from '@/config/AntdProvider';
import { AuthProvider } from '@/features/auth/AuthContext';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CRM Orchidée Holding',
  description: 'CRM B2B — Orchidée Holding',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr-FR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AntdProvider>
          <AuthProvider>{children}</AuthProvider>
        </AntdProvider>
      </body>
    </html>
  );
}
