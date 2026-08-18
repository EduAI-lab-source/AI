# Investigación: Texto a voz gratuito para Edu AI

## Alternativa prioritaria: Cloudflare Workers AI

Edu AI ya usa Cloudflare para su gateway público. La documentación oficial de Workers AI incluye modelos de texto a voz de Deepgram: `aura-1`, `aura-2-en` y `aura-2-es`. La ficha del catálogo describe Aura como un modelo de TTS consciente del contexto, capaz de aplicar ritmo y expresividad a partir del texto recibido.

Cloudflare publica una asignación gratuita compartida de **10.000 Neurons al día**, que se restablece a las 00:00 UTC. Si se supera ese límite, las operaciones fallan hasta el siguiente reinicio en la cuenta gratuita. Por tanto, Edu AI debe aplicar una cuota propia por visitante y una longitud máxima por síntesis, en vez de presentar el servicio como ilimitado.

## Decisión de producto preliminar

La propuesta es usar el modelo de español de Aura como voz principal para las síntesis descargables y mostrar un límite conservador por visitante. La selección final de voces depende de los identificadores y parámetros publicados en la ficha específica del modelo. La cuota se presentará como una capacidad diaria compartida y no como un derecho ilimitado: el servicio puede quedar temporalmente sin cupo si el consumo agregado de la cuenta alcanza el límite gratuito de Cloudflare.

## Fuentes oficiales

1. [Catálogo de modelos Workers AI](https://developers.cloudflare.com/workers-ai/models/)
2. [Precios de Workers AI](https://developers.cloudflare.com/workers-ai/platform/pricing/)
