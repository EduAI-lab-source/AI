# Publicar Edu AI gratis en GitHub Pages

Edu AI está preparado para funcionar como un **sitio estático**. El catálogo, la búsqueda instantánea, los filtros, el ordenamiento, las fichas detalladas y el modo catálogo de Edu AI se publican sin base de datos, sin servidor y sin claves privadas. Esto lo hace apropiado para GitHub Pages.

## Publicación desde una rama estática

La versión pública se publica desde la rama `gh-pages`. Esta rama contiene únicamente la compilación estática, por lo que no necesita base de datos, servidor ni secretos.

1. Abre **Settings → Pages** dentro del repositorio.
2. En **Build and deployment**, elige **Deploy from a branch**.
3. Selecciona la rama `gh-pages` y la carpeta raíz (`/`).
4. GitHub mostrará la URL pública en **Settings → Pages** cuando termine de preparar el sitio.

> GitHub Pages hospeda archivos estáticos. Su disponibilidad, límites y condiciones dependen de GitHub, por lo que no es posible prometer alojamiento indefinido de forma absoluta. Sin embargo, mientras el repositorio, GitHub Pages y sus condiciones sigan activos, el directorio no requiere pagos mensuales, servidor propio ni una base de datos para funcionar.

## Edu AI: identidad y respuestas

El archivo `client/src/data/eduAiProfile.ts` contiene el nombre, la voz, las reglas y ejemplos de **Edu AI**. Puedes editarlo para que el asistente evolucione sin cambiar el resto del sitio.

La publicación estática habilita de inmediato el **modo catálogo**: Edu AI se reconoce por su nombre, responde con tono propio, mantiene el contexto breve de la conversación en la página, recomienda, filtra por necesidad/presupuesto y compara herramientas del directorio.

Para habilitar respuestas generativas abiertas se necesita un endpoint de backend seguro. No coloques jamás una clave de proveedor de IA en el repositorio, en GitHub Pages ni en el navegador. Puedes conectar, más adelante, un endpoint propio que acepte el contrato generado por `createEduAiPayload` en `client/src/lib/eduAi.ts`; el frontend enviará peticiones allí solo si existe `VITE_EDU_AI_ENDPOINT` durante la compilación. Ese endpoint debe proteger su clave como secreto y validar el origen de las solicitudes.

| Capacidad | GitHub Pages estático | Con endpoint seguro opcional |
| --- | --- | --- |
| Catálogo, fichas, búsqueda y filtros | Sí | Sí |
| Identidad y personalidad de Edu AI | Sí | Sí |
| Recomendación y comparación del catálogo | Sí | Sí |
| Contexto breve durante la sesión | Sí | Sí |
| Preguntas abiertas generativas | No | Sí |
| Claves privadas expuestas al visitante | No | No |

## Actualizar el catálogo

Las herramientas viven en `client/src/data/tools.ts`. Para agregar una, conserva los campos obligatorios: `name`, `initials`, `category`, `description`, `pricing`, `officialUrl`, `freePlan`, `pros`, `cons`, `useCases`, `popularity` y `accent`. Edu AI usa automáticamente esos datos para buscar y recomendar.
