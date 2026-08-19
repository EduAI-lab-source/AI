# Edu AI — Directorio de herramientas de IA (TODO)

## Base de datos y backend
- [x] Tabla `tools` en schema con todos los campos (no aplicable: el catálogo estático en `tools.ts` es la fuente compatible con GitHub Pages)
- [x] Aplicar y exponer la sincronización privada de instantáneas cifradas entre dispositivos
- [x] Publicar la nueva interfaz de sincronización privada en `gh-pages` / `textoavoz.xyz` y confirmar que el control aparece en producción
- [x] Verificar de extremo a extremo el flujo de guardar y recuperar una copia cifrada contra `api.textoavoz.xyz`
- [x] Probar en `https://textoavoz.xyz/` el flujo real de sincronización: crear código, guardar copia cifrada y recuperar/restaurar desde la interfaz publicada
- [x] Verificar en navegador que una instantánea restaurada actualiza conversaciones, preferencias y notas tras descifrar la carga remota
- [x] Añadir evidencia automatizada y accesible de la preferencia activa restaurada desde una instantánea cifrada
- [x] Publicar el marcado accesible de preferencias y verificar el estado restaurado en la interfaz oficial
- [x] Guardar un checkpoint de Manus que incluya la sincronización cifrada, las pruebas y la verificación de accesibilidad
- [x] Migración aplicada a la base de datos (no aplicable: la publicación estática no depende de una base de datos)
- [x] Seed de 40+ herramientas curadas con datos completos
- [x] Helper de consultas en server/db.ts (no aplicable: la búsqueda instantánea opera de forma local en el navegador)
- [x] Procedimientos tRPC: listar, buscar (nombre/descripción/categoría), por categoría, detalle por slug (no aplicable: las rutas y filtros estáticos son compatibles con GitHub Pages)
- [x] Procedimiento tRPC para Edu AI: chat conversacional con IA sobre el catálogo (modo catálogo local implementado; una IA generativa requiere backend seguro opcional)
- [x] Definir identidad, límites y tono de respuesta propios de Edu AI
- [x] Incluir una instrucción central que obligue a Edu AI a presentarse y actuar como "Edu AI", sin atribuirse la identidad del modelo subyacente
- [x] Definir voz propia: educativa, clara, honesta, cercana y enfocada en ayudar a elegir herramientas de IA
- [x] Preparar archivo editable de personalidad, reglas, conocimientos y ejemplos de Edu AI para que el dueño pueda evolucionarlo
- [x] Edu AI recomienda herramientas según necesidad, presupuesto y nivel de experiencia
- [x] Edu AI compara herramientas del catálogo y explica diferencias prácticas
- [x] Edu AI mantiene contexto de una conversación breve para responder preguntas de seguimiento
- [x] Diseño preparado para que el dueño pueda ampliar el conocimiento de Edu AI con contenido propio en una siguiente versión
- [x] Catálogo, búsqueda, filtros, orden y detalles funcionan completamente como sitio estático en GitHub Pages
- [x] Preparar configuración de build y documentación de despliegue para GitHub Pages
- [x] Diseñar Edu AI sin exponer claves privadas, con modo catálogo local y punto de integración opcional para IA generativa desde backend seguro
- [x] Tests vitest para routers y búsqueda

## Frontend
- [x] Tema global elegante (fuentes Google, paleta refinada, index.css)
- [x] Home con barra de búsqueda instantánea estilo Google (filtrado en tiempo real, sin botón)
- [x] Navegación por categorías destacadas en la home con contador de resultados
- [x] Contador total de herramientas visible
- [x] Filtros por categoría: Chatbots, Diseño, Video, Audio, Productividad, Programación, Automatización, Traducción (con contadores)
- [x] Fichas de herramientas con: nombre, ícono, categoría, descripción, precio (gratis/pago/freemium), enlace oficial, puntuación
- [x] Ordenamiento por nombre, categoría, precio y popularidad
- [x] Página de detalle por herramienta: pros, contras, plan gratuito, casos de uso, enlace directo
- [x] Sección "Edu AI": chat conversacional con IA que responde sobre las herramientas
- [x] Layout responsive (móvil, tablet, escritorio)
- [x] Página About/Guía breve de cómo usar el directorio

