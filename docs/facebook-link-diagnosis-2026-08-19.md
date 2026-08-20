# Diagnóstico de enlace de Facebook — 19 de agosto de 2026

La URL canónica `https://www.facebook.com/EduardovipJ` abre correctamente el perfil de Eduardo J. Plaza en una sesión autenticada de escritorio. Sin embargo, una comprobación con agente móvil sin sesión se redirige a `m.facebook.com/login` y devuelve un estado 400. Esto indica que el acceso público móvil puede depender del flujo de autenticación que Facebook aplique al perfil, algo que la web de Edu AI no controla.

La corrección del sitio debe conservar una navegación explícita en la misma pestaña, usar una URL canónica con barra final y evitar cualquier capa intermedia o ventana emergente. También debe mostrar una alternativa clara de copia de enlace en la página de contacto, para que el visitante pueda abrir el perfil directamente en la aplicación de Facebook o en su navegador si el proveedor externo interrumpe la carga.
