# Verificación de publicación — experiencia pública sin cuentas

## 17 de agosto de 2026

La rama `gh-pages` recibió el commit `6ab190f`, que contiene la compilación estática sin controles de cuenta. La primera consulta a la API de GitHub Pages reportó la compilación correspondiente como `building`.

La verificación inicial desde el navegador conectado en `https://textoavoz.xyz/` todavía mostraba el botón **“Guardar con cuenta”**, debido a que la nueva compilación seguía en proceso y el navegador conservaba la respuesta anterior.

La API de GitHub Pages confirmó posteriormente el estado `built` para el commit `6ab190f`. Al abrir `https://textoavoz.xyz/?v=6ab190f`, la interfaz mostró únicamente **Mi espacio**, el selector de idioma y el acceso al chat: el botón de cuenta ya no aparece. Con ello queda confirmada la versión pública sin inicio de sesión externo.
