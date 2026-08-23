# Autosuficiencia de la interfaz de Edu AI

## Qué queda dentro de la publicación estática

La portada, navegación, estilos, icono de Edu AI, favicon, hojas de estilo, JavaScript compilado, contenido editorial, páginas informativas, selector base de idioma y preferencias locales se sirven desde la publicación de `textoavoz.xyz`. La interfaz utiliza la tipografía disponible en el propio dispositivo y no descarga fuentes, anuncios ni recursos visuales de terceros durante la carga inicial.

## Qué requiere red solo cuando se usa

La síntesis de voz requiere `api.textoavoz.xyz` y la verificación de Cloudflare antes de crear un audio. El chat requiere el mismo gateway seguro para generar una respuesta. La traducción mundial abre Google Translate únicamente si la persona selecciona un idioma fuera de español, inglés o ruso. El enlace de Facebook solo se abre cuando la persona lo pulsa.

## Límite operativo honesto

La interfaz estática puede seguir cargando aunque las funciones de voz o chat estén temporalmente inaccesibles. No obstante, el dominio, GitHub Pages, Cloudflare y las funciones generativas siguen siendo servicios de red; ningún alojamiento gratuito permite garantizar disponibilidad absoluta ante fallos de proveedor, DNS, navegador o conectividad. Las pruebas de compilación y la revisión del dominio público se mantienen como controles antes de cada actualización.