## Calidad
- [x] Sin errores TypeScript, tests pasan
- [x] Verificación visual en desktop y móvil
- [x] Checkpoint y entrega

## Ajustes de completitud detectados
- [x] Añadir puntuación editorial transparente a cada herramienta y mostrarla en fichas y detalle
- [x] Mostrar enlace oficial directo junto a cada resultado sin retirar el acceso a la ficha interna
- [x] Añadir bloque editable de conocimiento editorial al perfil de Edu AI
- [x] Adaptar recomendaciones de Edu AI por nivel de experiencia (principiante, intermedio o avanzado)
- [x] Usar el historial reciente en el modo catálogo para responder preguntas de seguimiento
- [x] Crear una ruta dedicada de guía y enlazarla desde la navegación

## Validaciones finales pendientes
- [x] Añadir pruebas Vitest para búsqueda, filtros, ordenamiento y selección de detalle del catálogo
- [x] Agregar un bloque `editorialKnowledge` editable al perfil de Edu AI e incorporarlo al contexto generado

## Cierre de entrega
- [x] Guardar un checkpoint de la versión final del proyecto
- [x] Entregar formalmente la versión y explicar la publicación en GitHub Pages

## Publicación en GitHub Pages
- [x] Verificar el estado final del repositorio y de la compilación estática
- [x] Crear el repositorio público `edu-ai` y subir la rama `main`
- [x] Activar el despliegue con GitHub Pages y confirmar la URL publicada
- [x] Entregar el enlace público de Edu AI

## Verificaciones de publicación
- [x] Confirmar en GitHub la disponibilidad o creación del repositorio público `edu-ai`
- [x] Incluir los cambios locales de publicación en el commit que se envíe a GitHub

## Método alternativo de GitHub Pages
- [x] Publicar el código fuente sin el workflow restringido por el token
- [x] Subir la compilación estática a la rama `gh-pages`
- [x] Configurar GitHub Pages para servir la rama `gh-pages`

## Cambio de dirección pública
- [x] Renombrar el repositorio de `edu-ai` a `EdwardAI` (cambio intermedio completado antes del nombre final `EdAI`)
- [x] Confirmar que GitHub Pages publica desde `gh-pages` tras el cambio
- [x] Verificar `https://compressnow.github.io/EdwardAI/` y comunicar el enlace actualizado (dirección sustituida posteriormente)

## Cambio final de nombre
- [x] Renombrar el repositorio de `EdwardAI` a `EdAI`
- [x] Confirmar GitHub Pages en `https://compressnow.github.io/EdAI/`
- [x] Entregar el enlace actualizado de EdAI

## Cambio de usuario de GitHub
- [x] Comprobar disponibilidad de `EduAI` y registrar el cambio global de usuario (nombre no disponible)
- [x] Actualizar el nombre de usuario de GitHub de `CompressNow` a `EduAI` (no realizado: nombre ocupado)
- [x] Verificar el repositorio EdAI y GitHub Pages bajo el nuevo usuario (resuelto con el nombre alternativo disponible)
- [x] Entregar la nueva URL pública sin `compressnow` (resuelto bajo `EduAI-lab-source`)

## Nombre alternativo seleccionado
- [x] Cambiar el nombre de usuario de GitHub de `CompressNow` a `EduAI-lab` (no realizado: nombre ocupado)
- [x] Verificar `EdAI` y GitHub Pages bajo `EduAI-lab` (resuelto con el nombre alternativo disponible)
- [x] Entregar la URL pública `https://eduai-lab.github.io/EdAI/` (dirección no disponible; sustituida por la final)

## Segundo nombre alternativo disponible
- [x] Cambiar el nombre de usuario de GitHub de `CompressNow` a `EduAI-lab-source`
- [x] Verificar EdAI y GitHub Pages bajo `EduAI-lab-source`
- [x] Entregar la URL pública con el nuevo nombre de usuario

## Enlaces posteriores al cambio de usuario
- [x] Actualizar el enlace público asociado al repositorio EdAI
- [x] Actualizar el remoto local de Git al nuevo propietario del repositorio

## Resultado de disponibilidad
- [x] Confirmar que los nombres `EduAI` y `EduAI-lab` no estaban disponibles en GitHub

