# Configuración de correo para sugerencias

El 25 de agosto de 2026 se confirmó una sesión activa de Resend para la cuenta del propietario. La cuenta muestra el panel de correo y aún no registra envíos. No se ha copiado ni almacenado ninguna clave API ni credencial.

La configuración prevista es un remitente verificado bajo `textoavoz.xyz`, con entrega privada a la dirección configurada mediante variables de entorno. La interfaz pública solo solicitará nombre y mensaje; no mostrará ninguna dirección de correo.

El panel de Resend no tenía dominios configurados. Se abrió el flujo de alta de dominio, listo para registrar `textoavoz.xyz` y obtener los registros DNS de verificación. Aún no se han creado ni modificado registros DNS.

`textoavoz.xyz` fue añadido al proyecto de Resend. Resend solicita ahora configurar los registros DNS mediante conexión automática al proveedor o mediante la modalidad manual. Se mantendrá la modalidad manual para revisar y aplicar exclusivamente los registros de correo necesarios.

La configuración manual solicita un TXT DKIM para `resend._domainkey`, un MX y un TXT SPF para el subdominio `send`, además de un TXT DMARC opcional. Los valores completos se copiarán desde el panel de Resend y se añadirán únicamente como registros DNS de correo.

Se comprobó la opción de configuración automática de Resend, pero no abrió una conexión ni modificó registros. La verificación continúa por la modalidad manual y no se han realizado cambios DNS todavía.

La zona DNS de `textoavoz.xyz` se revisó antes de cualquier cambio: contiene los registros de GitHub Pages y el Worker de la API, pero no existen registros DKIM, SPF, MX o DMARC de correo. Los nuevos registros podrán añadirse sin sustituir los existentes.

Se abrió el formulario de nuevo registro de Cloudflare para crear el TXT DKIM de Resend. No se ha guardado el formulario todavía.

El formulario se configuró con el tipo TXT, que es el tipo requerido por el selector DKIM de Resend. Los campos de nombre y contenido continúan vacíos y ningún registro se ha guardado todavía.

El primer registro fue completado para revisión: tipo TXT, nombre `resend._domainkey` y la clave pública DKIM proporcionada por Resend. El valor se cotejó contra el panel de Resend antes del guardado y no modifica los registros web existentes.

El registro DKIM fue guardado correctamente en Cloudflare como DNS only y con TTL automático. La zona sigue conservando intactos los registros de GitHub Pages y de la API.

Se abrió el formulario para el segundo registro requerido y se seleccionará el tipo MX para el subdominio `send`. Aún no se ha creado este registro.

El tipo MX ya fue seleccionado en Cloudflare y el formulario solicita el nombre del subdominio, el servidor de correo y la prioridad. Ningún valor se ha guardado todavía.

El formulario MX contiene el subdominio `send` y el servidor `feedback-smtp.sa-east-1.amazonses.com` que mostró Resend. Falta introducir la prioridad 10 y guardar el registro.

El registro MX fue guardado correctamente en `send.textoavoz.xyz`, con destino `feedback-smtp.sa-east-1.amazonses.com`, prioridad 10, DNS only y TTL automático.

La tabla DNS confirma los dos registros guardados (DKIM y MX) y se abrió un nuevo formulario exclusivamente para el TXT SPF del mismo subdominio `send`.

El tercer formulario se configuró como TXT, que es el tipo requerido para SPF. Los campos permanecen vacíos y no se ha guardado ningún registro adicional.

El registro SPF fue completado para revisión con nombre `send` y valor `v=spf1 include:amazonses.com ~all`, tal como lo indicó Resend. Solo falta guardarlo con TTL automático.

El SPF fue guardado correctamente como un TXT DNS only en `send.textoavoz.xyz` con TTL automático. La zona DNS ahora contiene exactamente los tres registros necesarios que mostró Resend para el envío: DKIM, MX y SPF; no se modificaron registros de la web ni de la API.

Se solicitó la verificación desde Resend. El dominio quedó en estado `Pending` mientras Resend consulta la propagación de Cloudflare para DKIM, MX y SPF; este estado puede tardar algunas horas según Resend.

Se creó una clave dedicada llamada `textoavoz-sugerencias`, limitada a permiso de envío y al dominio `textoavoz.xyz`. La credencial se validó desde el entorno seguro con una petición intencionalmente incompleta a la ruta de envío de Resend: autenticó correctamente sin crear ni enviar un correo. No se registran valores de claves en este documento.

La interfaz fue revisada en escritorio y móvil. El acceso «Enviar sugerencia al creador» aparece debajo de «Mi espacio de aprendizaje» en la barra lateral de escritorio, con jerarquía secundaria y legible; la navegación móvil conserva el acceso dentro del panel lateral sin afectar el estudio de voz.

El diálogo del formulario fue abierto en la previsualización. Expone únicamente los campos «Tu nombre» y «Tu idea o sugerencia», indica que el destinatario no se muestra y no contiene el correo privado. Un intento vacío se mantuvo en validación local y no produjo un envío ni almacenamiento de datos.

Resend verificó `textoavoz.xyz` y confirmó que el dominio está listo para enviar. Se realizó una única prueba de entrega al correo privado configurado, que fue aceptada por Resend; no se usaron datos de visitantes ni se guardó el identificador del envío en el proyecto.
