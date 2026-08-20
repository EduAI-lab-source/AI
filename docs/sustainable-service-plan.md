# Plan de sostenibilidad para Edu AI sin sistema de créditos

**Fecha:** 18 de agosto de 2026  
**Elaborado para:** Edu AI

## Decisión principal

Edu AI **no debe introducir créditos ni cobrar por caracteres en esta etapa**. El producto aún está validando su audiencia, la voz tiene un coste variable y la publicidad no debe convertirse en condición para que una persona obtenga un audio. El enfoque recomendado es una escalera de valor: conservar una muestra gratuita pequeña y confiable, conseguir ingresos publicitarios modestos solo cuando Google apruebe el sitio, y vender después servicios de mayor valor y margen que no dependan de microtransacciones.

> La función gratuita de texto a voz debe ser una puerta de entrada al valor de Edu AI, no una promesa de capacidad ilimitada.

## Punto de partida real

| Elemento | Estado actual | Consecuencia estratégica |
|---|---|---|
| Voz gratuita | 1 audio de hasta 650 caracteres por visitante al día | Es una muestra clara y manejable; no debe ampliarse todavía. |
| Capacidad compartida | 3.000 caracteres diarios | Protege el presupuesto, pero limita el número de solicitudes simultáneas. |
| Coste de Aura 2 | 0,03 USD por 1.000 caracteres | La voz no es gratuita para el proyecto cuando se supera la asignación de Cloudflare. [1] [2] |
| Publicidad | Solicitud de revisión de AdSense enviada; anuncios automáticos desactivados | Aún no existe ingreso publicitario comprobado. |
| Audiencia | Analítica inicial disponible, con calidad y recurrencia todavía por validar | No se deben proyectar ingresos con las visitas actuales. |
| Pagos y cuentas | No son requisito del producto | Conviene mantener la experiencia abierta mientras se prueba la demanda. |

Con la tarifa publicada de Aura 2, una síntesis de 650 caracteres equivale aproximadamente a **0,0195 USD** de inferencia. Cien síntesis de ese tamaño costarían alrededor de **1,95 USD**; cien visitantes consumiendo 3.000 caracteres costarían aproximadamente **9 USD**. Son cálculos de coste técnico, no una previsión de ingreso o rentabilidad. [2]

## Modelo recomendado: tres fuentes, en orden

### 1. Publicidad contextual mínima — solo como base, no como motor

Tras una eventual aprobación de AdSense, activar **una ubicación manual y discreta** en contenido editorial o al final de una guía, nunca dentro del editor, junto al botón de crear audio ni cerca de la descarga. Mantener los anuncios automáticos desactivados inicialmente permite controlar la experiencia y evaluar la colocación.

No debe ofrecerse audio, caracteres, tiempo extra ni ninguna recompensa a cambio de mirar o pulsar anuncios. Google prohíbe incentivar vistas o clics y restringe las ubicaciones que puedan confundirse con navegación o descargas. [3] [4]

**Objetivo:** comprobar si la audiencia editorial genera un ingreso pequeño sin degradar el producto. **No asumir** que este ingreso financiará el servicio de voz.

### 2. Apoyo voluntario — transparente y sin bloquear la herramienta

Después de obtener métricas estables y antes de construir pagos complejos, crear una página sencilla de **“Apoya Edu AI”**. Debe explicar que la contribución ayuda a mantener el estudio de voz, las guías y la infraestructura; no debe prometer cuotas extra, créditos ni beneficios que parezcan una contraprestación automática.

Esta vía es adecuada para una comunidad inicial porque no obliga a registrar cuentas, no añade lógica de consumo y no convierte la función principal en una barrera de pago. La elección de plataforma de cobro debe hacerse cuando el titular confirme país de cobro, disponibilidad de retiro, documentación fiscal y comisiones aplicables.

### 3. Servicios de alto valor — la fuente que sí puede escalar con sentido

El ingreso más sostenible no es vender 1.000 caracteres, sino resolver un resultado concreto para un cliente. Edu AI puede ofrecer inicialmente mediante la página de contacto, sin automatizar pagos, tres solicitudes de presupuesto:

| Servicio propuesto | Cliente ideal | Entrega | Por qué es preferible a créditos |
|---|---|---|---|
| Adaptación de texto para audio | Docentes, estudiantes, creadores | Guion corregido y dividido para voz | Vende claridad y edición, no solo cómputo. |
| Producción de narración breve | Autores, emprendimientos, proyectos educativos | MP3 revisado y listo para usar | Permite cotizar por proyecto y cubrir coste + tiempo. |
| Paquete educativo accesible | Profesores, academias, ONG | Material de lectura y audios organizados | Atiende una necesidad repetible y con más valor percibido. |