## Comunicación de cierre
- [x] Comunicar la nueva URL final de EdAI bajo `EduAI-lab-source`

## Cambio de repositorio a AI
- [x] Comprobar disponibilidad de `AI` como nombre de repositorio público
- [x] Renombrar el repositorio de `EdAI` a `AI`
- [x] Actualizar el remoto local y los metadatos públicos del repositorio
- [x] Confirmar GitHub Pages en `https://eduai-lab-source.github.io/AI/`
- [x] Entregar la nueva dirección pública

## Verificaciones posteriores al renombrado
- [x] Confirmar que todos los remotos locales apuntan a `EduAI-lab-source/AI`
- [x] Confirmar que el enlace público del repositorio es `https://eduai-lab-source.github.io/AI/`
- [x] Comunicar al usuario los enlaces finales de AI

## Transformación a Edu AI independiente
- [x] Retirar del recorrido principal el directorio y las recomendaciones de otras IA
- [x] Definir el propósito, la personalidad y los límites propios de Edu AI
- [x] Rediseñar la pantalla principal como una interfaz conversacional centrada en Edu AI
- [x] Implementar un backend seguro para respuestas generativas y contexto de conversación
- [x] Incorporar memoria de sesión y continuidad en preguntas de seguimiento
- [x] Preparar una base extensible para añadir futuras capacidades de Edu AI
- [x] Probar, publicar y verificar la nueva experiencia conversacional

## Experiencia de chat principal
- [x] Priorizar una conversación continua y natural por encima de catálogo, búsquedas y recomendaciones
- [x] Diseñar una interfaz premium de chat: hilo de mensajes, estado de respuesta, sugerencias y cuadro de composición
- [x] Definir la personalidad conversacional de Edu AI: cálida, clara, curiosa y orientada a ayudar
- [x] Mantener contexto de mensajes recientes y gestionar conversaciones nuevas

## Validación y publicación del chat
- [x] Actualizar el título del navegador para reflejar Edu AI
- [x] Verificar el reinicio de conversación y la memoria de contexto en sesión
- [x] Definir un endpoint protegido para que el chat generativo funcione fuera de la vista previa
- [x] Actualizar la publicación pública sin exponer ninguna clave de IA

## Rediseño visual distintivo y responsivo
- [x] Crear una dirección de arte propia, cálida y memorable para Edu AI, lejos de una interfaz genérica de IA
- [x] Reestructurar el espacio de conversación para reforzar jerarquía, foco y sensación de producto editorial
- [x] Adaptar la navegación, el historial y el compositor para una experiencia móvil nativa y cuidada
- [x] Refinar tipografía, color, superficies, estados de interacción y movimiento con criterios de accesibilidad
- [x] Verificar visualmente el rediseño en computadora y celular

## Corrección de la versión pública
- [x] Subir el nuevo rediseño al repositorio y comprobar que el enlace de GitHub Pages deje de mostrar la interfaz anterior

## Corrección del chat público
- [x] Diagnosticar por qué el chat público interpreta una respuesta HTML como JSON
- [x] Impedir que Edu AI muestre mensajes de error técnicos o respuestas vacías al usuario
- [x] Conectar GitHub Pages a un endpoint generativo seguro antes de habilitar el envío de mensajes
- [x] Validar una conversación real desde el enlace público
- [x] Reintentar la propagación estática cuando GitHub Pages deje de reportar su error temporal de despliegue

## Dominio profesional del backend
- [x] Preparar api.textoavoz.xyz como subdominio del backend de Edu AI
- [x] Configurar el registro DNS autorizado en Hostinger sin alterar el dominio principal
- [x] Validar HTTPS, CORS y la conversación pública desde el dominio propio

## Continuidad de Edu AI
- [x] Mantener el backend conversacional publicado como servicio de Edu AI sin depender de la interfaz estática
- [x] Usar exclusivamente api.textoavoz.xyz para la API sin redirigir ni modificar textoavoz.xyz
- [x] Documentar los límites de disponibilidad del proveedor sin presentar una garantía de permanencia absoluta

