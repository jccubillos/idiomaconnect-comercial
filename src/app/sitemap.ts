import type { MetadataRoute } from "next";

/** Mapa del sitio para los buscadores (solo páginas públicas). */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://idiomaconnect.com";
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/colegios`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/contacto`, changeFrequency: "yearly", priority: 0.5 },
    // /afiliados queda FUERA del sitemap a propósito: es una página "no listada"
    // (reclutamiento de afiliados), no debe indexarse ni encontrarla un cliente.
    { url: `${base}/signup`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/login`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
