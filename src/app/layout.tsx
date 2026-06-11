import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

export const metadata: Metadata = {
  metadataBase: new URL("https://idiomaconnect.com"),
  title: {
    default: "IdiomaConnect — App para aprender inglés para niños y adolescentes",
    template: "%s | IdiomaConnect",
  },
  description:
    "La app de inglés con tutor de IA que conoce a tu familia: lecciones personalizadas, conversación, pronunciación y juegos para niños y adolescentes de 8 a 18 años. Niveles A1 a C2 (CEFR). Planes familiares y para colegios.",
  keywords: [
    "app de inglés",
    "app para aprender inglés",
    "aprender inglés niños",
    "inglés para niños",
    "inglés para adolescentes",
    "tutor de inglés",
    "tutor de inglés online",
    "profesor de inglés online",
    "clases de inglés para niños",
    "curso de inglés online",
    "inglés CEFR",
    "inglés para colegios",
    "IdiomaConnect",
  ],
  applicationName: "IdiomaConnect",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://idiomaconnect.com",
    siteName: "IdiomaConnect",
    title: "IdiomaConnect — App para aprender inglés para niños y adolescentes",
    description:
      "El tutor de inglés con IA que conoce a tu familia. Lecciones personalizadas para niños de 8 a 18 años, niveles A1-C2. Planes familiares y para colegios.",
    locale: "es_CL",
  },
  twitter: {
    card: "summary",
    title: "IdiomaConnect — App para aprender inglés para niños y adolescentes",
    description:
      "El tutor de inglés con IA que conoce a tu familia. Niños de 8 a 18 años, niveles A1-C2.",
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "IdiomaConnect",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#101417",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Source+Sans+3:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
