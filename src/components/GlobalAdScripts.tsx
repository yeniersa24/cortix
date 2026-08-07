import { AD_GLOBAL_SNIPPETS, AD_POPUNDER_ENABLED, AD_POPUNDER_SNIPPET } from "@/lib/ads";

/**
 * Scripts de anuncio que se colocan solos (In-Page Push, Vignette, Interstitial,
 * MultiTag) y el popunder si esta activado.
 *
 * Componente de SERVIDOR a proposito: el snippet sale dentro del HTML y lo
 * ejecuta el navegador al parsear, sin esperar a React. Va en el <head>, que es
 * donde lo pide Monetag y donde antes corre.
 *
 * Por que no se usa dangerouslySetInnerHTML sobre un <div> envolvente, que seria
 * mas corto: dentro del <head> solo valen ciertas etiquetas, y al encontrarse un
 * <div> el navegador cierra el <head> y lo tira al <body>. El tag acabaria mas
 * abajo de lo que creemos. Por eso se analiza el snippet y se emiten etiquetas
 * <script> de verdad.
 */

type ParsedScript = {
  attrs: Record<string, string>;
  code: string;
};

/** Saca cada <script> del snippet con sus atributos y su codigo interno. */
function parseScripts(html: string): ParsedScript[] {
  const scripts: ParsedScript[] = [];
  const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
  const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

  let match: RegExpExecArray | null;
  while ((match = scriptRe.exec(html)) !== null) {
    const attrs: Record<string, string> = {};
    let attr: RegExpExecArray | null;
    attrRe.lastIndex = 0;
    while ((attr = attrRe.exec(match[1])) !== null) {
      attrs[attr[1]] = attr[2] ?? attr[3] ?? attr[4] ?? "";
    }
    scripts.push({ attrs, code: match[2] });
  }

  return scripts;
}

/** Atributos que en JSX son booleanos y no cadenas. */
const BOOLEAN_ATTRS = new Set(["async", "defer", "nomodule"]);

/** Atributos cuyo nombre cambia en JSX. */
const RENAMED_ATTRS: Record<string, string> = {
  charset: "charSet",
  class: "className",
  crossorigin: "crossOrigin",
  referrerpolicy: "referrerPolicy",
};

function toReactProps(attrs: Record<string, string>): Record<string, unknown> {
  const props: Record<string, unknown> = {};

  for (const [rawName, value] of Object.entries(attrs)) {
    const name = rawName.toLowerCase();
    if (BOOLEAN_ATTRS.has(name)) {
      props[name] = true;
    } else {
      // Los data-* y demas pasan tal cual; React los deja intactos.
      props[RENAMED_ATTRS[name] ?? rawName] = value;
    }
  }

  return props;
}

export function GlobalAdScripts() {
  const snippets = [...AD_GLOBAL_SNIPPETS];

  if (AD_POPUNDER_ENABLED && AD_POPUNDER_SNIPPET) {
    snippets.push(AD_POPUNDER_SNIPPET);
  }

  const scripts = snippets.flatMap(parseScripts);
  if (scripts.length === 0) return null;

  return (
    <>
      {scripts.map((script, index) => (
        <script
          // El orden es estable (viene de las variables de entorno), asi que el
          // indice sirve de clave sin riesgo de reordenaciones.
          key={index}
          {...toReactProps(script.attrs)}
          {...(script.code.trim()
            ? { dangerouslySetInnerHTML: { __html: script.code } }
            : {})}
        />
      ))}
    </>
  );
}
