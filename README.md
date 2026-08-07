# Cortix

Acortador de enlaces con página puente monetizada **por impresiones (CPM)**, no por clics.

Next.js 15 (App Router) + Supabase + Tailwind 4.

---

## Cómo gana dinero

El visitante abre `tudominio.com/abc123`, cae en una página puente con banners y una
cuenta atrás, y al terminar se va al destino. **No hace falta que haga clic en ningún
anuncio**: cada carga de esa página es una impresión que se te paga.

Con `GATE_STEPS=8,8` hay **dos pasos**, así que cada visitante genera **dos tandas de
anuncios** (los slots se remontan al cambiar de paso y piden creatividades nuevas).

### Formatos de Monetag a usar

| Formato | Cómo paga | Dónde va |
|---|---|---|
| Banner (300x250, 728x90, 160x600) | **CPM** | `NEXT_PUBLIC_AD_GATE_TOP/MIDDLE/BOTTOM/SIDE` |
| In-Page Push | **CPM** | `NEXT_PUBLIC_AD_GLOBAL` |
| Vignette Banner | **CPM** | `NEXT_PUBLIC_AD_GLOBAL` |
| Interstitial | **CPM** | `NEXT_PUBLIC_AD_GLOBAL` |
| MultiTag | **CPM** (mezcla y optimiza solo) | `NEXT_PUBLIC_AD_GLOBAL` |
| Popunder | CPM alto, muy invasivo | `NEXT_PUBLIC_AD_POPUNDER_SNIPPET`, apagado |
| Direct Link / Smartlink | **por clic** | no se usa en este proyecto |

Si dudas cuál poner, empieza con **MultiTag en `NEXT_PUBLIC_AD_GLOBAL` + un Banner
en `GATE_TOP` y otro en `GATE_MIDDLE`**. Es la combinación con mejor relación
ingreso/molestia.

### Cuánto se gana, sin adornos

El CPM de formatos no invasivos ronda **$0.30–$3 por cada 1000 impresiones**, y depende
muchísimo del país: Estados Unidos y Europa occidental pagan bien, LATAM paga poco.

Con 2 pasos, 1000 visitantes ≈ 2000 impresiones. En un tráfico mayoritariamente
latinoamericano eso son del orden de **$1–$3 por cada 1000 visitantes**. No es un
negocio con 100 visitas al día; empieza a notarse a partir de decenas de miles al mes.

### Lo que te hace perder la cuenta

Monetag (y cualquier red) te banea y se queda con el saldo si detecta:

- bots, granjas de clics, servicios de "tráfico barato";
- iframes ocultos o anuncios apilados fuera de pantalla;
- autorrefresh para inflar impresiones;
- obligar a desactivar el bloqueador de anuncios para continuar.

Este proyecto está construido para no caer en nada de eso: la cuenta atrás **se congela
si la pestaña no está visible**, los bots conocidos no suman estadísticas, y el aviso de
adblock es informativo, no bloqueante.

---

## Puesta en marcha

### 1. Base de datos (Supabase) — ya hecho

El proyecto está creado y el esquema aplicado:

| | |
|---|---|
| Organización | `cortix` (plan gratuito) |
| Proyecto | `cortix` · ref `dykanwwaxiitarnxcwvv` |
| Región | `us-east-1` (North Virginia), misma que Vercel por defecto |
| URL | `https://dykanwwaxiitarnxcwvv.supabase.co` |

Contiene las tablas `links` y `link_events` (ambas con RLS activado) y las funciones
`record_link_event`, `link_daily_stats`, `link_unique_visitors` y `global_stats`.

Para rehacerlo desde cero en otro proyecto: **SQL Editor** → pegar
[`supabase/schema.sql`](supabase/schema.sql) → Run. Después, en
**Settings → API Keys**, copiar:

- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- **Secret key** (`sb_secret_…`) → `SUPABASE_SECRET_KEY`

> La clave secreta salta el RLS y solo se usa desde el servidor. **Nunca** la pongas
> en una variable con prefijo `NEXT_PUBLIC_`: acabaría en el navegador. Si prefieres la
> antigua `service_role`, ponla en `SUPABASE_SERVICE_ROLE_KEY`; el código acepta las dos.

**Comprobado**: con el rol `anon` (el que usa el navegador), `select count(*) from links`
devuelve **0 filas**. Aunque alguien tenga la clave pública, no puede volcar la tabla de
destinos y saltarse la página de anuncios.

### 2. Variables de entorno

```bash
cp .env.local.example .env.local
```

Genera el secreto de firma:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

y ponlo en `APP_SECRET`. Es obligatorio en producción: sin él cualquiera podría
falsificar tokens y saltarse la página puente.

### 3. Arrancar en local

```bash
npm install
npm run dev
```

En Windows, si Node no está en el PATH, usa `dev.cmd` (arranca en el puerto 3001).

`.env.local` ya está creado y apuntando al proyecto de Supabase.

Sin Supabase configurado la app guarda todo en `.data/links.json`. Sirve para probar,
**no funciona en Vercel** (disco de solo lectura) y en modo dev puede exponer el
contenido de ese JSON en el HTML por la instrumentación de Next. Para cualquier cosa
seria, configura Supabase.

### 4. Desplegar en Vercel

1. Sube el repo a GitHub e impórtalo en Vercel.
2. Añade todas las variables de `.env.local` en **Settings → Environment Variables**.
3. Pon `NEXT_PUBLIC_SITE_URL` con tu dominio real, **sin barra final**.

Un dominio propio no es opcional: Monetag no suele aprobar subdominios de `vercel.app`.

