"use client";

import { useEffect, useRef, useState } from "react";
import {
  AD_GLOBAL_SNIPPETS,
  AD_POPUNDER_ENABLED,
  AD_POPUNDER_SNIPPET,
  AD_SHOW_PLACEHOLDERS,
  AD_SNIPPETS,
  type AdSlotName,
} from "@/lib/ads";

/**
 * React no ejecuta los <script> que llegan por dangerouslySetInnerHTML. Hay que
 * recrear cada nodo script a mano para que el navegador los evalue. Esto es lo
 * que hace que el snippet de la red publicitaria funcione de verdad.
 */
function injectSnippet(container: HTMLElement, html: string): void {
  const template = document.createElement("template");
  template.innerHTML = html;

  for (const node of Array.from(template.content.childNodes)) {
    if (node.nodeName === "SCRIPT") {
      const original = node as HTMLScriptElement;
      const script = document.createElement("script");
      for (const attr of Array.from(original.attributes)) {
        script.setAttribute(attr.name, attr.value);
      }
      script.text = original.text;
      container.appendChild(script);
    } else {
      container.appendChild(node.cloneNode(true));
    }
  }
}

type AdSlotProps = {
  name: AdSlotName;
  /** Etiqueta del recuadro de relleno cuando el slot no esta configurado. */
  label?: string;
  className?: string;
  minHeight?: number;
};

export function AdSlot({ name, label = "Espacio publicitario", className = "", minHeight = 250 }: AdSlotProps) {
  const ref = useRef<HTMLDivElement>(null);
  const injected = useRef(false);
  const snippet = AD_SNIPPETS[name];

  useEffect(() => {
    // El ref evita la doble inyeccion del Strict Mode en desarrollo, que
    // duplicaria la impresion y ensuciaria las metricas de la red.
    if (!snippet || injected.current || !ref.current) return;
    injected.current = true;
    injectSnippet(ref.current, snippet);
  }, [snippet]);

  if (!snippet) {
    if (!AD_SHOW_PLACEHOLDERS) return null;
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.03] text-xs text-slate-500 ${className}`}
        style={{ minHeight }}
      >
        <span className="px-4 text-center">
          {label}
          <br />
          <span className="text-[10px] uppercase tracking-widest text-slate-600">{name}</span>
        </span>
      </div>
    );
  }

  return (
    <div className={className} style={{ minHeight }}>
      {/* La etiqueta "Publicidad" no es decorativa: la piden casi todas las
          redes y evita que el usuario confunda el anuncio con contenido. */}
      <div className="mb-1 text-center text-[10px] uppercase tracking-widest text-slate-600">
        Publicidad
      </div>
      <div ref={ref} className="flex justify-center overflow-hidden" />
    </div>
  );
}

/**
 * Formatos que se colocan solos en la pantalla (In-Page Push, Vignette,
 * Interstitial, MultiTag). Se montan una sola vez por carga de pagina.
 */
export function GlobalAds() {
  const ref = useRef<HTMLDivElement>(null);
  const injected = useRef(false);

  useEffect(() => {
    if (injected.current || !ref.current) return;
    injected.current = true;

    for (const snippet of AD_GLOBAL_SNIPPETS) injectSnippet(ref.current, snippet);
    if (AD_POPUNDER_ENABLED && AD_POPUNDER_SNIPPET) {
      injectSnippet(ref.current, AD_POPUNDER_SNIPPET);
    }
  }, []);

  return <div ref={ref} aria-hidden="true" />;
}

/**
 * Aviso al visitante cuando un bloqueador se ha comido los anuncios. No le
 * impide continuar: pedir que desactive el bloqueador para poder pasar es de
 * las cosas que mas odia la gente y encima infla el rebote.
 */
export function AdblockNotice() {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    // Truco clasico: los bloqueadores ocultan cualquier elemento cuya clase
    // suene a anuncio. Si nuestro cebo mide 0px, hay bloqueador.
    const bait = document.createElement("div");
    bait.className = "adsbox ad-banner ads ad-placement";
    bait.style.cssText = "position:absolute;left:-9999px;width:10px;height:10px;";
    document.body.appendChild(bait);

    const timer = window.setTimeout(() => {
      const hidden =
        bait.offsetHeight === 0 ||
        bait.offsetParent === null ||
        window.getComputedStyle(bait).display === "none";
      setBlocked(hidden);
      bait.remove();
    }, 300);

    return () => {
      window.clearTimeout(timer);
      bait.remove();
    };
  }, []);

  if (!blocked) return null;

  return (
    <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-center text-xs text-amber-200/90">
      Detectamos un bloqueador de anuncios. Puedes seguir usando el enlace con
      normalidad; desactivarlo aqui solo nos ayuda a mantener el servicio gratis.
    </p>
  );
}
