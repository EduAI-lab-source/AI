# Estado de migración del dominio público

**Actualizado:** 17 de agosto de 2026

## Configuración aplicada

| Componente | Estado verificado |
| --- | --- |
| Dominio principal de GitHub Pages | `textoavoz.xyz` está guardado como dominio personalizado. |
| DNS del dominio raíz | Los cuatro registros A oficiales de GitHub Pages (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`) quedaron en modo **Proxied** en Cloudflare. Esto permite que el tráfico del sitio público pase por el borde de Cloudflare y reciba HTTPS y redirecciones. |
| Acceso alternativo | `www.textoavoz.xyz` es un CNAME hacia `eduai-lab-source.github.io` y quedó en modo **Proxied** junto con el dominio raíz. |
| API del chat | `api.textoavoz.xyz` continúa vinculado al Worker `eduai-api`. |
| Sincronización privada | El Worker también permite únicamente `workspace.sync`; el navegador cifra cada instantánea con AES-GCM antes de enviarla y el código de recuperación nunca se transmite al servidor. |
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

## Diagnóstico posterior de advertencia HTTPS

La captura enviada por el usuario muestra que una sesión de navegador aún presentó el indicador "No seguro" para `textoavoz.xyz`. La comprobación independiente posterior confirma que el DNS público resuelve a la red de Cloudflare tanto por IPv4 como por IPv6; `http://textoavoz.xyz/` responde con redirección 301 a HTTPS; y el certificado presentado mediante SNI para el dominio raíz es válido, emitido por Google Trust Services, con vigencia del 17 de agosto al 15 de noviembre de 2026 e incluye `textoavoz.xyz` en sus nombres alternativos. En Cloudflare, los certificados Advanced y Universal del dominio figuran como activos y la redirección "Always Use HTTPS" está habilitada. Se inició el refuerzo HSTS de alcance conservador para minimizar futuras aperturas por HTTP sin incluir subdominios.

El asistente de Cloudflare requiere una casilla explícita de reconocimiento antes de desbloquear la configuración de HSTS. La política no se ha guardado todavía: se mantendrá un alcance sin subdominios ni precarga para no comprometer servicios futuros que puedan necesitar una configuración independiente.

### Refuerzo HSTS aplicado — 17 de agosto de 2026

Se activó HTTP Strict Transport Security (HSTS) en Cloudflare exclusivamente para el dominio principal. La política usa el valor recomendado de seis meses (`max-age=15552000`), mantiene `includeSubDomains` y `preload` desactivados, y no modifica los subdominios ni el Worker de `api.textoavoz.xyz`. La comprobación exterior posterior confirmó: `http://textoavoz.xyz/` responde `301` hacia `https://textoavoz.xyz/`; `https://textoavoz.xyz/` responde `200` desde Cloudflare; y la respuesta HTTPS incluye `Strict-Transport-Security: max-age=15552000`. El certificado del dominio raíz continúa válido y activo.

Una nueva navegación realizada dentro del navegador conectado del usuario, tanto con la URL HTTPS directa como con un parámetro de consulta de verificación, terminó en `https://textoavoz.xyz/` y cargó correctamente la interfaz pública. Esto confirma que la sesión conectada puede resolver y abrir la versión HTTPS actual; la advertencia mostrada en la captura corresponde probablemente a una pestaña o resolución DNS almacenada antes del cambio de proxy.

La verificación posterior abrió explícitamente `http://textoavoz.xyz/` en el mismo navegador conectado y la navegación terminó de inmediato en `https://textoavoz.xyz/`, con la interfaz de Edu AI cargada. Las consultas DNS sobre HTTPS de Google y Cloudflare resolvieron tanto el dominio raíz como `www` a las direcciones de Cloudflare (`104.21.16.15` y `172.67.209.196`), sin devolver las IP históricas de GitHub Pages. La auditoría del HTML publicado no identificó recursos funcionales mediante HTTP; el certificado presentado para el dominio principal es válido, emitido por Google Trust Services y vigente hasta el 15 de noviembre de 2026.

## Auditoría de contenido mixto — 17 de agosto de 2026

La captura más reciente confirma que Chrome reconoce el certificado como válido, pero marca la conexión como no segura. En Cloudflare se comprobó que los certificados Advanced y Universal siguen activos, HSTS está activo y **Automatic HTTPS Rewrites** estaba desactivado. Se activó esta protección para actualizar recursos o enlaces HTTP que dispongan de una versión HTTPS y evitar que contenido mixto degrade el indicador de seguridad. Una nueva carga de `https://textoavoz.xyz/?mixed-content-fix=20260817` se abrió correctamente en el navegador conectado después del cambio.

## Validación de sincronización privada — 17 de agosto de 2026

La versión publicada de `https://textoavoz.xyz/` muestra, dentro de **Mi espacio → Progreso**, el módulo **Copia privada entre dispositivos** con un campo de código, y acciones separadas para crear, copiar, guardar y recuperar. La generación del código desde la interfaz del navegador confirmó el estado informativo de creación y produjo un identificador URL-seguro de dos partes, sin mostrar ninguna clave del servidor. La acción **Guardar copia cifrada** se completó desde esa interfaz y mostró la confirmación de que la copia quedó disponible para usar con el mismo código en otro dispositivo. Para validar la restauración se añadió temporalmente una actividad local, que elevó la racha y la meta semanal de `0/3` a `1/3`; al recuperar la instantánea cifrada los valores volvieron a `0/3` y la interfaz confirmó la recuperación privada. También se guardó temporalmente una nota en el cuaderno, elevando su contador de `0` a `1`; una segunda recuperación cifrada lo devolvió a `0`, comprobando que se restaura el contenido de aprendizaje además del progreso. Finalmente se cambió de forma temporal el estilo de respuesta de **Con enfoque de estudio** a **Creativo y explorador** y se inició una recuperación final que se completó con el estado de éxito mostrado en la interfaz; al volver a Preferencias, el indicador visual confirmó la restauración de **Con enfoque de estudio**. Para validar el historial, se creó de manera temporal un segundo hilo —el lateral mostró dos conversaciones— y se recuperó de nuevo la instantánea: el lateral volvió a mostrar un único hilo. La prueba publicada confirma así la restauración de **conversaciones, preferencias, notas y progreso**.
