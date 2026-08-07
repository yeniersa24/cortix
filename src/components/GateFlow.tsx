"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdSlot, AdblockNotice } from "@/components/AdSlot";

type GateResponse = {
  token?: string;
  wait?: number;
  step?: number;
  totalSteps?: number;
  done?: boolean;
  destination?: string;
  error?: string;
};

type Phase = "loading" | "waiting" | "ready" | "sending" | "redirecting" | "error";

type Props = {
  code: string;
  title: string | null;
};

export function GateFlow({ code, title }: Props) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [step, setStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(1);
  const [remaining, setRemaining] = useState(0);
  const [waitTotal, setWaitTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const token = useRef<string | null>(null);
  const started = useRef(false);

  const call = useCallback(
    async (nextStep: number): Promise<GateResponse | null> => {
      try {
        const res = await fetch("/api/gate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ code, step: nextStep, token: token.current }),
        });
        const data = (await res.json()) as GateResponse;

        if (!res.ok) {
          setError(data.error ?? "Algo salio mal.");
          setPhase("error");
          return null;
        }
        return data;
      } catch {
        setError("Fallo de conexion. Recarga la pagina.");
        setPhase("error");
        return null;
      }
    },
    [code]
  );

  // Arranque: pedimos el primer token y el primer tiempo de espera.
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      const data = await call(0);
      if (!data) return;
      token.current = data.token ?? null;
      setTotalSteps(data.totalSteps ?? 1);
      setWaitTotal(data.wait ?? 0);
      setRemaining(data.wait ?? 0);
      setPhase((data.wait ?? 0) > 0 ? "waiting" : "ready");
    })();
  }, [call]);

  // Cuenta atras. Se congela si la pestana no esta visible: cobrar por una
  // impresion que nadie llego a ver es justo el tipo de trafico que hace que
  // una red publicitaria te cierre la cuenta.
  useEffect(() => {
    if (phase !== "waiting") return;

    const id = window.setInterval(() => {
      if (document.hidden) return;
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(id);
          setPhase("ready");
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [phase]);

  async function advance() {
    if (phase !== "ready") return;
    setPhase("sending");

    const next = step + 1;
    const data = await call(next);
    if (!data) return;

    if (data.done && data.destination) {
      setPhase("redirecting");
      window.location.href = data.destination;
      return;
    }

    token.current = data.token ?? null;
    setStep(next);
    setWaitTotal(data.wait ?? 0);
    setRemaining(data.wait ?? 0);
    setPhase((data.wait ?? 0) > 0 ? "waiting" : "ready");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const isLast = step + 1 >= totalSteps;
  const progress = waitTotal > 0 ? ((waitTotal - remaining) / waitTotal) * 100 : 100;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-6">
          {/* Anuncio de arriba: es el que mas se ve, por eso va antes que nada. */}
          <div className="ad-reserve">
            <AdSlot key={`top-${step}`} name="gateTop" label="Anuncio superior" minHeight={100} />
          </div>

          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center sm:p-8">
            <p className="text-xs uppercase tracking-widest text-slate-500">
              Paso {step + 1} de {totalSteps}
            </p>

            <h1 className="mt-3 text-balance text-2xl font-bold sm:text-3xl">
              {title || "Tu enlace esta casi listo"}
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Estamos preparando tu enlace
            </p>

            <div className="mt-6">
              {phase === "loading" && <p className="text-slate-400">Preparando el enlace...</p>}

              {phase === "error" && (
                <div role="alert" className="space-y-3">
                  <p className="text-red-300">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="rounded-xl border border-white/15 px-5 py-2.5 text-sm hover:bg-white/10"
                  >
                    Recargar
                  </button>
                </div>
              )}

              {phase === "waiting" && (
                <div>
                  <div
                    aria-live="polite"
                    className="mx-auto grid h-20 w-20 place-items-center rounded-full border-2 border-brand-500/40 text-3xl font-bold tabular-nums"
                  >
                    {remaining}
                  </div>
                  <p className="mt-3 text-sm text-slate-400">
                    Espera un momento mientras cargamos tu enlace
                  </p>
                  <div className="mx-auto mt-4 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-[width] duration-1000 ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {(phase === "ready" || phase === "sending" || phase === "redirecting") && (
                <button
                  onClick={advance}
                  disabled={phase !== "ready"}
                  className="fade-in w-full max-w-sm rounded-xl bg-brand-500 px-8 py-4 text-lg font-semibold text-white transition hover:bg-brand-600 disabled:opacity-70 sm:w-auto"
                >
                  {phase === "redirecting"
                    ? "Redirigiendo..."
                    : phase === "sending"
                      ? "Un segundo..."
                      : isLast
                        ? "Ir al enlace"
                        : "Continuar"}
                </button>
              )}
            </div>
          </section>

          {/* Anuncio intermedio: queda a la vista justo debajo del boton. */}
          <div className="ad-reserve">
            <AdSlot key={`mid-${step}`} name="gateMiddle" label="Anuncio central" minHeight={250} />
          </div>

          <AdblockNotice />

          <div className="ad-reserve">
            <AdSlot
              key={`bottom-${step}`}
              name="gateBottom"
              label="Anuncio inferior"
              minHeight={250}
            />
          </div>
        </div>

        {/* Columna lateral: solo en pantallas grandes, para no estorbar en movil. */}
        <aside className="hidden lg:block">
          <div className="ad-reserve sticky top-6">
            <AdSlot key={`side-${step}`} name="gateSide" label="Anuncio lateral" minHeight={600} />
          </div>
        </aside>
      </div>
    </div>
  );
}
