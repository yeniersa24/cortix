import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/config";
import { deleteLink, getStats, setActive } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function tokensMatch(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

type Ctx = { params: Promise<{ code: string }> };

/** Estadisticas de un enlace. Requiere el owner token que se dio al crearlo. */
export async function GET(req: Request, ctx: Ctx) {
  const { code } = await ctx.params;
  const token = new URL(req.url).searchParams.get("token") ?? "";

  const stats = await getStats(code);
  if (!stats) return NextResponse.json({ error: "Enlace no encontrado." }, { status: 404 });

  if (!token || !tokensMatch(token, stats.link.ownerToken)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { link, uniques, daily } = stats;
  return NextResponse.json({
    code: link.code,
    shortUrl: `${SITE_URL}/${link.code}`,
    destination: link.destination,
    title: link.title,
    active: link.active,
    createdAt: link.createdAt,
    views: link.views,
    completions: link.completions,
    uniques,
    daily,
  });
}

/** Activar o desactivar el enlace. */
export async function PATCH(req: Request, ctx: Ctx) {
  const { code } = await ctx.params;

  let body: { token?: string; active?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Peticion invalida." }, { status: 400 });
  }

  const stats = await getStats(code);
  if (!stats) return NextResponse.json({ error: "Enlace no encontrado." }, { status: 404 });
  if (!body.token || !tokensMatch(body.token, stats.link.ownerToken)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  await setActive(code, body.active !== false);
  return NextResponse.json({ ok: true, active: body.active !== false });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const { code } = await ctx.params;
  const token = new URL(req.url).searchParams.get("token") ?? "";

  const stats = await getStats(code);
  if (!stats) return NextResponse.json({ error: "Enlace no encontrado." }, { status: 404 });
  if (!token || !tokensMatch(token, stats.link.ownerToken)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  await deleteLink(code);
  return NextResponse.json({ ok: true });
}
