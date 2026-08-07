import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/config";
import { clientIp, rateLimit } from "@/lib/request";
import { codeExists, createLink } from "@/lib/store";
import { randomCode, randomToken } from "@/lib/token";
import { normalizeDestination, validateCustomCode } from "@/lib/url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = clientIp(req);

  if (!rateLimit(`create:${ip}`)) {
    return NextResponse.json(
      { error: "Has creado demasiados enlaces en poco tiempo. Espera un rato." },
      { status: 429 }
    );
  }

  let body: { url?: string; alias?: string; title?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Peticion invalida." }, { status: 400 });
  }

  const checked = normalizeDestination(body.url ?? "");
  if (!checked.ok) {
    return NextResponse.json({ error: checked.error }, { status: 400 });
  }

  let code: string;
  const alias = (body.alias ?? "").trim();

  if (alias) {
    const valid = validateCustomCode(alias);
    if (!valid.ok) return NextResponse.json({ error: valid.error }, { status: 400 });
    if (await codeExists(alias)) {
      return NextResponse.json({ error: "Ese alias ya esta en uso." }, { status: 409 });
    }
    code = alias;
  } else {
    // Reintentamos por si hay colision de codigo aleatorio.
    code = randomCode();
    for (let i = 0; i < 5 && (await codeExists(code)); i++) code = randomCode(8);
    if (await codeExists(code)) {
      return NextResponse.json(
        { error: "No se pudo generar un codigo libre, intenta de nuevo." },
        { status: 500 }
      );
    }
  }

  const ownerToken = randomToken();
  const title = (body.title ?? "").trim().slice(0, 120) || null;

  try {
    const link = await createLink({
      code,
      destination: checked.url,
      title,
      ownerToken,
      createdIp: ip,
    });

    return NextResponse.json({
      code: link.code,
      shortUrl: `${SITE_URL}/${link.code}`,
      destination: link.destination,
      title: link.title,
      // El cliente lo guarda en localStorage: es la unica forma de volver a ver
      // las estadisticas de este enlace o de borrarlo.
      ownerToken,
      createdAt: link.createdAt,
    });
  } catch (error) {
    console.error("[cortix] shorten:", error);
    return NextResponse.json(
      { error: "No se pudo guardar el enlace. Revisa la configuracion de la base de datos." },
      { status: 500 }
    );
  }
}
