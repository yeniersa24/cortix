import { AdSlot } from "@/components/AdSlot";
import { ShortenForm } from "@/components/ShortenForm";
import { GATE_STEPS, SITE_NAME, TOTAL_STEPS } from "@/lib/config";

const totalWait = GATE_STEPS.reduce((a, b) => a + b, 0);

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-20">
      <section className="text-center">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          Enlaces largos, <span className="text-brand-400">cortos y medibles</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-balance text-slate-400">
          Pega cualquier URL y {SITE_NAME} te devuelve un enlace corto que puedes compartir donde
          quieras. Gratis, sin registro y con estadisticas de visitas.
        </p>
      </section>

      <section className="mt-10">
        <ShortenForm />
      </section>

      <section className="mt-12 ad-reserve">
        <AdSlot name="home" label="Anuncio de la portada" minHeight={250} />
      </section>

      <section className="mt-14 grid gap-4 sm:grid-cols-3">
        {[
          {
            title: "Sin registro",
            body: "Acortas y ya. El enlace y sus estadisticas quedan guardados en tu navegador.",
          },
          {
            title: "Estadisticas reales",
            body: "Visitas, visitantes unicos y cuantos llegaron al destino, dia a dia.",
          },
          {
            title: "Alias a tu gusto",
            body: "Elige el final del enlace para que se entienda de un vistazo al compartirlo.",
          },
        ].map((card) => (
          <article
            key={card.title}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <h2 className="font-semibold">{card.title}</h2>
            <p className="mt-2 text-sm text-slate-400">{card.body}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm text-slate-400">
        <h2 className="font-semibold text-slate-200">Como se sostiene esto</h2>
        <p className="mt-2">
          {SITE_NAME} es gratis porque antes de llegar al destino se muestra una pagina con
          publicidad durante {totalWait} segundos
          {TOTAL_STEPS > 1 ? ` repartidos en ${TOTAL_STEPS} pasos` : ""}. No hay ventanas emergentes
          ni descargas: solo banners que puedes ignorar mientras corre la cuenta atras.
        </p>
      </section>
    </div>
  );
}
