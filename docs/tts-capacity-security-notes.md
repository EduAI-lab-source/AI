# Evaluación de capacidad y protección del estudio TTS

Fecha de revisión: 18 de agosto de 2026.

La cuota solicitada de cuatro audios de hasta 3.000 caracteres equivale a 12.000 caracteres por visitante y día. La configuración pública actual limita la capacidad compartida a 3.000 caracteres diarios, por lo que no es compatible con esa ampliación sin redefinir el presupuesto y las salvaguardas.

La documentación de Cloudflare para Aura 2 indica un precio de referencia de 0,03 USD por cada 1.000 caracteres. Con ese precio, la cuota máxima solicitada representaría 0,36 USD por visitante y día; con 100 visitantes que agotaran la cuota, equivaldría a 36 USD diarios antes de comisiones de cobro. La plataforma también indica que Aura 2 en español utiliza 2.727,27 Neurons por cada 1.000 caracteres y que el plan gratuito asigna 10.000 Neurons por día a toda la cuenta. Por tanto, un solo audio de 3.000 caracteres requiere aproximadamente 8.182 Neurons y cuatro audios requieren aproximadamente 32.727 Neurons: la cuota solicitada excede la asignación gratuita diaria y no es viable como acceso abierto sin un plan de pago o créditos prepagados. La documentación no especifica en esa ficha un límite máximo de caracteres por solicitud, por lo que se debe mantener un límite de producto independiente y probar el rendimiento antes de ampliarlo.

Para protección antiabuso, Turnstile debe validarse en el servidor mediante Siteverify. Los tokens son de un solo uso y vencen a los cinco minutos; el widget del navegador por sí solo no proporciona protección. Se recomienda solicitar y validar un token nuevo antes de cada síntesis, complementar con una cookie firmada de visitante y conservar la cuota diaria transaccional en base de datos.

## Decisión recomendada

Mantener las cuentas como opción, no requisito. Implementar Turnstile y una identidad firmada de visitante antes de aumentar la cuota. Un sistema de créditos puede monetizar la voz si cada crédito representa caracteres consumibles y se descuenta de forma transaccional antes de generar audio. No se deben cobrar ni activar pagos hasta aprobar los paquetes, los precios, el proveedor y las condiciones públicas. No se debe aplicar la cuota de 4 × 3.000 hasta acordar un presupuesto de capacidad compartida y validar el límite de entrada del modelo en producción.

Para una primera validación comercial, Stripe Payment Links puede servir como checkout alojado, pero el canje automático de créditos exige una integración de servidor que procese solo eventos de pago verificados. La página de precios de Stripe muestra una referencia de 2,9 % + 0,30 USD por transacción de tarjeta nacional en la localización consultada, con recargos para tarjetas internacionales y conversión de moneda. Las tarifas concretas y la disponibilidad dependen del país de registro del negocio y deben confirmarse antes de fijar precios, especialmente para paquetes pequeños donde el componente fijo de 0,30 USD es relevante.

## Alternativas de voz propia — investigación inicial

Autoalojar un modelo de texto a voz evita el límite diario específico de Workers AI, pero no elimina el gasto: traslada la carga a una infraestructura que debe permanecer disponible, generar audio con latencia aceptable y escalar frente a usuarios simultáneos. El alojamiento actual de Edu AI tiene un límite de 1 vCPU y 512 MB; no es adecuado para servir un modelo de voz multilingüe de alta calidad en producción.

Chatterbox Multilingual V3 es la principal alternativa de evaluación: el repositorio oficial se publica bajo licencia MIT, describe un modelo multilingüe de 500 millones de parámetros con cobertura de 23+ idiomas, y permite clonado de voz a partir de un clip de referencia. Es técnicamente posible probarlo en CPU, pero para uso público se debe validar la latencia con GPU y usar exclusivamente grabaciones propias o voces de locutores que hayan dado autorización expresa. No se deben replicar las voces de Aura 2 ni imitar a una persona real sin derechos claros.

