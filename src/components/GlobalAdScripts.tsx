import { AD_GLOBAL_SNIPPETS, AD_POPUNDER_ENABLED, AD_POPUNDER_SNIPPET } from "@/lib/ads";

/**
 * Scripts de anuncio que se colocan solos (In-Page Push, Vignette, Interstitial,
 * MultiTag) y el popunder si esta activado.
 *
 * Esto es un componente de SERVIDOR a proposito. El snippet se escribe dentro
 * del HTML que sale del servidor, cerca de la apertura de <body>, y es el propio
 * navegador quien lo interpreta y lo ejecuta mientras parsea la pagina.
 *
 * Antes se inyectaba desde el cliente al montar un componente, lo que funcionaba
 * pero cargaba tarde: habia que esperar al JavaScript de React y a la
 * hidratacion. En un acortador mucha gente entra y se va en el primer segundo,
 * asi que ese retraso son impresiones que no se llegan a contar. Servirlo desde
 * el servidor es tambien donde las redes publicitarias esperan encontrarlo.
 *
 * Nota sobre dangerouslySetInnerHTML: aqui SI ejecuta los <script>, porque el
 * navegador los recibe como parte del documento. Lo que no funciona es insertar
 * HTML con scripts desde el cliente ya en marcha; para ese caso esta el inyector
 * manual de AdSlot, que los recrea nodo a nodo.
 */
export function GlobalAdScripts() {
  const snippets = [...AD_GLOBAL_SNIPPETS];

  if (AD_POPUNDER_ENABLED && AD_POPUNDER_SNIPPET) {
    snippets.push(AD_POPUNDER_SNIPPET);
  }

  if (snippets.length === 0) return null;

  return (
    <div
      // React no toca el contenido de un nodo con dangerouslySetInnerHTML al
      // hidratar, asi que no vuelve a ejecutar nada ni duplica impresiones.
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: snippets.join("\n") }}
    />
  );
}
