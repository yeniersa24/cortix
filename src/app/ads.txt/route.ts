/**
 * ads.txt: la lista de quien tiene permiso para vender tu inventario. Monetag
 * (y practicamente cualquier red) te da unas lineas para pegar aqui, y sin
 * ellas muchos anunciantes no pujan por tus impresiones, lo que te baja el CPM.
 *
 * Pega el bloque que te den en la variable ADS_TXT (los saltos de linea con \n).
 */
export const dynamic = "force-static";

export function GET() {
  const content = (process.env.ADS_TXT || "").replace(/\\n/g, "\n").trim();

  return new Response(content ? `${content}\n` : "# Sin entradas ads.txt configuradas\n", {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
