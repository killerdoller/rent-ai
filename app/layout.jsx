import './globals.css';
import { Fraunces, Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap', axes: ['SOFT','WONK','opsz'], weight: 'variable' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata = {
  title: 'RentAI | Encuentra tu hogar en pocos clicks',
  description: 'Optimiza tu búsqueda de arriendo con Inteligencia Artificial. Encuentra apartamentos rankeados por match con tu estilo de vida.',
  openGraph: {
    title: 'RentAI | El futuro del arriendo con IA',
    description: 'Dile a la IA qué necesitas. Nosotros encontramos el match perfecto para ti.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: [
      { url: '/icon_square.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon_square.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icon_square.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <ClerkProvider dynamic>
          <div id="root">
            {children}
          </div>
          {/* Requerido para la protección contra bots en flujos personalizados de Clerk.
              Ubicado en el layout raíz para asegurar disponibilidad global. */}
          <div id="clerk-captcha" style={{ display: "flex", justifyContent: "center", marginTop: 10 }} />
        </ClerkProvider>
      </body>
    </html>
  );
}