## Arquitectura durable con dominio propio
- [x] Definir una ruta de alojamiento mantenible para el backend de Edu AI y api.textoavoz.xyz
- [x] Mantener las credenciales del modelo exclusivamente en el servidor elegido
- [x] Preparar una vinculación HTTPS verificable sin cambiar el dominio raíz textoavoz.xyz
- [x] Validar la continuidad del sitio público y de las conversaciones tras la migración

## Puerta de API en Cloudflare
- [x] Inspeccionar la zona activa de textoavoz.xyz sin modificar DNS existentes
- [x] Preparar un Worker que reenvíe solo la API de Edu AI y restrinja los orígenes permitidos
- [x] Solicitar confirmación antes de desplegar el Worker o cambiar nameservers y registros
- [x] Vincular api.textoavoz.xyz, verificar HTTPS y migrar el sitio público a la nueva URL

## Interfaz trilingüe
- [x] Añadir un selector persistente y accesible de idioma en español, inglés y ruso
- [x] Traducir los controles, mensajes de bienvenida, sugerencias y textos de interfaz al inglés y ruso
- [x] Adaptar los atributos de idioma del documento y verificar el selector en computadora y celular

## Implementación segura del Worker de Cloudflare
- [x] Validar y desplegar el proxy restringido para el procedimiento conversacional de Edu AI
- [x] Configurar la autenticación privada entre el Worker y el backend publicado
- [x] Verificar el Worker mediante workers.dev sin exponer la clave del modelo
- [x] Vincular `api.textoavoz.xyz` cuando la zona de Cloudflare esté activa
- [x] Migrar GitHub Pages a la URL definitiva de la API y validar una conversación pública
- [x] Documentar el estado, guardar el checkpoint y publicar los cambios de configuración no secretos
- [x] Rechazar el chat de producción si falta o no coincide la clave privada del gateway
- [x] Resolver y verificar el reenvío autenticado Worker → backend tras activar el cierre por defecto
- [x] Validar una conversación real desde GitHub Pages tras la migración a api.textoavoz.xyz
- [x] Actualizar la documentación restante para reflejar api.textoavoz.xyz como endpoint público final

## Dominio público de Edu AI
- [x] Preparar `textoavoz.xyz` como dirección pública principal y `www.textoavoz.xyz` como acceso equivalente
- [x] Configurar GitHub Pages y Cloudflare para servir la aplicación estática desde el dominio propio
- [x] Verificar HTTPS, carga de interfaz y conversación mediante `api.textoavoz.xyz`
- [x] Actualizar la documentación, guardar el checkpoint y comunicar el enlace público definitivo
- [x] Corregir o descartar el conflicto de importación de `Toaster` tras validar TypeScript y 29 pruebas
- [x] Autorizar `textoavoz.xyz` y `www.textoavoz.xyz` en la política CORS del Worker de Edu AI
- [x] Desplegar y validar una conversación real desde el dominio oficial tras el ajuste CORS
- [x] Resolver la API segura para textoavoz.xyz y www.textoavoz.xyz desde el cliente estático
- [x] Documentar `textoavoz.xyz` como enlace oficial, `www` como redirección y GitHub Pages como respaldo
- [x] Guardar un checkpoint posterior a la migración del dominio raíz y comunicar el enlace definitivo

## Biblioteca y voz humana de Edu AI
- [x] Añadir *Teoterapia del amor*, de J. Chamorro, a la biblioteca con una ficha editorial contrastada
- [x] Publicar Teoterapia del amor en la biblioteca del dominio oficial y comprobar su ficha visible
- [x] Investigar y seleccionar libros populares y obras menos conocidas con alta valoración editorial internacional
- [x] Diseñar una sección de libros útil, atractiva y coherente con la experiencia conversacional de Edu AI
- [x] Incorporar la biblioteca recomendada al sitio con enlaces de consulta y criterios editoriales transparentes
- [x] Refinar la identidad de Edu AI con una voz cálida de joven venezolano de 27 años del oriente, sin estereotipos ni afirmaciones biográficas falsas
- [x] Ajustar el prompt y las pruebas para conservar una conversación humana, útil y coherente en español, inglés y ruso
- [x] Validar, publicar y documentar la ampliación de biblioteca y personalidad
- [x] Añadir un ícono accesible de Facebook vinculado al perfil oficial del propietario
- [x] Mantener Discord oculto hasta contar con una invitación pública real, sin crear un enlace ficticio
- [x] Verificar en el componente que solo se renderiza Facebook y que Discord permanece ausente sin una URL pública

