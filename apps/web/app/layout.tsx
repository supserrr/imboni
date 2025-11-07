import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Imboni Vision Assistant',
  description: 'AI-powered visual assistance with optional human support.',
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
