import { CREATE_RATE_LIMIT } from "./config";

/** IP real del visitante detras del proxy de Vercel / Cloudflare. */
export function clientIp(req: Request): string {
  const headers = req.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip") ||
    "0.0.0.0"
  );
}

export function clientCountry(req: Request): string | undefined {
  return (
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    undefined
  );
}

export function userAgent(req: Request): string {
  return req.headers.get("user-agent") || "";
}

/**
 * Bots obvios. No es antifraude serio (eso lo hace la red publicitaria), pero
 * evita inflar tus estadisticas con crawlers y previsualizadores de enlaces
 * de WhatsApp/Discord, que son los que mas ruido meten.
 */
const BOT_RE =
  /bot|crawler|spider|crawling|facebookexternalhit|slurp|bingpreview|whatsapp|telegram|discord|preview|curl|wget|python-requests|axios|headless|phantom|lighthouse|pingdom|uptime/i;

export function looksLikeBot(ua: string): boolean {
  if (!ua || ua.length < 15) return true;
  return BOT_RE.test(ua);
}

// -----------------------------------------------------------------------------
// Rate limit en memoria.
// En serverless cada instancia tiene su propio mapa, asi que el limite real es
// por instancia. Sirve para frenar el abuso casual; si el sitio crece de verdad,
// cambia esto por Upstash Redis.
// -----------------------------------------------------------------------------

const buckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60 * 60 * 1000;

export function rateLimit(key: string, max = CREATE_RATE_LIMIT): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
    }
    return true;
  }

  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}
