# Opciones de alojamiento durable para Edu AI

Investigación realizada el 17 de agosto de 2026 para vincular `api.textoavoz.xyz` sin modificar `textoavoz.xyz`.

| Opción | Encaje con `api.textoavoz.xyz` | Consideración principal |
| --- | --- | --- |
| Cloudflare Worker como puerta de API | Puede asignar un dominio personalizado dentro de una zona activa de Cloudflare y emitir certificados automáticamente. Un Worker puede llamar a dependencias externas mediante `fetch()`. | Requiere que `textoavoz.xyz` esté nuevamente en una zona Cloudflare activa y una cuenta de Cloudflare con el Worker configurado. |
| Render Web Service | Admite dominios propios y TLS administrado; la configuración requiere registrar el dominio en Render, actualizar DNS y verificarlo. | El nivel gratuito se suspende tras 15 minutos sin tráfico y Render advierte que no debe usarse para producción. No cumple por sí solo la meta de disponibilidad sostenida. |
| Railway Service | Ofrece dominios personalizados, certificados SSL y DNS configurables para servicios. | Requiere crear y mantener un servicio en Railway; se debe validar el plan de disponibilidad elegido antes de migrar. |

> La ruta preferida para no depender del subdominio técnico es un servicio de API con dominio propio y TLS administrado. El modelo y sus credenciales deben permanecer exclusivamente del lado del servidor.

## Viabilidad del Worker como puerta de API

Una puerta de API de Cloudflare puede recibir el tráfico en `api.textoavoz.xyz`, validar el origen de GitHub Pages y reenviar las solicitudes al backend publicado. Cloudflare documenta que los Workers pueden usar dominios personalizados dentro de una zona activa, crear el DNS y emitir los certificados necesarios. El plan gratuito admite hasta 100.000 solicitudes al día y 50 subsolicitudes por petición; las esperas de red no consumen el presupuesto de CPU del Worker. [1] [5]

La puerta no debe incluir claves en el código ni en GitHub. Cloudflare provee secretos cifrados por Worker y recomienda explícitamente no guardar valores sensibles como variables de texto en la configuración. [6] El Worker deberá restringir CORS a `https://eduai-lab-source.github.io`, atender solo los métodos necesarios y no actuar como proxy abierto. El ejemplo oficial de CORS muestra el tratamiento separado de solicitudes `OPTIONS`, la reconstrucción de cabeceras y el uso de `Vary: Origin`. [7]

| Elemento | Regla de implementación |
| --- | --- |
| Dominio | Solo `api.textoavoz.xyz`; el dominio raíz no se redirige ni altera. |
| TLS | Lo emite Cloudflare al asociar el dominio personalizado con el Worker. |
| Origen permitido | `https://eduai-lab-source.github.io`. |
| Secretos | Se almacenan como secretos cifrados en Cloudflare y/o en el backend, nunca en el repositorio o navegador. |
| Límite del plan gratuito | 100.000 solicitudes diarias; se debe monitorizar antes de depender de ello a escala. |

## Estado de acceso

La sesión de Cloudflare ya está activa en la cuenta titular y existe un Worker denominado `text-to-speech-app`. La ruta almacenada de la zona `textoavoz.xyz` devuelve una página 404 después del restablecimiento de nameservers a Hostinger, por lo que la zona no está activa en Cloudflare en este momento. Antes de crear una ruta de Worker para `api.textoavoz.xyz`, habrá que volver a añadir o reactivar el dominio en Cloudflare y completar la delegación de nameservers que indique la plataforma. No se han modificado DNS, Workers ni configuraciones de la zona.

La vista general de la cuenta tampoco muestra una zona activa bajo la tarjeta de dominios. El siguiente paso seguro es iniciar el asistente de "Add a domain" para recuperar `textoavoz.xyz` y obtener los dos nameservers que deberá configurar el titular en Hostinger. Esa delegación sí modifica el DNS autoritativo y requerirá confirmación inmediatamente antes de aplicarse.

