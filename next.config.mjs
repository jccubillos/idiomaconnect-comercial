/** @type {import('next').NextConfig} */

// Cabeceras de seguridad aplicadas a TODAS las respuestas.
// Defensa en profundidad: clickjacking, MIME-sniffing, fuga de referer,
// y restricción de APIs del navegador (micrófono permitido para pronunciación).
const securityHeaders = [
  // Fuerza HTTPS durante 2 años, incluidos subdominios (efectivo en producción).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Impide que la app se cargue dentro de un <iframe> (anti-clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Impide que el navegador "adivine" tipos MIME (anti-XSS por content-sniffing).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // No filtrar la URL completa como referer a sitios externos.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Solo permitimos micrófono (pronunciación); cámara/geo/pagos bloqueados.
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), payment=(), usb=()" },
  // CSP mínima y segura: bloquea embebido en frames, inyección de <base> y plugins.
  // (No restringe script/style para no romper Next.js; el resto de directivas son seguras.)
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // no revelar "X-Powered-By: Next.js"
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "raw.githubusercontent.com" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
