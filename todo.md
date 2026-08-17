# Edu AI — Directorio de herramientas de IA (TODO)

## Base de datos y backend
- [ ] Tabla `tools` en schema con todos los campos (nombre, categoría, descripción, precio, enlace, puntuación, pros, contras, plan gratuito, casos de uso, ícono)
- [ ] Migración aplicada a la base de datos
- [x] Seed de 40+ herramientas curadas con datos completos
- [ ] Helper de consultas en server/db.ts
- [ ] Procedimientos tRPC: listar, buscar (nombre/descripción/categoría), por categoría, detalle por slug
- [ ] Procedimiento tRPC para Edu AI: chat conversacional con IA sobre el catálogo (usa LLM integrado)
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
