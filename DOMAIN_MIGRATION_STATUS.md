# Estado de migración del dominio público

**Actualizado:** 17 de agosto de 2026

## Configuración aplicada

| Componente | Estado verificado |
| --- | --- |
| Dominio principal de GitHub Pages | `textoavoz.xyz` está guardado como dominio personalizado. |
| DNS del dominio raíz | Los cuatro registros A oficiales de GitHub Pages (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`) quedaron en modo **Proxied** en Cloudflare. Esto permite que el tráfico del sitio público pase por el borde de Cloudflare y reciba HTTPS y redirecciones. |
| Acceso alternativo | `www.textoavoz.xyz` es un CNAME hacia `eduai-lab-source.github.io` y quedó en modo **Proxied** junto con el dominio raíz. |
| API del chat | `api.textoavoz.xyz` continúa vinculado al Worker `eduai-api`. |
| GitHub Pages | La publicación está construida desde la rama `gh-pages` y muestra `http://textoavoz.xyz/`. |
| Verificación HTTPS | Cloudflare muestra certificados Universal y Advanced activos para `textoavoz.xyz` y `*.textoavoz.xyz`, con vencimiento gestionado el 15 de noviembre de 2026. La opción **Always Use HTTPS** quedó activada. La comprobación externa de HTTP ya devuelve una redirección `301` de Cloudflare hacia HTTPS, y el navegador carga `https://textoavoz.xyz` correctamente. |
| Interfaz pública | Se verificó desde el navegador que `https://textoavoz.xyz/` carga la interfaz completa de Edu AI, el historial y el compositor conversacional sin advertencia de conexión no segura. |
| Cliente publicado | La rama `gh-pages` publicó el paquete que resuelve `api.textoavoz.xyz` desde `textoavoz.xyz` y `www.textoavoz.xyz`; queda pendiente la comprobación visual de una respuesta tras crear un hilo nuevo. |
| Conversación desde dominio oficial | Se creó un hilo nuevo en `https://textoavoz.xyz/` y Edu AI respondió correctamente: “dominio oficial confirmado.” |

## Próxima validación

Se recomienda una comprobación diferida desde redes externas para confirmar la propagación total del certificado de borde. El dominio público, el proxy y la redirección HTTPS ya quedaron configurados; la API `https://api.textoavoz.xyz` continúa protegida por su Worker.

## Validación de gestión de conversaciones

La vista aislada de desarrollo confirma que el historial muestra un control de eliminación con etiqueta accesible. Al usarlo, se abre un diálogo explícito con el título **Eliminar conversación**, una advertencia de borrado permanente y las acciones diferenciadas **Cancelar** y **Eliminar**. La opción **Cancelar** conserva el hilo sin cambios. También se creó un segundo hilo de prueba y se eliminó el hilo activo: el historial pasó al hilo restante sin bloqueo ni estado inválido. Las pruebas unitarias cubren el borrado y la selección de una conversación válida posterior.

## Validación trilingüe

En la vista aislada se comprobó el selector persistente y la jerarquía visual de la interfaz en español, inglés y ruso. La navegación, el historial, el encabezado, las sugerencias y las advertencias se adaptan al idioma elegido sin alterar la composición ni el funcionamiento del chat. El contenido previo de una conversación se conserva tal como fue escrito, lo que evita modificar el texto histórico del usuario al cambiar el idioma de la interfaz.

## Cierre de validación visual

La vista móvil de 375 × 812 confirma que el encabezado compacto, el acceso al historial, las sugerencias, los mensajes y el compositor conservan jerarquía, márgenes táctiles y legibilidad. Además, al abrir `http://textoavoz.xyz/` en navegador, la navegación termina automáticamente en `https://textoavoz.xyz/`, donde la interfaz oficial carga correctamente sin advertencia de conexión insegura.
