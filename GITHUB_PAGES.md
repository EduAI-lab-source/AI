# Edu AI en GitHub Pages

La interfaz pública de Edu AI se publica desde la rama `gh-pages` del repositorio. Esta rama contiene únicamente archivos estáticos: nunca contiene claves, tokens ni credenciales de IA.

## Arquitectura publicada

| Parte | Dirección | Responsabilidad |
| --- | --- | --- |
| Interfaz pública | `https://eduai-lab-source.github.io/AI/` | Muestra el chat, conserva los hilos en el navegador y permite elegir español, inglés o ruso. |
| Backend protegido | `https://edusearch-9qua9exp.manus.space` | Ejecuta el procedimiento tRPC de Edu AI y mantiene las credenciales del modelo fuera del navegador. |

El cliente reconoce automáticamente el dominio de GitHub Pages y se comunica con el backend protegido. Las solicitudes se limitan al origen público configurado y no incluyen credenciales de servidor en el navegador.

## Actualizar la interfaz

1. Ejecuta `pnpm build:pages` para crear el contenido estático.
2. Sube el código fuente a `main`.
3. Publica el contenido compilado en la rama `gh-pages`.
4. Si existe caché en el navegador, abre el enlace con una recarga completa mediante **Ctrl/Cmd + Shift + R**.

> GitHub Pages hospeda la interfaz estática. Las respuestas generativas dependen del backend protegido, que debe permanecer publicado para que Edu AI pueda responder desde el enlace público.

## Principio de seguridad

No agregues claves de modelos, proveedores de IA o secretos al repositorio, a la rama `gh-pages` ni a variables expuestas como `VITE_*`. El backend publicado es el único lugar donde se ejecuta la integración con el modelo.
