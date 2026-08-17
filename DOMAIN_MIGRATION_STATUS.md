# Estado de migración del dominio público

**Actualizado:** 17 de agosto de 2026

## Configuración aplicada

| Componente | Estado verificado |
| --- | --- |
| Dominio principal de GitHub Pages | `textoavoz.xyz` está guardado como dominio personalizado. |
| DNS del dominio raíz | Los cuatro registros A oficiales de GitHub Pages (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`) están en Cloudflare como **DNS only**. |
| Acceso alternativo | `www.textoavoz.xyz` es un CNAME DNS-only hacia `eduai-lab-source.github.io`. |
| API del chat | `api.textoavoz.xyz` continúa vinculado al Worker `eduai-api`. |
| GitHub Pages | La publicación está construida desde la rama `gh-pages` y muestra `http://textoavoz.xyz/`. |
| HTTPS | `https://textoavoz.xyz/` responde correctamente por HTTPS. `https://www.textoavoz.xyz/` redirige por HTTPS al dominio principal. |
| Interfaz pública | Se verificó que `https://textoavoz.xyz/` carga la interfaz completa de Edu AI y muestra el compositor conversacional. |
| Cliente publicado | La rama `gh-pages` publicó el paquete que resuelve `api.textoavoz.xyz` desde `textoavoz.xyz` y `www.textoavoz.xyz`; queda pendiente la comprobación visual de una respuesta tras crear un hilo nuevo. |
| Conversación desde dominio oficial | Se creó un hilo nuevo en `https://textoavoz.xyz/` y Edu AI respondió correctamente: “dominio oficial confirmado.” |

## Próxima validación

Cuando GitHub Pages complete la comprobación DNS y habilite el certificado, se debe activar **Enforce HTTPS**, confirmar que `https://textoavoz.xyz` carga Edu AI y verificar una conversación que pase por `https://api.textoavoz.xyz`.
