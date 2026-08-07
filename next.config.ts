import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        // La pagina puente debe poder cargar los scripts de la red publicitaria,
        // por eso no se le aplica una CSP restrictiva. Lo que si bloqueamos en
        // todo el sitio es que nos metan dentro de un iframe ajeno (clickjacking
        // e impresiones falsas, que es motivo de baneo en las redes de ads).
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer-when-downgrade" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
