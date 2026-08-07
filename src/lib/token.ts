import crypto from "node:crypto";
import { readEnv } from "./env";

/**
 * Se resuelve al usarlo, no al importar el modulo: si fallara en tiempo de
 * import romperia el `next build` en entornos donde las variables aun no estan.
 * En produccion sin APP_SECRET cualquiera podria falsificar tokens y saltarse
 * la pagina puente, que es justo de donde sale el dinero, asi que ahi si falla.
 */
function secret(): string {
  const value = readEnv("APP_SECRET");
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Falta APP_SECRET en las variables de entorno.");
  }
  return "dev-secret-no-usar-en-produccion";
}

export type GatePayload = {
  /** codigo corto del enlace */
  c: string;
  /** paso ya completado (0 = acaba de abrir la pagina) */
  s: number;
  /** emitido en (ms epoch) */
  t: number;
  /** huella del visitante, para que un token no sirva en otro navegador */
  v: string;
};

function sign(body: string): string {
  return crypto.createHmac("sha256", secret()).update(body).digest("base64url");
}

export function issueToken(payload: GatePayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function readToken(token: string): GatePayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [body, sig] = parts;
  const expected = sign(body);

  // Comparacion en tiempo constante: evita filtrar la firma byte a byte.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString()) as GatePayload;
  } catch {
    return null;
  }
}

/** Token secreto que le damos al creador para consultar y borrar su enlace. */
export function randomToken(bytes = 24): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Codigo corto sin caracteres ambiguos (0/O, 1/l/I). */
export function randomCode(length = 7): string {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/**
 * Huella no reversible del visitante. Sirve para contar visitas unicas y para
 * atar un token a un navegador sin guardar la IP en claro.
 */
export function visitorHash(ip: string, userAgent: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return crypto
    .createHmac("sha256", secret())
    .update(`${ip}|${userAgent}|${day}`)
    .digest("base64url")
    .slice(0, 22);
}
