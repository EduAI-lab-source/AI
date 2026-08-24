# Autosuficiencia de la interfaz de Edu AI

## Qué queda dentro de la publicación estática

La portada, navegación, estilos, icono de Edu AI, favicon, hojas de estilo, JavaScript compilado, contenido editorial, páginas informativas, selector base de idioma y preferencias locales se sirven desde la publicación de `textoavoz.xyz`. La interfaz utiliza la tipografía disponible en el propio dispositivo y no descarga fuentes, anuncios ni recursos visuales de terceros durante la carga inicial. El lector de PDF y su trabajador se empaquetan como activos locales de la publicación, por lo que analizar un PDF no exige cargar una biblioteca desde una CDN externa.

## Qué requiere red solo cuando se usa

La síntesis de voz requiere `api.textoavoz.xyz` y la verificación de Cloudflare antes de crear un audio. El chat requiere el mismo gateway seguro para generar una respuesta. La traducción mundial abre Google Translate únicamente si la persona selecciona un idioma fuera de español, inglés o ruso. El enlace de Facebook solo se abre cuando la persona lo pulsa.

Si el navegador informa que no hay conexión, la interfaz mantiene disponibles la escritura, las notas, el historial local y la lectura del contenido ya cargado. En ese estado no intenta crear audio, cargar Turnstile ni enviar mensajes al chat; muestra una explicación clara y reactiva esas funciones al volver la red.

## Límite operativo honesto

La interfaz estática puede seguir cargando aunque las funciones de voz o chat estén temporalmente inaccesibles. No obstante, el dominio, GitHub Pages, Cloudflare y las funciones generativas siguen siendo servicios de red; ningún alojamiento gratuito permite garantizar disponibilidad absoluta ante fallos de proveedor, DNS, navegador o conectividad. Las pruebas de compilación, la comprobación de activos locales y la revisión del dominio público se mantienen como controles antes de cada actualización.
