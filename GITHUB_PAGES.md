# Edu AI en GitHub Pages

La interfaz pública de Edu AI se publica desde la rama `gh-pages` del repositorio. Esta rama contiene únicamente archivos estáticos: nunca contiene claves, tokens ni credenciales de IA.

## Arquitectura publicada

| Parte | Dirección | Responsabilidad |
| --- | --- | --- |
| Interfaz pública oficial | `https://textoavoz.xyz/` | Muestra el chat, conserva los hilos en el navegador y permite elegir español, inglés o ruso. |
| Acceso alternativo | `https://www.textoavoz.xyz/` | Redirige de forma segura a `https://textoavoz.xyz/`. |
| Publicación de respaldo | `https://eduai-lab-source.github.io/AI/` | Sigue sirviendo la misma interfaz estática de GitHub Pages. |
| Gateway público | `https://api.textoavoz.xyz` | Worker de Cloudflare que acepta los orígenes públicos de Edu AI, reenvía únicamente el procedimiento conversacional y no expone credenciales. |
| Backend protegido | `https://edusearch-9qua9exp.manus.space` | Ejecuta el procedimiento tRPC de Edu AI y mantiene las credenciales del modelo y la clave interna fuera del navegador. |

El cliente reconoce automáticamente los dominios públicos de Edu AI y se comunica con `https://api.textoavoz.xyz`. Las solicitudes se limitan a `textoavoz.xyz`, `www.textoavoz.xyz` y la publicación de GitHub Pages, sin incluir credenciales de servidor en el navegador. El Worker añade internamente una clave privada para el backend, por lo que los accesos directos al procedimiento conversacional quedan rechazados.

## Actualizar la interfaz

1. Ejecuta `pnpm build:pages` para crear el contenido estático.
2. Sube el código fuente a `main`.
3. Publica el contenido compilado en la rama `gh-pages`.
4. Si existe caché en el navegador, abre el enlace con una recarga completa mediante **Ctrl/Cmd + Shift + R**.

> GitHub Pages hospeda la interfaz estática. Las respuestas generativas pasan por `api.textoavoz.xyz` y dependen del backend protegido, que debe permanecer publicado para que Edu AI pueda responder desde el enlace público.

## Principio de seguridad

No agregues claves de modelos, proveedores de IA o secretos al repositorio, a la rama `gh-pages` ni a variables expuestas como `VITE_*`. El backend publicado es el único lugar donde se ejecuta la integración con el modelo.