### 5. Conectar Monetag

1. Da de alta el sitio en Monetag y verifica la propiedad del dominio.
2. Crea una zona por cada formato de la tabla de arriba.
3. Copia el snippet de cada zona **tal cual** en su variable de entorno.
4. El `sw.js` que te da Monetag va en **`public/sw.js`** (ya está puesto). Next.js sirve
   esa carpeta tal cual, así que queda accesible en `https://tudominio/sw.js`, que es
   donde Monetag lo busca para verificar que el sitio es tuyo. Ese mismo archivo es el
   que después hace funcionar las notificaciones push, si activas ese formato.
   El alias `sw.js` está en la lista de códigos reservados de
   [`src/lib/url.ts`](src/lib/url.ts) para que nadie pueda crear un enlace corto que lo tape.
5. Pega las líneas de `ads.txt` que te den en `ADS_TXT` (separa líneas con `\n` literal).
   Se sirven en `/ads.txt`. Sin esto muchos anunciantes no pujan y tu CPM baja.
5. Cuando ya tengas snippets reales, pon `NEXT_PUBLIC_AD_PLACEHOLDERS=false` para que
   desaparezcan los recuadros grises.

---

## Cómo funciona por dentro

### La página puente no se puede saltar

La URL de destino **nunca viaja en el HTML**. Al componente cliente solo se le pasa el
dominio (`es.wikipedia.org`), como señal de confianza para el visitante.

El destino se entrega únicamente por `POST /api/gate`, y solo tras pasar todos los pasos:

1. Al abrir la página, el servidor emite un token firmado con HMAC-SHA256 que lleva
   dentro el código, el paso y **el instante exacto de emisión**.
2. Para avanzar hay que devolver ese token. El servidor recalcula el tiempo transcurrido
   con su propio reloj: si no ha pasado la espera, responde `425` y no avanza.
3. El token está atado a una huella del visitante (IP + navegador + día), así que no
   sirve pasárselo a otra persona.
4. Solo en el último paso la respuesta incluye `destination`.

Comprobado: saltarse la espera devuelve `425`, manipular el token devuelve `403`, y
saltar directo al último paso devuelve `403`.

### Estructura

```
src/
  app/
    page.tsx              portada con el formulario
    [code]/page.tsx       página puente (server, no cachea, no se indexa)
    dashboard/page.tsx    "Mis enlaces" (localStorage + owner token)
    admin/page.tsx        vista global, protegida por ADMIN_PASSWORD
    api/shorten           crear enlace
    api/gate              motor de pasos y entrega del destino
    api/links/[code]      estadísticas / pausar / borrar
    api/admin             panel global
    ads.txt/route.ts      ads.txt desde variable de entorno
  components/
    AdSlot.tsx            inyecta snippets de terceros y los ejecuta de verdad
    GateFlow.tsx          cuenta atrás, pasos y redirección
    ShortenForm.tsx       formulario de la portada
  lib/
    store.ts              Supabase o JSON local, misma interfaz
    token.ts              firma HMAC, códigos y huellas
    url.ts                validación de destinos (bloquea IPs privadas)
    request.ts            IP real, detección de bots, rate limit
    ads.ts                configuración de anuncios
```

### Los anuncios entran por dos caminos distintos

**Los globales** (In-Page Push, Vignette, Interstitial, MultiTag) los escribe
[`GlobalAdScripts`](src/components/GlobalAdScripts.tsx), que es un componente de
**servidor**: el snippet sale ya dentro del HTML, justo al abrir el `<body>`, y lo
ejecuta el navegador mientras parsea. Cuanto antes corre el tag, más impresiones se
cuentan — y en un acortador mucha gente entra y se va en el primer segundo.

**Los de hueco fijo** ([`AdSlot`](src/components/AdSlot.tsx)) se inyectan desde el
cliente, porque dependen del paso de la página puente en el que estés. Ahí hay un
detalle importante: React **no ejecuta** los `<script>` que llegan por
`dangerouslySetInnerHTML` una vez la página está viva, así que `AdSlot` recrea cada
nodo script a mano. Sin eso el código quedaría inerte en el DOM.

> La misma propiedad no aplica al HTML del servidor: ahí los `<script>` sí se ejecutan,
> porque el navegador los recibe como parte del documento. De ahí que cada camino use
> una técnica distinta.

**Nunca pongas el mismo tag por los dos caminos**: cargarlo dos veces por visita son
impresiones duplicadas, y eso una red publicitaria lo lee como fraude.

---

## Ajustes que mueven los ingresos

| Variable | Efecto |
|---|---|
| `GATE_STEPS=10` | un solo paso, menos ingreso por visita, menos abandono |
| `GATE_STEPS=8,8` | **recomendado**: doble impresión, abandono aceptable |
| `GATE_STEPS=5,5,5` | tres tandas; sube el ingreso teórico y el abandono real |
| `NEXT_PUBLIC_AD_POPUNDER=true` | dispara el CPM y la tasa de gente que no vuelve |

Sube los pasos poco a poco y vigila la **conversión** en el panel (visitas que llegan al
destino). Si baja del 70%, te has pasado: estás perdiendo más gente de la que ganas en
impresiones.

---

## Cosas que faltan y no son urgentes

- Rate limit en memoria: por instancia serverless. Si el sitio crece, cámbialo por Upstash Redis.
- Sin cuentas de usuario: quien controla el navegador controla sus enlaces (modelo bit.ly sin registro).
- Sin lista antimalware automática: `BLOCKED_HOSTS` se rellena a mano.
