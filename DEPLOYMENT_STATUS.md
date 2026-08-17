# Estado de publicación de Edu AI

Última comprobación: 17 de agosto de 2026.

| Componente | Estado comprobado | Dirección |
| --- | --- | --- |
| Interfaz pública oficial | Edu AI se entrega desde el dominio raíz con HTTPS; GitHub Pages conserva la publicación estática de respaldo. | `https://textoavoz.xyz/` |
| Backend conversacional | El procedimiento de Edu AI responde correctamente detrás de una puerta privada de Cloudflare; la conexión Worker → backend usa una clave compartida que no se publica. | `https://edusearch-9qua9exp.manus.space` |
| Conversación pública | Se envió un mensaje de validación desde el enlace público y Edu AI respondió correctamente: “Hola, soy Edu AI; un gusto acompañarte hoy.” | `https://eduai-lab-source.github.io/AI/?v=2853c47` |
| Publicación final | GitHub Pages ya sirve el paquete que apunta a `api.textoavoz.xyz`; el 17 de agosto de 2026 se envió desde la interfaz pública “Responde únicamente: conversación pública confirmada.” y Edu AI respondió “conversación pública confirmada.” | `https://eduai-lab-source.github.io/AI/?v=6f5101a` |
| Worker de Cloudflare | El Worker `eduai-api` está desplegado, acepta los dominios públicos de Edu AI y reenvía el chat con una clave privada. | `https://api.textoavoz.xyz` |
| Dominio profesional | La zona de Cloudflare está activa; `api.textoavoz.xyz` tiene DNS y HTTPS operativos, con preflight CORS y respuesta conversacional comprobados. | `https://api.textoavoz.xyz` |
| Dominio principal | `textoavoz.xyz` responde por HTTPS y `www.textoavoz.xyz` redirige al dominio principal. | `https://textoavoz.xyz/` |
| Espacio de aprendizaje | Biblioteca editorial transparente, estados de lectura, notas locales, herramientas, modo de estudio, preferencias, lectura en voz alta, reto semanal y tarjeta para compartir. | `https://textoavoz.xyz/` |

> GitHub Pages entrega únicamente la interfaz. El modelo y sus credenciales permanecen en el backend publicado, fuera del navegador.

## Alcance de disponibilidad

El backend publicado está operativo y respondió correctamente durante la comprobación indicada arriba. Su continuidad depende de que la publicación y el proveedor de alojamiento permanezcan disponibles; por ello este estado no constituye una garantía de disponibilidad indefinida. La siguiente medida de identidad y continuidad es vincular `api.textoavoz.xyz` mediante el flujo oficial de dominio personalizado, antes de añadir registros DNS en Hostinger.

La asignación del dominio personalizado fue realizada directamente al Worker. Cloudflare detectó los nameservers `carioca.ns.cloudflare.com` y `dakota.ns.cloudflare.com`, activó la zona y emitió el acceso HTTPS para `api.textoavoz.xyz`. GitHub Pages y el dominio principal se conectan a esa URL sin incluir credenciales del modelo.
