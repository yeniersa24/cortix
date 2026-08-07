"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadSaved, removeSaved, type SavedLink } from "@/lib/local";

type Stats = {
  views: number;
  completions: number;
  uniques: number;
  active: boolean;
  daily: { day: string; views: number; completions: number }[];
};

export default function DashboardPage() {
  const [links, setLinks] = useState<SavedLink[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, Stats | "loading" | "error">>({});

  useEffect(() => {
    setLinks(loadSaved());
    setReady(true);
  }, []);

  async function toggle(link: SavedLink) {
    if (open === link.code) {
      setOpen(null);
      return;
    }
    setOpen(link.code);

    if (stats[link.code] && stats[link.code] !== "error") return;
    setStats((s) => ({ ...s, [link.code]: "loading" }));

    try {
      const res = await fetch(
        `/api/links/${encodeURIComponent(link.code)}?token=${encodeURIComponent(link.ownerToken)}`
      );
      if (!res.ok) throw new Error();
      const data = (await res.json()) as Stats;
      setStats((s) => ({ ...s, [link.code]: data }));
    } catch {
      setStats((s) => ({ ...s, [link.code]: "error" }));
    }
  }

  async function destroy(link: SavedLink) {
    if (!window.confirm(`Borrar ${link.shortUrl}? Dejara de funcionar para siempre.`)) return;

    await fetch(
      `/api/links/${encodeURIComponent(link.code)}?token=${encodeURIComponent(link.ownerToken)}`,
      { method: "DELETE" }
    );
    removeSaved(link.code);
    setLinks(loadSaved());
  }

  if (!ready) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-slate-500">Cargando...</div>;
  }

  if (links.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Aun no tienes enlaces</h1>
        <p className="mt-3 text-sm text-slate-400">
          Los enlaces que crees se guardan en este navegador. Si usas otro dispositivo o borras los
          datos de navegacion, no apareceran aqui.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-brand-500 px-6 py-3 font-semibold text-white hover:bg-brand-600"
        >
          Crear el primero
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">Mis enlaces</h1>
      <p className="mt-1 text-sm text-slate-500">
        Guardados en este navegador. {links.length} en total.
      </p>

      <ul className="mt-6 space-y-3">
        {links.map((link) => {
          const data = stats[link.code];
          const isOpen = open === link.code;

          return (
            <li key={link.code} className="rounded-2xl border border-white/10 bg-white/[0.03]">
              <div className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <a
                    href={link.shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate font-semibold hover:underline"
                  >
                    /{link.code}
                  </a>
                  <p className="truncate text-xs text-slate-500" title={link.destination}>
                    {link.destination}
                  </p>
                </div>
                <button
                  onClick={() => toggle(link)}
                  className="shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:bg-white/10"
                >
                  {isOpen ? "Ocultar" : "Estadisticas"}
                </button>
                <button
                  onClick={() => destroy(link)}
                  className="shrink-0 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10"
                >
                  Borrar
                </button>
              </div>

              {isOpen && (
                <div className="fade-in border-t border-white/10 p-4">
                  {data === "loading" && <p className="text-sm text-slate-500">Cargando...</p>}
                  {data === "error" && (
                    <p className="text-sm text-red-300">
                      No se pudieron cargar las estadisticas de este enlace.
                    </p>
                  )}
                  {data && data !== "loading" && data !== "error" && (
                    <StatsPanel stats={data} />
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StatsPanel({ stats }: { stats: Stats }) {
  const rate = stats.views > 0 ? Math.round((stats.completions / stats.views) * 100) : 0;
  const max = Math.max(1, ...stats.daily.map((d) => d.views));

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Visitas" value={stats.views} hint="impresiones de anuncios" />
        <Metric label="Unicos" value={stats.uniques} hint="personas distintas" />
        <Metric label="Completados" value={stats.completions} hint="llegaron al destino" />
        <Metric label="Conversion" value={`${rate}%`} hint="visitas que terminan" />
      </div>

      {stats.daily.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs uppercase tracking-widest text-slate-500">Ultimos dias</p>
          <div className="flex h-24 items-end gap-1">
            {stats.daily.map((d) => (
              <div
                key={d.day}
                title={`${d.day}: ${d.views} visitas, ${d.completions} completados`}
                className="flex-1 rounded-t bg-brand-500/70"
                style={{ height: `${Math.max(4, (d.views / max) * 100)}%` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[10px] text-slate-600">{hint}</p>
    </div>
  );
}
