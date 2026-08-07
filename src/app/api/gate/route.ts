import { NextResponse } from "next/server";
import { GATE_STEPS, GATE_TOKEN_TTL_MIN, TOTAL_STEPS } from "@/lib/config";
import { clientCountry, clientIp, looksLikeBot, userAgent } from "@/lib/request";
import { getLink, recordEvent } from "@/lib/store";
import { issueToken, readToken, visitorHash } from "@/lib/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Motor de la pagina puente.
 *
 * El destino real NUNCA viaja en el HTML: solo se entrega aqui, y solo despues
 * de que el visitante haya pasado todos los pasos. Cada paso va firmado con
 * HMAC e incluye el instante de emision, asi que el servidor puede comprobar
 * que el tiempo de espera transcurrio de verdad. Sin esto, cualquiera abriria
 * las DevTools, leeria la URL final y tus anuncios no se verian nunca.
 */

/** Margen para el desfase de reloj y la latencia de red. */
const SLACK_MS = 700;

type Body = { code?: string; step?: number; token?: string };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Peticion invalida." }, { status: 400 });
  }

  const code = (body.code ?? "").trim();
  const step = Number(body.step ?? 0);

  if (!code || !Number.isInteger(step) || step < 0 || step > TOTAL_STEPS) {
    return NextResponse.json({ error: "Peticion invalida." }, { status: 400 });
  }

  const link = await getLink(code);
  if (!link) {
    return NextResponse.json({ error: "Enlace no encontrado." }, { status: 404 });
  }
  if (!link.active) {
    return NextResponse.json({ error: "Este enlace fue desactivado." }, { status: 410 });
  }

  const ua = userAgent(req);
  const ip = clientIp(req);
  const vid = visitorHash(ip, ua);
  const isBot = looksLikeBot(ua);

  // ---------------------------------------------------------------------------
  // Paso 0: el visitante acaba de abrir la pagina puente.
  // ---------------------------------------------------------------------------
  if (step === 0) {
    if (!isBot) {
      await recordEvent(code, "view", {
        visitorHash: vid,
        country: clientCountry(req),
        referer: req.headers.get("referer") ?? undefined,
      });
    }

    return NextResponse.json({
      token: issueToken({ c: code, s: 0, t: Date.now(), v: vid }),
      wait: GATE_STEPS[0],
      step: 0,
      totalSteps: TOTAL_STEPS,
      done: false,
    });
  }

  // ---------------------------------------------------------------------------
  // Pasos siguientes: hay que presentar el token del paso anterior.
  // ---------------------------------------------------------------------------
  const payload = readToken(body.token ?? "");
  if (!payload) {
    return NextResponse.json({ error: "Sesion invalida. Recarga la pagina." }, { status: 403 });
  }

  if (payload.c !== code || payload.v !== vid || payload.s !== step - 1) {
    return NextResponse.json({ error: "Sesion invalida. Recarga la pagina." }, { status: 403 });
  }

  const elapsed = Date.now() - payload.t;

  if (elapsed > GATE_TOKEN_TTL_MIN * 60_000) {
    return NextResponse.json({ error: "La sesion expiro. Recarga la pagina." }, { status: 403 });
  }

  const required = GATE_STEPS[payload.s] * 1000;
  if (elapsed + SLACK_MS < required) {
    // Alguien intento saltarse la espera llamando a la API antes de tiempo.
    return NextResponse.json(
      { error: "Todavia no. Espera a que termine la cuenta atras." },
      { status: 425 }
    );
  }

  // Paso intermedio: siguiente tanda de anuncios.
  if (step < TOTAL_STEPS) {
    return NextResponse.json({
      token: issueToken({ c: code, s: step, t: Date.now(), v: vid }),
      wait: GATE_STEPS[step],
      step,
      totalSteps: TOTAL_STEPS,
      done: false,
    });
  }

  // Ultimo paso: entregamos el destino.
  if (!isBot) {
    await recordEvent(code, "complete", { visitorHash: vid, country: clientCountry(req) });
  }

  return NextResponse.json({
    destination: link.destination,
    step,
    totalSteps: TOTAL_STEPS,
    done: true,
  });
}
