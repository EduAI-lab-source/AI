# Estado de publicación de Edu AI

Última comprobación: 17 de agosto de 2026.

| Componente | Estado comprobado | Dirección |
| --- | --- | --- |
| Interfaz estática | Compilación de GitHub Pages finalizada en el commit `2853c47`. | `https://eduai-lab-source.github.io/AI/` |
| Backend conversacional | El procedimiento de Edu AI responde correctamente detrás de una puerta privada de Cloudflare; la conexión Worker → backend usa una clave compartida que no se publica. | `https://edusearch-9qua9exp.manus.space` |
| Conversación pública | Se envió un mensaje de validación desde el enlace público y Edu AI respondió correctamente: “Hola, soy Edu AI; un gusto acompañarte hoy.” | `https://eduai-lab-source.github.io/AI/?v=2853c47` |
| Worker temporal | El Worker `eduai-api` está desplegado, acepta únicamente el origen de GitHub Pages y responde una conversación real. | `https://eduai-api.edufirevip.workers.dev` |
| Dominio profesional | Cloudflare aceptó la asignación de `api.textoavoz.xyz` al Worker, pero su zona permanece en estado `pending`; los resolvedores públicos todavía observan los nameservers anteriores de Hostinger. | `api.textoavoz.xyz` |

> GitHub Pages entrega únicamente la interfaz. El modelo y sus credenciales permanecen en el backend publicado, fuera del navegador.

## Alcance de disponibilidad

El backend publicado está operativo y respondió correctamente durante la comprobación indicada arriba. Su continuidad depende de que la publicación y el proveedor de alojamiento permanezcan disponibles; por ello este estado no constituye una garantía de disponibilidad indefinida. La siguiente medida de identidad y continuidad es vincular `api.textoavoz.xyz` mediante el flujo oficial de dominio personalizado, antes de añadir registros DNS en Hostinger.

La asignación del dominio personalizado ya fue solicitada directamente al Worker. Cloudflare deberá detectar públicamente los nameservers `carioca.ns.cloudflare.com` y `dakota.ns.cloudflare.com` antes de servir HTTPS en `api.textoavoz.xyz`; hasta entonces, GitHub Pages debe conservar una ruta de Worker válida para no interrumpir la conversación.
