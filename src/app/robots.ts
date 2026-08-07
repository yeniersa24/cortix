import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/terminos", "/privacidad"],
        // Las paginas puente no aportan nada a un buscador y cargarlas desde un
        // crawler solo ensucia las metricas de la red publicitaria.
        disallow: ["/api/", "/admin", "/dashboard"],
      },
    ],
    host: SITE_URL,
  };
}
