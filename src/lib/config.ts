/**
 * Configuracion central. Todo se controla por variables de entorno para que
 * puedas cambiar zonas de anuncios o tiempos de espera sin tocar codigo.
 */

function num(value: string | undefined, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Segundos de espera de cada paso de la pagina puente.
 * "8,8" = dos pasos de 8 segundos = dos tandas de impresiones por visita.
 * Mas pasos = mas impresiones, pero mas gente abandona. 2 pasos es el punto
 * dulce que usan la mayoria de acortadores.
 */
export const GATE_STEPS: number[] = (process.env.GATE_STEPS || "8,8")
  .split(",")
  .map((s) => Math.min(60, Math.max(0, num(s.trim(), 8))));

export const TOTAL_STEPS = GATE_STEPS.length;

/** Ventana maxima de vida de un token de paso (minutos). */
export const GATE_TOKEN_TTL_MIN = num(process.env.GATE_TOKEN_TTL_MIN, 30);

/** Cuantos enlaces puede crear una misma IP por hora. */
export const CREATE_RATE_LIMIT = num(process.env.CREATE_RATE_LIMIT, 30);

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Cortix";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
  "http://localhost:3000"
).replace(/\/$/, "");

/** Dominios que nunca se permiten como destino (malware, phishing, loops). */
export const BLOCKED_HOSTS: string[] = (process.env.BLOCKED_HOSTS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

/** Password del panel /admin (vista global de todos los enlaces). */
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