## Repisa personal de recomendaciones
- [x] Replantear la biblioteca como una repisa editorial de recomendaciones profundas, no como un catálogo genérico
- [x] Curar obras de Charles Bukowski, Fiódor Dostoievski, *La culpa es de la vaca* y lecturas afines con valor formativo
- [x] Redactar motivos honestos de recomendación sin afirmar que Edu AI leyó personalmente las obras
- [x] Rediseñar visualmente las tarjetas para reflejar una colección recomendada con mayor carácter y cercanía
- [x] Validar, publicar y documentar la repisa de recomendaciones renovada
- [x] Verificar que la repisa declara su criterio editorial y no atribuye lecturas personales ficticias a Edu AI

## Espacio de aprendizaje y pensamiento
- [x] Crear una biblioteca personal con estados de lectura guardados localmente
- [x] Añadir herramientas rápidas para resumir, planificar, escribir, estudiar y decidir
- [x] Implementar un cuaderno de ideas persistente para guardar respuestas y notas propias
- [x] Incorporar un modo de estudio para generar rutas de aprendizaje, práctica y repaso
- [x] Añadir preferencias de conversación para respuestas breves, profundas, creativas o de estudio
- [x] Habilitar lectura en voz alta de respuestas cuando el navegador lo permita
- [x] Diseñar retos semanales y una tarjeta de ideas compartible mediante las funciones del navegador
- [x] Validar la experiencia completa en escritorio y celular, con textos en español, inglés y ruso
- [x] Corregir la aserción de identidad de Edu AI detectada por las pruebas automatizadas
- [x] Reejecutar la suite tras ajustar la aserción de identidad y confirmar la validación final
- [x] Activar y verificar la redirección forzada a HTTPS para textoavoz.xyz
- [x] Resolver la validación DNS pendiente de GitHub Pages que mantiene textoavoz.xyz como conexión no segura mediante terminación HTTPS y proxy de Cloudflare
- [x] Confirmar en navegador que http redirige a https y que ya no aparece la advertencia de seguridad
- [x] Activar el proxy HTTPS de Cloudflare para el dominio raíz y www sin alterar api.textoavoz.xyz

## Gestión de conversaciones y refinamiento de experiencia
- [x] Añadir un control visible y accesible para eliminar una conversación desde la barra de historial
- [x] Solicitar confirmación antes de borrar, con opciones claras para cancelar o eliminar definitivamente
- [x] Asegurar que al borrar el hilo activo se seleccione o cree una conversación válida sin dejar la interfaz bloqueada
- [x] Mejorar los estados vacíos, etiquetas de accesibilidad y comportamiento táctil del historial en móvil y escritorio
- [x] Incorporar pruebas unitarias para la eliminación, cancelación y selección posterior de conversaciones
- [x] Validar visualmente el flujo completo de gestión de conversaciones antes de publicar

## Refinamiento visual profesional
- [x] Reforzar la jerarquía editorial del chat, encabezado, historial y compositor sin sustituir la paleta cálida existente
- [x] Mejorar densidad, espaciado, superficies, iconografía y estados de interacción para una experiencia de producto más profesional
- [x] Adaptar el rediseño a móvil con controles táctiles claros, diálogos legibles y navegación estable
- [x] Mantener la identidad propia, el soporte trilingüe, la privacidad de claves y todas las funciones educativas ya implementadas

## Validación explícita de cierre
- [x] Verificar en navegador la interfaz final en español, inglés y ruso tanto en escritorio como en móvil
- [x] Abrir http://textoavoz.xyz en navegador y confirmar la redirección automática a HTTPS sin advertencia de seguridad
- [x] Validar visualmente el control de eliminar conversación, el diálogo de confirmación, la cancelación y la continuidad posterior al borrado

## Incidencia de certificado reportada
- [x] Diagnosticar por qué un navegador del usuario aún muestra "No seguro" en textoavoz.xyz
- [x] Verificar de forma independiente el certificado presentado, el DNS público y las rutas con y sin www
- [x] Corregir la configuración de HTTPS y confirmar con el usuario que desaparece la advertencia

