import { SITE_NAME } from "@/lib/config";

export const metadata = { title: "Terminos de uso" };

export default function TerminosPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 px-4 py-16 text-sm leading-relaxed text-slate-400">
      <h1 className="text-2xl font-bold text-white">Terminos de uso</h1>

      <p>
        Al usar {SITE_NAME} aceptas estas condiciones. El servicio se ofrece tal cual, sin garantia
        de disponibilidad.
      </p>

      <h2 className="pt-4 text-lg font-semibold text-white">Que no puedes acortar</h2>
      <p>
        Malware, phishing, estafas, contenido sexual con menores, material que incite al odio o a la
        violencia, y cualquier cosa ilegal en tu pais o en el nuestro. Tampoco enlaces a descargas
        automaticas ni a paginas que abran ventanas sin permiso del visitante.
      </p>
      <p>
        Los enlaces que incumplan esto se desactivan sin aviso, y podemos bloquear la IP que los
        creo.
      </p>

      <h2 className="pt-4 text-lg font-semibold text-white">Trafico</h2>
      <p>
        Esta prohibido generar visitas artificiales: bots, granjas de clics, iframes ocultos,
        recargas automaticas o cualquier sistema que simule visitantes reales. Detectarlo supone
        borrar la cuenta de enlaces asociada.
      </p>

      <h2 className="pt-4 text-lg font-semibold text-white">Publicidad</h2>
      <p>
        {SITE_NAME} es gratuito porque muestra publicidad de terceros en la pagina previa al
        destino. Esos anuncios los sirven redes externas y su contenido no depende de nosotros.
      </p>

      <h2 className="pt-4 text-lg font-semibold text-white">Responsabilidad</h2>
      <p>
        No controlamos el contenido de los sitios de destino. Quien crea un enlace es el unico
        responsable de a donde apunta.
      </p>
    </article>
  );
}
