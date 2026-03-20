import './globals.css';

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
      { url: '/Logo_finalfinal.png', sizes: '32x32', type: 'image/png' },
      { url: '/Logo_finalfinal.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/Logo_finalfinal.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  );
}
