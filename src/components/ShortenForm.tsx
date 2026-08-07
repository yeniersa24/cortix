"use client";

import { useState } from "react";
import { saveLink, type SavedLink } from "@/lib/local";

export function ShortenForm() {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [showAlias, setShowAlias] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SavedLink | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setCopied(false);

    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, alias: alias.trim() || undefined }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No se pudo acortar el enlace.");
        return;
      }

      const saved: SavedLink = {
        code: data.code,
        shortUrl: data.shortUrl,
        destination: data.destination,
        title: data.title,
        ownerToken: data.ownerToken,
        createdAt: data.createdAt,
      };
      saveLink(saved);
      setResult(saved);
      setUrl("");
      setAlias("");
    } catch {
      setError("Fallo de conexion. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Tu navegador bloqueo el portapapeles. Copia el enlace a mano.");
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={submit} className="space-y-3">
        <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2 sm:flex-row">
          <input
            type="text"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Pega aqui tu enlace largo"
            aria-label="Enlace a acortar"
            required
            className="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-3 text-base outline-none placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-brand-500 px-6 py-3 font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Acortando..." : "Acortar"}
          </button>
        </div>

        <div className="flex items-center justify-between px-1 text-sm">
          <button
            type="button"
            onClick={() => setShowAlias((v) => !v)}
            className="text-slate-400 underline-offset-4 hover:text-slate-200 hover:underline"
          >
            {showAlias ? "Quitar alias" : "Usar un alias personalizado"}
          </button>
        </div>

        {showAlias && (
          <div className="fade-in flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <span className="shrink-0 text-sm text-slate-500">/</span>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="mi-enlace"
              aria-label="Alias personalizado"
              maxLength={32}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-600"
            />
          </div>
        )}
      </form>

      {error && (
        <p
          role="alert"
          className="fade-in mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}

      {result && (
        <div className="fade-in mt-4 rounded-2xl border border-accent-400/25 bg-accent-400/[0.07] p-4">
          <p className="text-xs uppercase tracking-widest text-accent-400">Listo</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <a
              href={result.shortUrl}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 flex-1 truncate text-lg font-semibold text-white underline-offset-4 hover:underline"
            >
              {result.shortUrl}
            </a>
            <button
              onClick={copy}
              className="shrink-0 rounded-xl border border-white/15 px-4 py-2 text-sm font-medium transition hover:bg-white/10"
            >
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <p className="mt-2 truncate text-xs text-slate-400" title={result.destination}>
            Apunta a: {result.destination}
          </p>
          <p className="mt-3 text-xs text-slate-500">
            Guardado en este navegador. Entra en <b className="text-slate-400">Mis enlaces</b> para
            ver cuanta gente lo abre.
          </p>
        </div>
      )}
    </div>
  );
}
