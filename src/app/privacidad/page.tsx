import { SITE_NAME } from "@/lib/config";

export const metadata = { title: "Privacidad" };

export default function PrivacidadPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 px-4 py-16 text-sm leading-relaxed text-slate-400">
      <h1 className="text-2xl font-bold text-white">Politica de privacidad</h1>

      <h2 className="pt-4 text-lg font-semibold text-white">Que guardamos</h2>
      <p>
        De cada enlace: la URL de destino, la fecha de creacion y los contadores de visitas. De cada
        visita: una huella irreversible calculada a partir de la IP y el navegador, el pais y la
        pagina de procedencia. Esa huella cambia cada dia y no permite reconstruir tu IP.
      </p>

      <h2 className="pt-4 text-lg font-semibold text-white">Tu navegador</h2>
      <p>
        Los enlaces que creas se guardan en el almacenamiento local de tu navegador, no en una
        cuenta. Si lo limpias, dejaras de verlos en el panel; los enlaces seguiran funcionando.
      </p>

      <h2 className="pt-4 text-lg font-semibold text-white">Publicidad de terceros</h2>
      <p>
        La pagina previa al destino carga anuncios servidos por redes externas. Esas redes pueden
        usar cookies o identificadores propios para medir impresiones y mostrar publicidad
        relevante, segun sus propias politicas. {SITE_NAME} no les entrega tu correo, tu nombre ni
        ningun dato que te identifique.
      </p>

      <h2 className="pt-4 text-lg font-semibold text-white">Menores</h2>
      <p>El servicio no esta dirigido a menores de 13 anos.</p>

      <h2 className="pt-4 text-lg font-semibold text-white">Borrado</h2>
      <p>
        Puedes borrar cualquier enlace que hayas creado desde el panel Mis enlaces. Al borrarlo se
        eliminan tambien sus estadisticas.
      </p>
    </article>
  );
}
