"use client";

import { useState } from "react";

type AdminLink = {
  code: string;
  shortUrl: string;
  destination: string;
  title: string | null;
  active: boolean;
  views: number;
  completions: number;
  createdAt: string;
};

type AdminData = {
  totals: { links: number; views: number; completions: number };
  links: AdminLink[];
};

export default function AdminPage() {
  // La password vive solo en memoria: si recargas, se vuelve a pedir.
  const [password, setPassword] = useState("");
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(action: "list" | "toggle" | "delete", extra: Record<string, unknown> = {}) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password, action, ...extra }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Error inesperado.");
        return;
      }
      setData(body as AdminData);
    } catch {
      setError("Fallo de conexion.");
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-sm px-4 py-24">
        <h1 className="text-2xl font-bold">Panel de admin</h1>
        <p className="mt-2 text-sm text-slate-500">
          Vista global de todos los enlaces del sitio.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send("list");
          }}
          className="mt-6 space-y-3"
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none focus:border-brand-500"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-brand-500 px-4 py-3 font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {busy ? "Entrando..." : "Entrar"}
          </button>
          {error && <p className="text-sm text-red-300">{error}</p>}
        </form>
      </div>
    );
  }

  const rate =
    data.totals.views > 0 ? Math.round((data.totals.completions / data.totals.views) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-bold">Panel de admin</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Enlaces" value={data.totals.links} />
        <Tile label="Visitas totales" value={data.totals.views} />
        <Tile label="Completados" value={data.totals.completions} />
        <Tile label="Conversion" value={`${rate}%`} />
      </div>

      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

      <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-white/[0.04] text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Codigo</th>
              <th className="px-4 py-3">Destino</th>
              <th className="px-4 py-3 text-right">Visitas</th>
              <th className="px-4 py-3 text-right">Completados</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {data.links.map((link) => (
              <tr key={link.code} className="border-t border-white/5">
                <td className="px-4 py-3">
                  <a href={link.shortUrl} target="_blank" rel="noreferrer" className="font-medium hover:underline">
                    /{link.code}
                  </a>
                </td>
                <td className="max-w-[280px] truncate px-4 py-3 text-slate-400" title={link.destination}>
                  {link.destination}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{link.views}</td>
                <td className="px-4 py-3 text-right tabular-nums">{link.completions}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      link.active
                        ? "rounded-full bg-accent-400/15 px-2 py-0.5 text-xs text-accent-400"
                        : "rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-400"
                    }
                  >
                    {link.active ? "activo" : "pausado"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    onClick={() => send("toggle", { code: link.code, active: !link.active })}
                    disabled={busy}
                    className="rounded-lg border border-white/15 px-3 py-1 text-xs hover:bg-white/10"
                  >
                    {link.active ? "Pausar" : "Activar"}
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Borrar /${link.code}?`)) {
                        void send("delete", { code: link.code });
                      }
                    }}
                    disabled={busy}
                    className="ml-2 rounded-lg border border-red-500/30 px-3 py-1 text-xs text-red-300 hover:bg-red-500/10"
                  >
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
