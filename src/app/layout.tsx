
import type {Metadata} from 'next';
import { Inter, Cinzel_Decorative } from 'next/font/google'
import './globals.css';
import { Toaster as ToasterContainer } from 'react-hot-toast';
import { AuthProvider } from '@/hooks/use-auth';
import { PlayerDataProvider } from '@/hooks/use-player-data';
import { PlayerDataSync } from '@/hooks/use-player-data-sync';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const cinzel = Cinzel_Decorative({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  display: 'swap',
  variable: '--font-cinzel',
})

export const metadata: Metadata = {
  title: 'SISTEMA DE VIDA',
  description: 'Inicializando interface...',
  manifest: '/manifest.json',
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
       <head>
        <meta name="application-name" content="SISTEMA DE VIDA" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SISTEMA" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0d1117" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={cn("antialiased font-sans", inter.variable, cinzel.variable)}>
        <AuthProvider>
            <PlayerDataProvider>
              <PlayerDataSync />
              {children}
            </PlayerDataProvider>
        </AuthProvider>
        <ToasterContainer 
          position="bottom-right"
          toastOptions={{
            className: '',
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              border: '1px solid hsl(var(--border))',
            },
          }}
        />
      </body>
    </html>
  );
}
