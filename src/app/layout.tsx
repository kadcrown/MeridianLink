import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MeridianLink - Amazon Affiliate Smart-Link & Geo-Routing Engine',
  description: 'Precision geo-routing and localized smart-link management for Amazon Associates.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
