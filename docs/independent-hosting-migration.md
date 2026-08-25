# Migración de Edu AI a infraestructura controlada por el propietario

## Objetivo operativo

Edu AI conservará `textoavoz.xyz`, su interfaz estática, el estudio de voz, el chat, la sincronización cifrada y el canal privado de sugerencias. La meta es que el dominio público use únicamente recursos configurados en las cuentas del propietario: GitHub para los archivos estáticos, Cloudflare para la API, la base de datos y la inferencia, y Resend para el correo transaccional. Ninguna credencial se guarda en Git ni se entrega al navegador.

## Inventario confirmado

| Función | Estado actual | Dependencia a retirar | Destino previsto |
| --- | --- | --- | --- |
| Interfaz y dominio | GitHub Pages y `textoavoz.xyz` | Ninguna para la carga estática | Se conserva sin cambios visuales |
| API pública | Worker `api.textoavoz.xyz` | Reenvíos remotos retirados | El Worker atiende directamente las funciones públicas conservadas |
| Chat | Workers AI mediante el Worker | Backend y modelo administrados retirados | `@cf/meta/llama-3.1-8b-instruct-fast`, D1 y reglas de Edu AI propias |
| Texto a voz | Workers AI + D1 | Reserva de cuota remota retirada | Reserva atómica y límites actuales en D1 |
| Sugerencias | Worker + D1 + Resend | API, almacenamiento y aviso interno administrados retirados | Mismo formulario, límite y antispam bajo control del propietario |
| Sincronización cifrada | Worker + D1 | API y base de datos remotas retiradas | Se conserva el cifrado de extremo a extremo del navegador |
| Cuenta opcional | Retirada del flujo público | Inicio de sesión administrado | Código privado de sincronización sin cuenta ni cookies externas |

## Diseño objetivo

El Worker actual se mantiene como única puerta pública de `api.textoavoz.xyz`. Se le añadirán una base D1 llamada para Edu AI, un enlace de Workers AI y secretos cifrados para Resend. D1 usa semántica SQL tipo SQLite y puede ser consultada desde Workers; Cloudflare también incorpora recuperación puntual, por lo que se adapta a los registros pequeños y operativos de Edu AI.[1]

La migración se hará de forma aditiva: cada ruta nueva se prueba primero detrás del mismo dominio y con los mismos contratos de respuesta. Solo después se retira el reenvío correspondiente. El sistema de voz conservará el modelo y el límite visibles actuales; únicamente cambiará el lugar donde se registra la cuota. El chat conservará sus instrucciones, el tono de Edu AI y la respuesta no partidista; se probará con español, inglés y ruso antes de retirar el origen anterior.

Workers AI proporciona modelos de texto ejecutados sin servidor dentro de la cuenta de Cloudflare.[2] La evaluación inicial de GLM devolvió indisponibilidad en producción, por lo que el chat publicado utiliza `@cf/meta/llama-3.1-8b-instruct-fast`, que respondió correctamente bajo el contrato tRPC de Edu AI. Este modelo se mantiene como la selección activa hasta que otra alternativa se compruebe en producción sin degradar la experiencia pública.

Las tres credenciales de correo existentes se almacenarán como secretos cifrados del Worker y se accederán solo desde el servidor. Cloudflare documenta que los secretos no deben ponerse como variables de texto plano ni incluirse en el repositorio; la integración oficial con Resend sigue este mismo patrón.[3] [4]

## Reversión y continuidad

Antes de cambiar una ruta se conserva un checkpoint del código y la compilación estática publicada. Las rutas se migran una por una: sugerencias, cuota de voz, sincronización/enlaces y chat. Si una prueba pública falla, el Worker vuelve a su ruta anterior sin modificar el frontend ni el dominio. Los datos existentes se exportan o copian de forma cifrada/privada antes de que su origen deje de ser usado.

## Recursos propios preparados

El 25 de agosto de 2026 se creó la base D1 `edu-ai-core` en la cuenta de Cloudflare del propietario y se conectó al Worker público `eduai-api` con el enlace `EDU_AI_DB`. La base contiene, aún sin datos de visitantes, las tablas privadas para sugerencias, límites temporales, cuota diaria de voz, copias cifradas y enlaces de aprendizaje. Esta preparación no modificó ninguna ruta pública ni cambió el comportamiento de la web.