Al principio, estas solicitudes deben ser **manuales**: formulario de contacto, definición de alcance, presupuesto, aceptación y entrega por enlace privado. Solo se debe automatizar algo cuando exista demanda repetida y un proceso que ya funcione de forma manual.

## Hoja de ruta de 90 días

| Periodo | Prioridad | Acciones concretas | Señal para avanzar |
|---|---|---|---|
| Días 0–30 | Validar producto y revisión de AdSense | Mantener el límite actual; publicar contenido original adicional; comprobar que analítica, CMP, política de privacidad y `ads.txt` siguen correctos; esperar la decisión de AdSense. | 30 días de métricas con páginas vistas, fuentes de tráfico y uso de voz comprensibles. |
| Días 31–60 | Probar ingresos sin fricción | Si Google aprueba, activar una única ubicación manual fuera del estudio de voz; crear “Apoya Edu AI”; añadir una página de servicios con formulario de solicitud de presupuesto. | Interés real: mensajes, solicitudes de presupuesto o apoyos voluntarios, sin aumento de quejas ni de fallos de voz. |
| Días 61–90 | Elegir la primera línea comercial | Completar 3–5 encargos manuales; medir tiempo invertido, coste de voz, margen antes de comisiones y satisfacción directa; estandarizar solo el servicio que se repita. | Un servicio solicitado de forma reiterada y rentable tras considerar coste y tiempo. |

## Métricas que sí importan

En lugar de perseguir solicitudes brutas o impresiones, el panel de seguimiento debe responder estas preguntas:

| Métrica | Decisión que informa |
|---|---|
| Visitantes con uso válido de voz y tasa de éxito de generación | Si la herramienta central está resolviendo una necesidad. |
| Porcentaje de visitantes recurrentes | Si existe una audiencia a la que vale la pena servir. |
| Páginas editoriales leídas y fuentes de tráfico | Si hay contenido que atraiga audiencia de calidad. |
| Caracteres y Neurons consumidos por día | Cuándo el presupuesto de voz necesita una revisión. |
| Solicitudes de servicios y tiempo de atención | Qué oferta profesional tiene demanda real. |
| Ingreso neto frente a coste de voz y tiempo | Si una vía puede financiarse sin deteriorar el proyecto. |

## Límites que no deben cambiar aún

Edu AI debe conservar el límite de una síntesis de hasta 650 caracteres por visitante y el presupuesto global de 3.000 caracteres hasta contar con datos de 30 días. Tampoco debe prometer voces de personas reales, reproducir voces de terceros ni ofrecer audio a cambio de interacción publicitaria. La política de privacidad debe seguir informando sobre cookies publicitarias y opciones de exclusión si se activan anuncios. [3] [5]

## Decisión que recomiendo tomar ahora

La próxima mejora **no es un checkout**. Es una página pública de servicios llamada, por ejemplo, **“Voz y contenido para tu proyecto”**, junto a un formulario de solicitud de presupuesto y una página opcional de apoyo voluntario. Esto permite descubrir qué necesidad concreta están dispuestos a pagar docentes, autores y creadores sin obligar a todos los visitantes a abrir una cuenta ni arriesgar la sostenibilidad del TTS.

Cuando el sitio cuente con aprobación de AdSense, 30 días de datos de calidad y varias solicitudes reales de servicio, se podrá decidir si conviene formalizar un solo producto profesional. Hasta entonces, las decisiones deben ser reversibles, de bajo coste y centradas en preservar la utilidad gratuita de Edu AI.

## Referencias

[1] [Cloudflare Workers AI: precios y asignación gratuita](https://developers.cloudflare.com/workers-ai/platform/pricing/)  
[2] [Cloudflare Workers AI: Aura 2 (precio por caracteres)](https://developers.cloudflare.com/workers-ai/models/aura-2-en/)  
[3] [Google AdSense: políticas del programa](https://support.google.com/adsense/answer/48182?hl=en)  
[4] [Google AdSense: políticas de ubicación de anuncios](https://support.google.com/adsense/answer/1346295?hl=en)  
[5] [Google AdSense: contenido requerido y privacidad](https://support.google.com/adsense/answer/1348695?hl=en)
