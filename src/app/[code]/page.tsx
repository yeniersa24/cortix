import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GateFlow } from "@/components/GateFlow";
import { getLink } from "@/lib/store";
import { safeHost } from "@/lib/url";

export const runtime = "nodejs";
/** Nunca cachear: el destino no debe quedarse en ningun CDN intermedio. */
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const link = await getLink(code);

  return {
    title: link?.title || "Redirigiendo",
    description: link ? `Continua hacia ${safeHost(link.destination)}` : "Enlace no encontrado",
    // Nada de indexar paginas puente: es contenido sin valor para un buscador
    // y las redes publicitarias lo miran con lupa.
    robots: { index: false, follow: false },
  };
}

export default async function GatePage({ params }: Props) {
  const { code } = await params;
  const link = await getLink(code);

  if (!link) notFound();

  if (!link.active) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Enlace desactivado</h1>
        <p className="mt-3 text-slate-400">
          Quien lo creo lo puso en pausa. Pide un enlace nuevo a la persona que te lo compartio.
        </p>
      </div>
    );
  }

  // Al componente cliente solo le pasamos el dominio del destino, nunca la URL
  // completa: si viajara en el HTML, cualquiera la leeria en el codigo fuente y
  // se saltaria la pagina puente (y con ella, los anuncios).
  return <GateFlow code={link.code} host={safeHost(link.destination)} title={link.title} />;
}
