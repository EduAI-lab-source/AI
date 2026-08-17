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

## Espacio de aprendizaje

La interfaz incluye un espacio personal con una biblioteca editorial de recomendaciones, estados de lectura y enlaces de consulta; un cuaderno de notas persistente en el navegador; herramientas rápidas para enviar encargos a Edu AI; rutas de estudio; preferencias de estilo de respuesta; lectura en voz alta cuando el navegador la permite; un reto semanal y una tarjeta de aprendizaje compartible. Los datos personales de lectura, notas y preferencias se conservan localmente en el navegador del visitante.

El ícono de Facebook lleva al perfil oficial configurado. Discord no se muestra mientras no exista una invitación pública verificable, para evitar enlaces sin destino.

## Actualizar la interfaz

1. Ejecuta `pnpm build:pages` para crear el contenido estático.
2. Sube el código fuente a `main`.
3. Publica el contenido compilado en la rama `gh-pages`.
4. Si existe caché en el navegador, abre el enlace con una recarga completa mediante **Ctrl/Cmd + Shift + R**.

> GitHub Pages hospeda la interfaz estática. Las respuestas generativas pasan por `api.textoavoz.xyz` y dependen del backend protegido, que debe permanecer publicado para que Edu AI pueda responder desde el enlace público.

## Principio de seguridad

No agregues claves de modelos, proveedores de IA o secretos al repositorio, a la rama `gh-pages` ni a variables expuestas como `VITE_*`. El backend publicado es el único lugar donde se ejecuta la integración con el modelo.