También se prepararon secretos cifrados exclusivos para la entrega de sugerencias: una credencial nueva de Resend limitada al envío desde el dominio verificado, el destinatario privado y el remitente verificado. Los valores no se incluyeron en el código, documentación ni interfaz pública. Hasta que se publique el código de la ruta propia, el sitio continúa usando su flujo anterior.

El código desplegable del Worker quedó versionado en el repositorio privado `EduAI-lab-source/eduai-api-worker` y Cloudflare se conectó a la rama `main`. La compilación remota instala dependencias, ejecuta la prueba del Worker y publica con Wrangler; cada cambio posterior en esa rama deja una trazabilidad independiente de Manus. La activación inicial de la compilación se encuentra en curso y debe verificarse antes de declarar migrada una ruta pública.

La ruta pública de sugerencias fue comprobada en `api.textoavoz.xyz`: el preflight responde únicamente al origen oficial, la trampa antispam devuelve una aceptación sin persistir ni enviar correo y una única prueba controlada se guardó en D1 con las banderas privadas de notificación y entrega activadas. El formulario público ahora usa el mismo dominio propio del chat y la voz, sin una llamada directa al backend administrado de Manus.

La reserva de voz también se trasladó al Worker: conserva un audio gratuito diario de hasta 650 caracteres por visitante y el cupo compartido de 3.000 caracteres, con identidad de red cifrada y contadores en D1. La verificación Turnstile continúa ocurriendo antes de cualquier reserva y las pruebas del gateway cubren síntesis, segundo intento bloqueado y rechazo de un token no válido. Ya no se consulta la reserva de voz del backend administrado.

El chat se ejecuta ahora con Workers AI dentro del mismo Worker del propietario. Conserva el contrato tRPC, el contexto breve de conversación, las respuestas inmediatas, la identidad de Edu AI y la barrera multilingüe de neutralidad política antes de cualquier inferencia. El límite de frecuencia usa `chat_rate_limits` en D1 y una huella de red cifrada. Se verificó una respuesta real en `api.textoavoz.xyz` desde el modelo rápido multilingüe de Workers AI; el backend administrado ya no recibe solicitudes de chat.

La interfaz pública actualizada se comprobó en `https://textoavoz.xyz`: el acceso «Enviar sugerencia al creador» permanece debajo de «Mi espacio de aprendizaje», no expone el correo privado y el estudio de voz mantiene sus voces, límite visible y verificación de seguridad.

El diálogo publicado confirma el alcance previsto: solicita únicamente «Tu nombre» y «Tu idea o sugerencia», explica que el correo destinatario no se muestra y no revela direcciones, claves ni controles administrativos.

La copia privada entre dispositivos también opera directamente en D1. El navegador conserva el cifrado AES-GCM y envía únicamente la carga opaca ligada a su código privado; una comprobación de escritura y recuperación en `api.textoavoz.xyz` confirmó el contrato sin una llamada al backend anterior. Las rutas de sesión, OAuth y sincronización de cuenta administrada fueron retiradas del Worker y del cliente porque el flujo publicado usa el código privado de sincronización, que no requiere cuenta ni cookies externas.

La comprobación final de `textoavoz.xyz` confirmó que el estudio de voz, el acceso al espacio de aprendizaje y el chat permanecen visibles después de publicar la compilación sin transporte de sesión administrada. El formulario «Enviar sugerencia al creador» continúa presentando exclusivamente «Tu nombre» y «Tu idea o sugerencia», sin mostrar el correo destinatario. La API propia respondió al chat normal, aplicó el límite político local y descartó correctamente una petición con la trampa antispam; no se volvió a enviar una sugerencia real durante esta comprobación.

## Límites transparentes

La independencia significa que las cuentas, el código, los secretos y la configuración quedan bajo control del propietario; no elimina la dependencia técnica de proveedores de nube, DNS, correo o inferencia. Workers AI incluye una asignación diaria gratuita y, por encima de ella, aplica consumo por uso según el modelo.[5] Por ello se conservarán los límites de voz, el control de frecuencia y los mensajes claros de disponibilidad.

## Referencias

[1]: https://developers.cloudflare.com/d1/ "Cloudflare D1"
[2]: https://developers.cloudflare.com/workers-ai/models/ "Catálogo de Workers AI"
[3]: https://developers.cloudflare.com/workers/configuration/secrets/ "Secretos de Cloudflare Workers"
[4]: https://developers.cloudflare.com/workers/tutorials/send-emails-with-resend/ "Enviar correos con Resend desde Workers"
[5]: https://developers.cloudflare.com/workers-ai/platform/pricing/ "Precios de Workers AI"
