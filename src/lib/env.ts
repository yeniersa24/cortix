/**
 * Lectura saneada de variables de entorno.
 *
 * Por que existe esto: un valor puede llegar con basura invisible pegada. Los
 * casos reales que nos han mordido:
 *
 *   - BOM (U+FEFF) al principio, si el valor paso por un archivo o una tuberia
 *     de Windows codificada en UTF-8 con marca de orden de bytes.
 *   - Saltos de linea o espacios al final, lo mas comun de todo: copiar la
 *     clave del panel de Supabase y pegarla en un formulario.
 *
 * Con una clave de API el sintoma es brutal y poco obvio: la libreria la mete
 * en una cabecera HTTP, y una cabecera solo admite bytes 0-255. Un BOM revienta
 * con "Cannot convert argument to a ByteString" y tumba todas las peticiones
 * con un 500, sin ninguna pista de que el culpable es un caracter que no se ve.
 *
 * Los caracteres se identifican por su codigo numerico y no por su literal: uno
 * invisible escrito tal cual dentro del codigo fuente seria imposible de leer y
 * de mantener.
 *
 * SOLO PARA CODIGO DE SERVIDOR. Aqui se accede a process.env con una clave
 * dinamica, y Next.js solo sustituye las variables NEXT_PUBLIC_ en el bundle
 * del navegador cuando las encuentra escritas literalmente
 * (`process.env.NEXT_PUBLIC_ALGO`). Si usaras readEnv en un componente cliente,
 * el valor llegaria vacio. Por eso config.ts y ads.ts, que si viajan al
 * navegador, siguen leyendolas de forma literal.
 */

const INVISIBLE_CODE_POINTS = new Set([
  0xfeff, // BOM / zero width no-break space
  0x200b, // zero width space
  0x200c, // zero width non-joiner
  0x200d, // zero width joiner
  0x2060, // word joiner
]);

export function readEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (raw === undefined) return undefined;

  let clean = "";
  for (const char of raw) {
    if (!INVISIBLE_CODE_POINTS.has(char.codePointAt(0) ?? 0)) clean += char;
  }
  clean = clean.trim();

  return clean === "" ? undefined : clean;
}
