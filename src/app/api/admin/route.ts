import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { ADMIN_PASSWORD, SITE_URL } from "@/lib/config";
import { clientIp, rateLimit } from "@/lib/request";
import { deleteLink, listAllLinks, setActive } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** La password llega siempre en el cuerpo, nunca en la URL. */
function checkPassword(candidate: string): boolean {
  if (!ADMIN_PASSWORD) return false;
  const a = crypto.createHash("sha256").update(candidate).digest();
  const b = crypto.createHash("sha256").update(ADMIN_PASSWORD).digest();
  return crypto.timingSafeEqual(a, b);
}

type Body = {
  password?: string;
  action?: "list" | "toggle" | "delete";
  code?: string;
  active?: boolean;
};

export async function POST(req: Request) {
  if (!ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "El panel de admin esta desactivado: define ADMIN_PASSWORD." },
      { status: 503 }
    );
  }

  // Freno a la fuerza bruta contra la password.
  if (!rateLimit(`admin:${clientIp(req)}`, 20)) {
    return NextResponse.json({ error: "Demasiados intentos. Espera un rato." }, { status: 429 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Peticion invalida." }, { status: 400 });
  }

  if (!checkPassword(body.password ?? "")) {
    return NextResponse.json({ error: "Password incorrecta." }, { status: 401 });
  }

  switch (body.action) {
    case "toggle": {
      if (!body.code) return NextResponse.json({ error: "Falta el codigo." }, { status: 400 });
      await setActive(body.code, body.active !== false);
      break;
    }
    case "delete": {
      if (!body.code) return NextResponse.json({ error: "Falta el codigo." }, { status: 400 });
      await deleteLink(body.code);
      break;
    }
  }

  const links = await listAllLinks();
  const totals = links.reduce(
    (acc, l) => ({
      views: acc.views + l.views,
      completions: acc.completions + l.completions,
    }),
    { views: 0, completions: 0 }
  );

  return NextResponse.json({
    totals: { links: links.length, ...totals },
    links: links.map((l) => ({
      code: l.code,
      shortUrl: `${SITE_URL}/${l.code}`,
      destination: l.destination,
      title: l.title,
      active: l.active,
      views: l.views,
      completions: l.completions,
      createdAt: l.createdAt,
    })),
  });
}
