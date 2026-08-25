# Migración de Edu AI a infraestructura controlada por el propietario

## Objetivo operativo

Edu AI conservará `textoavoz.xyz`, su interfaz estática, el estudio de voz, el chat, la sincronización cifrada y el canal privado de sugerencias. La meta es que el dominio público use únicamente recursos configurados en las cuentas del propietario: GitHub para los archivos estáticos, Cloudflare para la API, la base de datos y la inferencia, y Resend para el correo transaccional. Ninguna credencial se guarda en Git ni se entrega al navegador.

## Inventario confirmado

| Función | Estado actual | Dependencia a retirar | Destino previsto |
| --- | --- | --- | --- |
| Interfaz y dominio | GitHub Pages y `textoavoz.xyz` | Ninguna para la carga estática | Se conserva sin cambios visuales |
| API pública | Worker `api.textoavoz.xyz` | Reenvía varias rutas a un backend administrado | El Worker atenderá las rutas directamente |
| Chat | El Worker reenvía el chat a un modelo ejecutado fuera de la cuenta del propietario | Backend y modelo administrados | Workers AI con un modelo multilingüe y reglas de Edu AI propias |
| Texto a voz | La generación ya se ejecuta en Workers AI, pero la cuota se consulta fuera de Cloudflare | Reserva de cuota remota | Worker + D1 para la reserva atómica y límites actuales |
| Sugerencias | El cliente llama directamente a un backend administrado; combina aviso interno y correo | API, almacenamiento y aviso interno administrados | Worker + D1 + Resend, con el mismo formulario, límite y antispam |
| Sincronización y enlaces cifrados | El contenido se cifra en el navegador, pero se guarda y comparte desde el backend remoto | API y base de datos remotas | Worker + D1, conservando el cifrado de extremo a extremo |
| Cuenta opcional | Usa autenticación de un proveedor administrado | Inicio de sesión de ese proveedor | Se sustituirá gradualmente por el código privado de sincronización ya existente; no se expondrá ninguna copia cifrada |

## Diseño objetivo

El Worker actual se mantiene como única puerta pública de `api.textoavoz.xyz`. Se le añadirán una base D1 llamada para Edu AI, un enlace de Workers AI y secretos cifrados para Resend. D1 usa semántica SQL tipo SQLite y puede ser consultada desde Workers; Cloudflare también incorpora recuperación puntual, por lo que se adapta a los registros pequeños y operativos de Edu AI.[1]

La migración se hará de forma aditiva: cada ruta nueva se prueba primero detrás del mismo dominio y con los mismos contratos de respuesta. Solo después se retira el reenvío correspondiente. El sistema de voz conservará el modelo y el límite visibles actuales; únicamente cambiará el lugar donde se registra la cuota. El chat conservará sus instrucciones, el tono de Edu AI y la respuesta no partidista; se probará con español, inglés y ruso antes de retirar el origen anterior.

Workers AI proporciona modelos de texto ejecutados sin servidor dentro de la cuenta de Cloudflare. Para el primer paso de chat se evaluará `@cf/zai-org/glm-4.7-flash`, que el catálogo oficial describe como multilingüe y optimizado para diálogo, seguimiento de instrucciones y conversaciones de varios turnos.[2] Si las pruebas no conservan la calidad esperada, se mantendrá el comportamiento actual mientras se compara una alternativa del mismo catálogo; no se cambiará la ruta pública de forma irreversible.

Las tres credenciales de correo existentes se almacenarán como secretos cifrados del Worker y se accederán solo desde el servidor. Cloudflare documenta que los secretos no deben ponerse como variables de texto plano ni incluirse en el repositorio; la integración oficial con Resend sigue este mismo patrón.[3] [4]

## Reversión y continuidad

Antes de cambiar una ruta se conserva un checkpoint del código y la compilación estática publicada. Las rutas se migran una por una: sugerencias, cuota de voz, sincronización/enlaces y chat. Si una prueba pública falla, el Worker vuelve a su ruta anterior sin modificar el frontend ni el dominio. Los datos existentes se exportan o copian de forma cifrada/privada antes de que su origen deje de ser usado.

## Recursos propios preparados

El 25 de agosto de 2026 se creó la base D1 `edu-ai-core` en la cuenta de Cloudflare del propietario y se conectó al Worker público `eduai-api` con el enlace `EDU_AI_DB`. La base contiene, aún sin datos de visitantes, las tablas privadas para sugerencias, límites temporales, cuota diaria de voz, copias cifradas y enlaces de aprendizaje. Esta preparación no modificó ninguna ruta pública ni cambió el comportamiento de la web.

También se prepararon secretos cifrados exclusivos para la entrega de sugerencias: una credencial nueva de Resend limitada al envío desde el dominio verificado, el destinatario privado y el remitente verificado. Los valores no se incluyeron en el código, documentación ni interfaz pública. Hasta que se publique el código de la ruta propia, el sitio continúa usando su flujo anterior.

## Límites transparentes

La independencia significa que las cuentas, el código, los secretos y la configuración quedan bajo control del propietario; no elimina la dependencia técnica de proveedores de nube, DNS, correo o inferencia. Workers AI incluye una asignación diaria gratuita y, por encima de ella, aplica consumo por uso según el modelo.[5] Por ello se conservarán los límites de voz, el control de frecuencia y los mensajes claros de disponibilidad.

## Referencias

[1]: https://developers.cloudflare.com/d1/ "Cloudflare D1"
[2]: https://developers.cloudflare.com/workers-ai/models/ "Catálogo de Workers AI"
[3]: https://developers.cloudflare.com/workers/configuration/secrets/ "Secretos de Cloudflare Workers"
[4]: https://developers.cloudflare.com/workers/tutorials/send-emails-with-resend/ "Enviar correos con Resend desde Workers"
[5]: https://developers.cloudflare.com/workers-ai/platform/pricing/ "Precios de Workers AI"
