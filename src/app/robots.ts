import type { MetadataRoute } from "next";

/** Reglas para los buscadores: indexar lo público, nunca lo privado. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin", "/parent", "/account/", "/worlds", "/profiles", "/school-admin", "/teacher", "/aula", "/billing", "/demo", "/afiliados"],
      },
    ],
    sitemap: "https://idiomaconnect.com/sitemap.xml",
  };
}
