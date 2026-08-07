/**
 * Configuracion de anuncios.
 *
 * La idea del proyecto: cobrar por IMPRESIONES (CPM), no por clics. Por eso
 * todos los formatos de aqui son de los que Monetag paga por vista:
 *
 *   - Banner            -> CPM. El clasico 300x250 / 728x90 dentro de la pagina.
 *   - In-Page Push      -> CPM. Notificacion en una esquina, no tapa el contenido.
 *   - Vignette Banner   -> CPM. Pantalla completa con boton de cerrar visible.
 *   - Interstitial      -> CPM. Igual que el anterior pero entre transiciones.
 *   - Popunder          -> el que mas paga y el mas molesto. Apagado por defecto.
 *
 * Como se rellena: en Monetag creas una zona por formato, copias el snippet
 * que te dan y lo pegas TAL CUAL en la variable de entorno correspondiente
 * (ver .env.local.example). No hay que tocar codigo.
 *
 * Ojo con el nombre NEXT_PUBLIC_: estas variables acaban en el navegador, que
 * es justo lo que queremos aqui (son scripts de terceros). Nunca pongas una
 * clave secreta con ese prefijo.
 */

export type AdSlotName =
  | "gateTop"
  | "gateMiddle"
  | "gateBottom"
  | "gateSide"
  | "home";

/** Snippet HTML por slot. Un slot vacio simplemente no se pinta. */
export const AD_SNIPPETS: Record<AdSlotName, string> = {
  gateTop: process.env.NEXT_PUBLIC_AD_GATE_TOP || "",
  gateMiddle: process.env.NEXT_PUBLIC_AD_GATE_MIDDLE || "",
  gateBottom: process.env.NEXT_PUBLIC_AD_GATE_BOTTOM || "",
  gateSide: process.env.NEXT_PUBLIC_AD_GATE_SIDE || "",
  home: process.env.NEXT_PUBLIC_AD_HOME || "",
};

/**
 * Scripts que se cargan una sola vez por pagina y se posicionan solos
 * (In-Page Push, Vignette, Interstitial, MultiTag).
 *
 * Hay varias ranuras porque estos formatos se combinan: lo normal es llevar
 * In-Page Push y Vignette a la vez, y son dos snippets distintos. Cada zona de
 * Monetag va en su propia variable; las vacias se ignoran.
 */
export const AD_GLOBAL_SNIPPETS: string[] = [
  process.env.NEXT_PUBLIC_AD_GLOBAL || "",
  process.env.NEXT_PUBLIC_AD_GLOBAL_2 || "",
  process.env.NEXT_PUBLIC_AD_GLOBAL_3 || "",
].filter(Boolean);

/**
 * Popunder: abre una pestana detras al primer clic. Es el formato que mas
 * ingresa, pero rompe la promesa de "no invasivo" y dispara los bloqueadores.
 * Ponlo en "true" solo si decides que compensa.
 */
export const AD_POPUNDER_ENABLED = process.env.NEXT_PUBLIC_AD_POPUNDER === "true";
export const AD_POPUNDER_SNIPPET = process.env.NEXT_PUBLIC_AD_POPUNDER_SNIPPET || "";

/** Mostrar recuadros de relleno donde iran los anuncios (util en desarrollo). */
export const AD_SHOW_PLACEHOLDERS =
  process.env.NEXT_PUBLIC_AD_PLACEHOLDERS !== "false";

export const hasAds =
  Object.values(AD_SNIPPETS).some(Boolean) || AD_GLOBAL_SNIPPETS.length > 0;