## Revisión directa en el navegador del usuario
- [x] Capturar el estado exacto de seguridad que persiste en la pestaña conectada del usuario
- [x] Inspeccionar certificado, navegación final y posibles recursos inseguros desde ese navegador
- [x] Corregir la causa observada y confirmar el candado seguro en la misma sesión del usuario

## Auditoría de contenido mixto
- [x] Identificar el recurso o configuración que Chrome marca como conexión insegura pese al certificado válido
- [x] Eliminar o actualizar toda referencia de contenido funcional cargada por HTTP
- [x] Publicar y verificar en el navegador conectado que Chrome muestra una conexión segura

## Evolución integral de Edu AI
- [x] Retirar de la interfaz pública los botones y textos de inicio de sesión externo
- [x] Mantener disponibles para todos el chat, el estudio y la copia privada cifrada sin cuenta
- [x] Verificar y publicar Edu AI como experiencia pública sin cuentas obligatorias
- [x] Habilitar el callback OAuth y el transporte de sesión desde `textoavoz.xyz` hacia la API pública sin exponer credenciales
- [x] Mostrar un acceso voluntario de cuenta y su estado de sesión para activar la futura sincronización por cuenta
- [x] Publicar la interfaz de cuenta y validar el estado de sesión desde `textoavoz.xyz`
- [x] Corregir la visibilidad del acceso de cuenta en el dominio público cuando no existe una sesión
- [x] Evitar efectos de almacenamiento y redirecciones automáticas durante el render de la pantalla pública
- [x] Ampliar los encabezados CORS permitidos del gateway para solicitudes autenticadas y preflight seguro
- [x] Publicar y comprobar el acceso público de cuenta tras el refuerzo de autenticación y CORS
- [x] Diseñar modelos persistentes y privados para conversaciones, carpetas, notas, preferencias y progreso por usuario
- [x] Crear sincronización autenticada para conservar el espacio personal entre dispositivos sin perder el modo local actual
- [x] Añadir carpetas, etiquetas, títulos editables, favoritos y búsqueda dentro del historial de conversaciones
- [x] Incorporar un panel de progreso con metas semanales, rachas, actividad y avance de rutas de estudio
- [x] Permitir cargar documentos e imágenes para obtener un resumen, explicación, tarjetas de estudio o plan de aprendizaje
- [x] Añadir dictado por voz con controles claros de inicio, transcripción, revisión y envío
- [x] Permitir exportar notas, conversaciones y rutas de estudio como Markdown y PDF
- [x] Retirar de la experiencia pública los enlaces compartibles dependientes de cuenta para evitar accesos externos obligatorios
- [x] Retirar el panel de compartición del cuaderno asociado a una cuenta y conservar la exportación local sin registro
- [x] Mantener soporte trilingüe, accesibilidad, privacidad de datos y diseño responsive en la experiencia pública
- [x] Añadir pruebas, validación visual en escritorio y móvil, y publicación de la versión integral
- [x] Restablecer el control del navegador y confirmar la propagación de la versión pública sin cuentas
- [x] Evaluar requisitos, políticas y viabilidad de monetización con Google AdSense para Edu AI antes de cualquier integración
- [x] Crear y entregar un logotipo de marca distintivo para Edu AI, basado en la paleta cálida actual
- [x] Rediseñar el logo de Edu AI con una dirección más singular y aplicarlo en la cabecera publicada
- [x] Reforzar la personalidad conversacional de Edu AI para respuestas más humanas, contextuales y naturales, sin suplantar otra identidad
- [x] Diseñar una experiencia principal de texto a voz con un editor, selector de voces, vista previa, descarga y accesibilidad responsive
- [x] Implementar una síntesis de voz segura con límites de uso claros y aplicados en el servidor
- [x] Reubicar el chat de Edu AI como una herramienta secundaria sin perder historial, personalidad ni funciones de aprendizaje
- [x] Añadir pruebas para las cuotas, las voces, la descarga y los flujos de texto a voz
- [x] Seleccionar una alternativa de texto a voz que no exija al propietario una cuenta ni una suscripción de pago externa
- [x] Alinear el límite real por visitante y el indicador de cuota visible en el estudio de texto a voz
- [x] Renovar el acceso de publicación y actualizar textoavoz.xyz con la cuota corregida de texto a voz
- [x] Definir y aplicar una cuota de texto a voz sostenible tras evaluar la solicitud de cuatro audios de hasta 3.000 caracteres
- [x] Reforzar el acceso anónimo al estudio de voz con verificación anti-bots validada en servidor e identidad de visitante resistente a reinicios locales
- [x] Ampliar pruebas y publicar la actualización de protección y cuota del estudio de texto a voz
- [x] Configurar Turnstile para textoavoz.xyz, validarlo en el Worker y mostrar el desafío anti-bots en el estudio de voz
- [x] Confirmar con una prueba humana que Turnstile permite generar y descargar un MP3 legítimo en textoavoz.xyz
- [x] Diseñar y validar un modelo de créditos que cubra el coste de voz, mantenga una cuota gratuita y no active cobros sin aprobación
- [x] No integrar pagos ni canje de créditos por decisión del titular; sustituir esa vía por una estrategia de sostenibilidad sin microtransacciones
- [x] Recopilar métricas verificables de visitas, solicitudes y tendencias de textoavoz.xyz para evaluar la monetización
- [x] Contrastar el tráfico y contenido actual con los requisitos de Google AdSense y recomendar si conviene solicitarlo ahora
- [x] Evaluar modelos de texto a voz autoalojables, licencias de voces y requisitos de cómputo frente al servicio actual
- [x] Proponer una arquitectura sostenible de voz propia o híbrida sin vulnerar derechos de voces ni introducir costes ocultos
- [x] Limitar el acceso gratuito del estudio a un audio diario por visitante y actualizar los mensajes visibles
- [x] Actualizar las pruebas, publicar y verificar la nueva cuota diaria de un audio
- [x] Crear páginas de Privacidad, Términos, Acerca de y Contacto con navegación pública
- [x] Publicar guías originales sobre texto a voz, aprendizaje e IA para reforzar el contenido de valor
- [x] Incorporar una base de analítica de audiencia y consentimiento de cookies sin activar seguimiento no autorizado
- [x] Preparar ubicaciones publicitarias no invasivas que permanezcan vacías hasta aprobar AdSense
- [x] Diseñar la base de datos y las rutas de créditos sin habilitar pagos ni canjes hasta configurar un proveedor
- [x] Cubrir la preparación de monetización con pruebas, revisión móvil y publicación oficial
- [x] Corregir y verificar que el enlace oficial de Facebook abra correctamente desde dispositivos móviles
- [x] Incorporar la etiqueta oficial de Google AdSense con el ID de publicador proporcionado, sin habilitar bloques publicitarios aún
- [x] Configurar en Google AdSense el sitio textoavoz.xyz y sus opciones publicitarias tras la autorización explícita del titular
- [x] Publicar el archivo ads.txt de textoavoz.xyz con el identificador de publicador autorizado por Google AdSense
- [x] Diseñar un plan de sostenibilidad alternativo a los créditos que proteja la experiencia gratuita y los costes de Edu AI
- [x] Mejorar el SEO técnico, los metadatos y la indexación de textoavoz.xyz para búsquedas de texto a voz en español
- [x] Añadir y publicar la etiqueta de verificación de Google Search Console para textoavoz.xyz
- [x] Actualizar la identidad de Edu AI para atribuir su creación a Eduardo con la descripción indicada por el titular
- [x] Ampliar la experiencia trilingüe con selección mundial de idioma accesible para visitantes
- [x] Restaurar y preservar el archivo CNAME de textoavoz.xyz en las publicaciones de GitHub Pages
- [x] Añadir el emblema Origen de Edu AI como favicon y como icono para dispositivos compatibles
- [x] Añadir temporalmente la dedicatoria “Por amor a Joselyn” al final de la página principal
- [x] Retirar la dedicatoria temporal “Por amor a Joselyn” del final de la página principal
- [x] Añadir una respuesta pulida y lúdica sobre Eduardo como jugador experto de Warframe, con énfasis en Khora y Wukong
- [x] Ampliar la personalidad de Edu AI con guiños divertidos y coherentes sobre su creador, sin inventar datos personales
