import { BLOCKED_HOSTS, SITE_URL } from "./config";

/** Rangos privados / loopback: no queremos que el acortador apunte hacia dentro. */
const PRIVATE_PATTERNS: RegExp[] = [
  /^localhost$/i,
  /\.local$/i,
  /\.internal$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^0\./,
  /^\[?::1\]?$/,
  /^\[?f[cd][0-9a-f]{2}:/i,
];

export type UrlCheck = { ok: true; url: string } | { ok: false; error: string };

export function normalizeDestination(raw: string): UrlCheck {
  const input = (raw || "").trim();

  if (!input) return { ok: false, error: "Pega un enlace primero." };
  if (input.length > 2048) return { ok: false, error: "El enlace es demasiado largo." };

  // Si no trae protocolo asumimos https, que es lo que la gente espera al pegar
  // "ejemplo.com" en la caja.
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(input) ? input : `https://${input}`;

  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    return { ok: false, error: "Ese enlace no es valido." };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: "Solo se permiten enlaces http y https." };
  }

  const host = url.hostname.toLowerCase();

  if (PRIVATE_PATTERNS.some((p) => p.test(host))) {
    return { ok: false, error: "No se permiten direcciones internas o privadas." };
  }

  if (BLOCKED_HOSTS.some((b) => host === b || host.endsWith(`.${b}`))) {
    return { ok: false, error: "Ese dominio esta bloqueado." };
  }

  // Evita el bucle infinito de acortar tu propio acortador.
  try {
    const own = new URL(SITE_URL).hostname.toLowerCase();
    if (own && host === own) {
      return { ok: false, error: "No puedes acortar un enlace de este mismo sitio." };
    }
  } catch {
    /* SITE_URL mal formado: lo ignoramos, no es motivo para rechazar */
  }

  return { ok: true, url: url.toString() };
}

const CODE_RE = /^[a-zA-Z0-9_-]{3,32}$/;

/** Rutas propias de la app que no pueden usarse como codigo corto. */
const RESERVED = new Set([
  "api", "admin", "dashboard", "panel", "stats", "about", "terms", "privacy",
  "login", "signup", "static", "_next", "favicon.ico", "robots.txt", "ads.txt",
  "sitemap.xml", "sw.js",
]);

export function validateCustomCode(code: string): { ok: true } | { ok: false; error: string } {
  if (!CODE_RE.test(code)) {
    return { ok: false, error: "El alias debe tener 3-32 caracteres (letras, numeros, - y _)." };
  }
  if (RESERVED.has(code.toLowerCase())) {
    return { ok: false, error: "Ese alias esta reservado, elige otro." };
  }
  return { ok: true };
}

// Aqui vivia safeHost(), que sacaba el dominio del destino para enseñarselo al
// visitante en la pagina puente. Se elimino al decidir no revelar a donde va el
// enlace: sin nadie que lo llame, dejarlo seria codigo muerto.
