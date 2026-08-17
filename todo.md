# Edu AI — Directorio de herramientas de IA (TODO)

## Base de datos y backend
- [x] Tabla `tools` en schema con todos los campos (no aplicable: el catálogo estático en `tools.ts` es la fuente compatible con GitHub Pages)
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
- [ ] Preparar api.textoavoz.xyz como subdominio del backend de Edu AI
- [ ] Configurar el registro DNS autorizado en Hostinger sin alterar el dominio principal
- [ ] Validar HTTPS, CORS y la conversación pública desde el dominio propio

## Continuidad de Edu AI
- [ ] Mantener el backend conversacional publicado como servicio de Edu AI sin depender de la interfaz estática
- [ ] Usar exclusivamente api.textoavoz.xyz para la API sin redirigir ni modificar textoavoz.xyz
- [x] Documentar los límites de disponibilidad del proveedor sin presentar una garantía de permanencia absoluta

## Arquitectura durable con dominio propio
- [ ] Definir una ruta de alojamiento mantenible para el backend de Edu AI y api.textoavoz.xyz
- [ ] Mantener las credenciales del modelo exclusivamente en el servidor elegido
- [ ] Preparar una vinculación HTTPS verificable sin cambiar el dominio raíz textoavoz.xyz
- [ ] Validar la continuidad del sitio público y de las conversaciones tras la migración

## Puerta de API en Cloudflare
- [ ] Inspeccionar la zona activa de textoavoz.xyz sin modificar DNS existentes
- [ ] Preparar un Worker que reenvíe solo la API de Edu AI y restrinja los orígenes permitidos
- [ ] Solicitar confirmación antes de desplegar el Worker o cambiar nameservers y registros
- [ ] Vincular api.textoavoz.xyz, verificar HTTPS y migrar el sitio público a la nueva URL

## Interfaz trilingüe
- [x] Añadir un selector persistente y accesible de idioma en español, inglés y ruso
- [x] Traducir los controles, mensajes de bienvenida, sugerencias y textos de interfaz al inglés y ruso
- [x] Adaptar los atributos de idioma del documento y verificar el selector en computadora y celular

## Implementación segura del Worker de Cloudflare
- [x] Validar y desplegar el proxy restringido para el procedimiento conversacional de Edu AI
- [x] Configurar la autenticación privada entre el Worker y el backend publicado
- [x] Verificar el Worker mediante workers.dev sin exponer la clave del modelo
- [ ] Vincular `api.textoavoz.xyz` cuando la zona de Cloudflare esté activa
- [ ] Migrar GitHub Pages a la URL definitiva de la API y validar una conversación pública
- [ ] Documentar el estado, guardar el checkpoint y publicar los cambios de configuración no secretos
- [ ] Rechazar el chat de producción si falta o no coincide la clave privada del gateway