El asistente de Cloudflare aceptó `textoavoz.xyz` y muestra su plan **Free ($0)** como opción para la zona. La pantalla indica que incluye DNS administrado, certificado Universal SSL, CDN y hasta 100.000 solicitudes de Workers al día; no se seleccionó ningún plan de pago. La siguiente acción es seleccionar el plan Free para que Cloudflare muestre los nameservers de delegación.

Tras seleccionar el plan Free, Cloudflare creó la zona pendiente de activación e importó automáticamente dos registros detectados: un registro A y un CNAME, ambos inicialmente configurados como proxied y con TTL automático. La revisión también advierte que no se detectó ningún MX; antes de continuar hay que comparar los destinos importados con Hostinger y asegurar que no falte correo o algún subdominio existente.

Revisión de los registros importados en el asistente de Cloudflare: `A textoavoz.xyz → 104.21.62.196` con proxy habilitado y `CNAME www → textoavoz.xyz` con proxy habilitado. El valor IPv4 es una dirección de Cloudflare, no un origen de aplicación confirmado; por tanto, se conservará sin usarlo para Edu AI y no se añadirá ni modificará ningún registro adicional del dominio raíz. La única configuración funcional que se introducirá después de activar la zona será `api.textoavoz.xyz` asociado al Worker de Edu AI.

Cloudflare asignó los nameservers `carioca.ns.cloudflare.com` y `dakota.ns.cloudflare.com` para la reactivación de la zona. La delegación autorizada reemplazará exclusivamente los nameservers de Hostinger `aurora.dns-parking.com` y `nebula.dns-parking.com`; el botón de confirmación de Cloudflare debe usarse solo después de guardar esta sustitución en Hostinger. DNSSEC debe permanecer desactivado durante la activación inicial.

El panel de Hostinger de la cuenta del titular está abierto y confirma que `textoavoz.xyz` se administra desde esa cuenta. La acción siguiente es abrir **Administrar dominio** y sustituir los nameservers actuales por los dos valores asignados por Cloudflare, conforme a la autorización explícita recibida.

La vista general de `textoavoz.xyz` confirma que los nameservers aún son `aurora.dns-parking.com` y `nebula.dns-parking.com` y que la ruta para actualizarlos es **DNS / Nameservers**. Se mantendrá intacta la renovación automática, la propiedad y el resto de ajustes del dominio.

El formulario de nameservers personalizados de Hostinger está abierto. Los campos 1 y 2 contienen los valores antiguos y se reemplazarán por `carioca.ns.cloudflare.com` y `dakota.ns.cloudflare.com`; los campos 3 a 6 permanecerán vacíos. La delegación cuenta con confirmación explícita del titular.

La delegación fue aplicada correctamente en Hostinger. El panel confirma que `textoavoz.xyz` usa ahora `carioca.ns.cloudflare.com` y `dakota.ns.cloudflare.com` y advierte que la propagación puede tardar hasta 24 horas. Desde este punto, los registros DNS se gestionan exclusivamente en Cloudflare.

Cloudflare reconoce la zona `textoavoz.xyz` dentro de la cuenta del titular y muestra los módulos DNS, SSL/TLS y Workers Routes. La interfaz todavía está cargando el contenido de la zona mientras se propaga la delegación, por lo que no se creará ningún registro ni Worker hasta que el estado sea activo.

## Puerta de API en preparación

Se inició la creación del Worker `eduai-api` en la cuenta de Cloudflare asociada a `textoavoz.xyz`. El Worker se usará únicamente como puerta HTTPS para `api.textoavoz.xyz`, con reenvío hacia el backend generativo publicado y control de origen para la interfaz de GitHub Pages. La asignación del subdominio se realizará cuando Cloudflare marque la zona como activa.

## Fuentes

[1] [Cloudflare Workers — Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)

[2] [Render — Deploy for Free](https://render.com/docs/free)

[3] [Render — Custom Domains](https://render.com/docs/custom-domains)

[4] [Railway — Domains](https://docs.railway.com/networking/domains)

[5] [Cloudflare Workers — Limits](https://developers.cloudflare.com/workers/platform/limits/)

[6] [Cloudflare Workers — Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)

[7] [Cloudflare Workers — CORS header proxy](https://developers.cloudflare.com/workers/examples/cors-header-proxy/)