Piper es una alternativa ligera de síntesis local publicada bajo MIT, pero su repositorio original fue archivado y su desarrollo se trasladó a otro proyecto. Puede servir para un modo de bajo coste con voces ya licenciadas, pero no debe ser la elección principal sin revisar la licencia individual de cada voz y la continuidad del proyecto.

Kokoro-82M es una segunda alternativa candidata: su modelo se distribuye bajo Apache-2.0, tiene 82 millones de parámetros y su ficha declara que puede desplegarse para producción comercial. Incluye tres voces españolas publicadas (ef_dora, em_alex y em_santa), pero su documentación advierte que la cobertura no inglesa puede ser limitada y que la calidad puede degradarse con entradas muy largas. Por tanto, sería una opción viable para un modo económico con fragmentación de texto y una prueba de calidad en español, no una réplica de las voces actuales ni una garantía de que alcance su misma naturalidad.

Para convertir Kokoro en un servicio, Kokoro-FastAPI ofrece una capa Apache-2.0 compatible con la API de voz de OpenAI, con ejecución para CPU y GPU y soporte declarado para español. Esta capa puede ser útil para una prueba técnica, pero sus afirmaciones de rendimiento no sustituyen una prueba con el hardware real, los textos en español y el nivel de concurrencia de Edu AI. La capacidad debe expresarse como audios por hora o segundos de audio sintetizados por segundo; el modelo no impone por sí mismo una cantidad diaria fija de personas.

La cuenta de Cloudflare que administra textoavoz.xyz está disponible y ofrece Turnstile en el área de seguridad. Turnstile puede añadir una barrera anti-bots sin exigir una cuenta a los visitantes, siempre que el token se valide del lado del servidor antes de reservar o sintetizar una voz.

El formulario de Turnstile permite asociar el widget a hostnames concretos y recomienda el modo administrado: este deja que Cloudflare aplique controles no interactivos para tráfico normal y desafíos adicionales a solicitudes de mayor riesgo. Para Edu AI deben autorizarse textoavoz.xyz y www.textoavoz.xyz, y el token del widget se debe verificar en el Worker antes de que este llame a la reserva de cuota.

El widget se configurará con el nombre operativo “Edu AI — Voz”, modo administrado y el dominio oficial textoavoz.xyz. Se conservará el comportamiento predeterminado de preautorización desactivado, ya que el objetivo es proteger únicamente la generación de audio y no omitir reglas de seguridad de otras zonas.

La configuración del widget ya asocia textoavoz.xyz como hostname permitido. El siguiente paso es crear el widget y almacenar su clave pública únicamente en la interfaz y su clave secreta únicamente en los servicios que validan el token.

El widget Turnstile “Edu AI — Voz” se creó correctamente para textoavoz.xyz. Sus claves se mantendrán fuera del repositorio: la clave pública solo se incorporará a la configuración de cliente y la clave secreta se añadirá exclusivamente al Worker de Cloudflare que realiza la validación del token.

La primera comprobación en producción confirmó que el Worker bloquea la síntesis sin token, pero el widget no se mostró al visitante. Se corrigió el montaje para forzar una presentación visible. Las comprobaciones posteriores en textoavoz.xyz muestran el indicador de un audio diario y el desafío de Turnstile, que alterna correctamente entre la carga y el control de verificación humana. La automatización no puede pulsar de manera fiable el control dentro del iframe de seguridad porque este actualiza su DOM durante la comprobación; la confirmación final de síntesis debe realizarse manualmente desde el navegador del propietario o con una prueba humana independiente.

## Referencias

1. https://developers.cloudflare.com/workers-ai/models/aura-2-en/
2. https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
3. https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
4. https://developers.cloudflare.com/workers-ai/platform/pricing/
5. https://stripe.com/es-us/pricing
6. https://stripe.com/es-us/payments/payment-links
7. https://github.com/resemble-ai/chatterbox
8. https://github.com/rhasspy/piper
9. https://huggingface.co/hexgrad/Kokoro-82M
10. https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md
11. https://github.com/remsky/Kokoro-FastAPI
