"use client";

/**
 * Los enlaces se guardan en el navegador junto a su owner token. No hay cuentas
 * ni contrasenas: quien tiene el token puede ver las estadisticas y borrar el
 * enlace. Si el usuario limpia el navegador, pierde el acceso al panel (el
 * enlace corto sigue funcionando). Es el mismo modelo de bit.ly sin registro.
 */

export type SavedLink = {
  code: string;
  shortUrl: string;
  destination: string;
  title: string | null;
  ownerToken: string;
  createdAt: string;
};

const KEY = "cortix:links";

export function loadSaved(): SavedLink[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as SavedLink[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLink(link: SavedLink): void {
  const all = loadSaved().filter((l) => l.code !== link.code);
  all.unshift(link);
  // 200 es de sobra para un uso normal y evita reventar la cuota de localStorage.
  window.localStorage.setItem(KEY, JSON.stringify(all.slice(0, 200)));
}

export function removeSaved(code: string): void {
  window.localStorage.setItem(KEY, JSON.stringify(loadSaved().filter((l) => l.code !== code)));
}
