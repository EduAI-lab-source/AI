import type { AppLanguage } from "@/lib/i18n";
import { BookOpen, ChevronDown, ExternalLink, FileText, HeartHandshake, Mail, Scale, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";

export type PublicPageId = "privacy" | "terms" | "about" | "contact";

type PageSection = { heading: string; body: string[] };
type PageCopy = { eyebrow: string; title: string; intro: string; sections: PageSection[]; updated: string };
type Guide = { id: string; number: string; title: string; summary: string; paragraphs: string[]; practice: string };

const FACEBOOK_URL = "https://www.facebook.com/EduardovipJ";

function FacebookGlyph() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.6 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5H17V3.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.2v2H7.8v3h2.7v8h3.1Z" fill="currentColor" /></svg>;
}

const PAGE_COPY: Record<AppLanguage, Record<PublicPageId, PageCopy>> = {
  es: {
    privacy: {
      eyebrow: "CONFIANZA Y PRIVACIDAD", title: "Privacidad en Edu AI", updated: "Última actualización: 18 de agosto de 2026.",
      intro: "Edu AI fue pensado para que puedas probar herramientas de aprendizaje y voz sin entregar más datos de los necesarios.",
      sections: [
        { heading: "Datos que permanecen en tu dispositivo", body: ["Las conversaciones, preferencias de idioma, notas, progreso y listas de lectura se guardan localmente en el navegador cuando usas las funciones personales. Puedes eliminarlos desde los controles de la aplicación o desde los ajustes de tu navegador."] },
        { heading: "Texto a voz y protección del servicio", body: ["Cuando generas un audio, el texto solicitado, un identificador técnico de cuota derivado de tu conexión y la verificación anti-bots se procesan para crear el archivo y proteger el acceso gratuito. Estos controles existen para evitar automatización abusiva; no se usan para crear perfiles publicitarios.", "La síntesis se realiza mediante infraestructura de Cloudflare. No publiques textos que contengan información sensible, credenciales, datos bancarios o información privada de terceros."] },
        { heading: "Cookies, almacenamiento y terceros", body: ["Edu AI utiliza almacenamiento local esencial para conservar tus preferencias y tu trabajo en el dispositivo. La medición técnica del dominio se realiza con Cloudflare Web Analytics; actualmente no se muestran anuncios ni se ejecutan etiquetas de publicidad personalizada.", "Si en el futuro se habilitan anuncios o analítica opcional, esta página se actualizará antes de activar esas tecnologías y se mostrará una elección de consentimiento cuando corresponda."] },
        { heading: "Contacto y cambios", body: ["Puedes consultar cambios de esta política en esta misma página. Para consultas públicas sobre el proyecto, utiliza el perfil oficial de Facebook enlazado en la sección Contacto."] },
      ],
    },
    terms: {
      eyebrow: "USO RESPONSABLE", title: "Términos de uso", updated: "Última actualización: 18 de agosto de 2026.",
      intro: "Edu AI ofrece herramientas de texto a voz, estudio y conversación para apoyar procesos creativos y de aprendizaje.",
      sections: [
        { heading: "Uso permitido", body: ["Puedes utilizar Edu AI para estudiar, escribir, organizar ideas y generar audios de textos sobre los que tengas derecho de uso. No debes emplearlo para suplantar a otras personas, automatizar solicitudes, vulnerar servicios, difundir contenido ilegal o infringir derechos de terceros."] },
        { heading: "Disponibilidad y límites", body: ["El acceso gratuito de texto a voz está sujeto a una cuota diaria y a controles de seguridad. La disponibilidad puede variar por mantenimiento, capacidad o prevención de abuso. Edu AI puede ajustar límites para mantener un acceso justo y sostenible."] },
        { heading: "Tus contenidos", body: ["Conservas la responsabilidad sobre el texto que introduces y sobre el uso de los audios que descargas. Revisa toda respuesta o audio antes de usarlo en contextos académicos, profesionales, médicos, legales o financieros."] },
        { heading: "Cambios", body: ["Estas condiciones pueden actualizarse cuando cambien las funciones, los proveedores o las obligaciones aplicables. El uso continuado después de una actualización supone que has podido revisar la versión vigente."] },
      ],
    },
    about: {
      eyebrow: "SOBRE EL PROYECTO", title: "Una herramienta para pensar y escuchar", updated: "Edu AI · textoavoz.xyz",
      intro: "Edu AI combina un estudio de texto a voz, un espacio de aprendizaje y una conversación orientada a ordenar ideas con calma.",
      sections: [
        { heading: "Nuestro propósito", body: ["Queremos que una idea pueda pasar de una nota breve a una voz clara, una ruta de estudio o una conversación útil sin que una cuenta sea una condición para empezar."] },
        { heading: "Cómo cuidamos la experiencia", body: ["La voz gratuita tiene límites para que el servicio pueda mantenerse disponible para más personas. El cuaderno y las preferencias se conservan en el dispositivo por defecto; la seguridad se aplica antes de generar recursos que consumen capacidad."] },
        { heading: "Cómo se sostendrá", body: ["El proyecto está preparando contenido educativo original, medición responsable de audiencia y una posible modalidad de créditos para usos extensos. Cualquier publicidad o pago se activará solo cuando exista una política clara, aprobación correspondiente y una experiencia que no interrumpa el estudio."] },
      ],
    },
    contact: {
      eyebrow: "CONTACTO PÚBLICO", title: "Conversemos sobre Edu AI", updated: "Canal público disponible.",
      intro: "Para compartir una idea, reportar una dificultad o seguir el proyecto, puedes escribir mediante el perfil público indicado a continuación.",
      sections: [
        { heading: "Canal disponible", body: ["Edu AI mantiene su contacto público a través de Facebook. No envíes contraseñas, datos financieros ni información privada mediante redes sociales."] },
        { heading: "Soporte del servicio", body: ["Cuando reportes un error, incluye qué estabas intentando hacer, el idioma utilizado y el mensaje que apareció. Así será más fácil reproducir el problema sin solicitar datos personales innecesarios."] },
      ],
    },
  },
  en: {
    privacy: {
      eyebrow: "TRUST & PRIVACY", title: "Privacy at Edu AI", updated: "Last updated: August 18, 2026.",
      intro: "Edu AI is designed so you can try learning and voice tools without giving away more data than is necessary.",
      sections: [
        { heading: "Data that stays on your device", body: ["Conversations, language preferences, notes, progress and reading lists are stored locally in your browser when you use personal tools. You may delete them from the app controls or your browser settings."] },
        { heading: "Text to speech and service protection", body: ["When you create audio, the requested text, a technical quota identifier derived from your connection and anti-bot verification are processed to create the file and protect free access. These controls are not used to build advertising profiles.", "Speech synthesis uses Cloudflare infrastructure. Do not submit sensitive text, credentials, banking data or private information about other people."] },
        { heading: "Cookies, storage and third parties", body: ["Edu AI uses essential local storage to retain your preferences and work on the device. Domain-level measurement uses Cloudflare Web Analytics; it currently shows no ads and runs no personalized advertising tags.", "If optional analytics or ads are enabled in the future, this page will be updated before those technologies are activated and a consent choice will be shown where required."] },
        { heading: "Contact and changes", body: ["You can check policy changes on this page. For public questions about the project, use the official Facebook profile linked on the Contact page."] },
      ],
    },
    terms: {
      eyebrow: "RESPONSIBLE USE", title: "Terms of use", updated: "Last updated: August 18, 2026.",
      intro: "Edu AI offers text-to-speech, learning and conversation tools to support creative and learning processes.",
      sections: [
        { heading: "Permitted use", body: ["You may use Edu AI to study, write, organize ideas and create audio from text you have the right to use. Do not use it to impersonate others, automate requests, compromise services, distribute illegal content or violate third-party rights."] },
        { heading: "Availability and limits", body: ["Free text-to-speech access has a daily quota and security controls. Availability may vary due to maintenance, capacity or abuse prevention. Edu AI may adjust limits to keep access fair and sustainable."] },
        { heading: "Your content", body: ["You remain responsible for the text you submit and for the use of downloaded audio. Review every answer and audio before relying on it in academic, professional, medical, legal or financial contexts."] },
        { heading: "Changes", body: ["These terms may be updated when features, providers or applicable obligations change. Continued use after an update means you have had an opportunity to review the current version."] },
      ],
    },
    about: {
      eyebrow: "ABOUT THE PROJECT", title: "A tool to think and listen", updated: "Edu AI · textoavoz.xyz",
      intro: "Edu AI combines a text-to-speech studio, a learning space and a conversation designed to help you organize ideas calmly.",
      sections: [
        { heading: "Our purpose", body: ["We want an idea to move from a short note to a clear voice, a study path or a useful conversation without making an account a condition to start."] },
        { heading: "How we care for the experience", body: ["Free voice has limits so the service can remain available to more people. Notes and preferences stay on the device by default; security runs before creating resources that consume capacity."] },
        { heading: "How it can be sustained", body: ["The project is preparing original educational content, responsible audience measurement and a possible credit option for extended use. Any ads or payments will only be activated once there is a clear policy, the relevant approval and an experience that does not interrupt learning."] },
      ],
    },
    contact: {
      eyebrow: "PUBLIC CONTACT", title: "Let’s talk about Edu AI", updated: "Public channel available.",
      intro: "To share an idea, report an issue or follow the project, use the public profile below.",
      sections: [
        { heading: "Available channel", body: ["Edu AI keeps public contact through Facebook. Do not send passwords, financial information or private details through social networks."] },
        { heading: "Service support", body: ["When reporting an issue, include what you were trying to do, the language you used and the message you saw. This makes it easier to reproduce a problem without asking for unnecessary personal data."] },
      ],
    },
  },
  ru: {
    privacy: {
      eyebrow: "ДОВЕРИЕ И КОНФИДЕНЦИАЛЬНОСТЬ", title: "Конфиденциальность в Edu AI", updated: "Последнее обновление: 18 августа 2026 г.",
      intro: "Edu AI создан, чтобы вы могли пользоваться инструментами обучения и озвучивания, не передавая больше данных, чем необходимо.",
      sections: [
        { heading: "Данные на вашем устройстве", body: ["Диалоги, языковые настройки, заметки, прогресс и списки чтения хранятся локально в браузере при использовании личных инструментов. Их можно удалить из приложения или настроек браузера."] },
        { heading: "Озвучивание и защита сервиса", body: ["При создании аудио запрошенный текст, технический идентификатор квоты на основе подключения и антибот-проверка обрабатываются для создания файла и защиты бесплатного доступа. Эти средства не используются для создания рекламных профилей.", "Синтез речи использует инфраструктуру Cloudflare. Не отправляйте конфиденциальные тексты, пароли, банковские данные или личную информацию других людей."] },
        { heading: "Cookies, хранилище и третьи стороны", body: ["Edu AI использует необходимое локальное хранилище для сохранения ваших настроек и работы на устройстве. Для измерения домена используется Cloudflare Web Analytics; сейчас реклама и теги персонализированной рекламы не используются.", "Если в будущем появятся необязательная аналитика или реклама, эта страница будет обновлена до их активации, а при необходимости будет показан выбор согласия."] },
        { heading: "Контакт и изменения", body: ["Обновления политики публикуются на этой странице. Для публичных вопросов о проекте используйте официальный профиль Facebook на странице контактов."] },
      ],
    },
    terms: {
      eyebrow: "ОТВЕТСТВЕННОЕ ИСПОЛЬЗОВАНИЕ", title: "Условия использования", updated: "Последнее обновление: 18 августа 2026 г.",
      intro: "Edu AI предлагает инструменты озвучивания, обучения и диалога для поддержки творческой работы и обучения.",
      sections: [
        { heading: "Разрешённое использование", body: ["Вы можете использовать Edu AI для учёбы, письма, организации идей и создания аудио из текста, на который у вас есть права. Нельзя выдавать себя за других, автоматизировать запросы, нарушать работу сервисов, распространять незаконный контент или нарушать права третьих лиц."] },
        { heading: "Доступность и лимиты", body: ["Бесплатное озвучивание имеет дневную квоту и защитные механизмы. Доступность может меняться из-за обслуживания, нагрузки или предотвращения злоупотреблений. Edu AI может корректировать лимиты для справедливого и устойчивого доступа."] },
        { heading: "Ваш контент", body: ["Вы несёте ответственность за отправляемый текст и использование загруженного аудио. Проверяйте каждый ответ и аудио перед использованием в учебном, профессиональном, медицинском, юридическом или финансовом контексте."] },
        { heading: "Изменения", body: ["Эти условия могут обновляться при изменении функций, поставщиков или применимых обязанностей. Продолжение использования после обновления означает, что вы могли ознакомиться с актуальной версией."] },
      ],
    },
    about: {
      eyebrow: "О ПРОЕКТЕ", title: "Инструмент, чтобы думать и слушать", updated: "Edu AI · textoavoz.xyz",
      intro: "Edu AI объединяет студию озвучивания, пространство для обучения и диалог, помогающий спокойно упорядочить идеи.",
      sections: [
        { heading: "Наша цель", body: ["Мы хотим, чтобы идея могла перейти от короткой заметки к ясному голосу, плану обучения или полезному диалогу без обязательной учётной записи."] },
        { heading: "Как мы бережём опыт", body: ["У бесплатного голоса есть лимиты, чтобы сервис был доступен большему числу людей. Заметки и настройки по умолчанию остаются на устройстве; защита выполняется до создания ресурсов, потребляющих мощность."] },
        { heading: "Как проект может поддерживаться", body: ["Проект готовит оригинальные образовательные материалы, ответственное измерение аудитории и возможную систему кредитов для расширенного использования. Реклама или платежи будут включены только при наличии понятной политики, необходимого одобрения и без помех для обучения."] },
      ],
    },
    contact: {
      eyebrow: "ПУБЛИЧНЫЙ КОНТАКТ", title: "Связь с Edu AI", updated: "Доступен публичный канал.",
      intro: "Чтобы поделиться идеей, сообщить о проблеме или следить за проектом, используйте публичный профиль ниже.",
      sections: [
        { heading: "Доступный канал", body: ["Edu AI поддерживает публичный контакт через Facebook. Не отправляйте пароли, финансовую информацию или личные данные через социальные сети."] },
        { heading: "Поддержка сервиса", body: ["Сообщая об ошибке, укажите, что вы пытались сделать, какой язык использовали и какое сообщение увидели. Это помогает воспроизвести проблему без запроса лишних личных данных."] },
      ],
    },
  },
};

const GUIDES: Record<AppLanguage, Guide[]> = {
  es: [
    { id: "voz-clara", number: "01", title: "Cómo preparar un texto que se escucha bien", summary: "La voz empieza antes de pulsar el botón: en la manera de ordenar cada frase.", paragraphs: ["Un texto para escuchar necesita respiración. Divide una idea extensa en frases que puedan decirse de un solo impulso y deja una línea nueva cuando quieras marcar un cambio de ritmo.", "Lee el primer párrafo en voz baja antes de generarlo. Si te cuesta pronunciarlo sin correr, simplifica una palabra o mueve una coma. Esa pequeña revisión suele mejorar más el audio que añadir adornos."], practice: "Práctica: toma 120 palabras de una nota y conviértelas en tres párrafos cortos antes de crear el audio." },
    { id: "estudio-audio", number: "02", title: "Un método breve para estudiar con audio", summary: "Escuchar funciona mejor cuando tiene una pregunta y una pausa detrás.", paragraphs: ["Antes de convertir un tema en audio, escribe una pregunta concreta: «¿Qué diferencia hay entre…?» o «¿Cómo se relacionan estas dos ideas?». Esa pregunta le da una dirección a tu atención.", "Escucha una vez sin tomar notas. En la segunda escucha, detén el audio al final de cada bloque y anota una frase con tus propias palabras. Después comprueba qué parte aún no podrías explicar a otra persona."], practice: "Práctica: crea un audio de un concepto, escúchalo dos veces y redacta una pregunta que el audio no haya resuelto." },
    { id: "resumen-honesto", number: "03", title: "Resumir sin perder lo importante", summary: "Un resumen útil no reduce todo; conserva la relación entre las ideas.", paragraphs: ["Empieza por distinguir tesis, razones y ejemplos. La tesis responde qué se está defendiendo; las razones explican por qué; los ejemplos vuelven la idea tangible. No ocupan el mismo lugar en un resumen.", "Cuando conviertas el resumen en audio, abre con la tesis y termina con una pregunta de aplicación. Así el texto no queda como una lista, sino como una invitación a pensar."], practice: "Práctica: resume un artículo en una tesis, dos razones y un ejemplo; después añade una pregunta final." },
    { id: "ritmo", number: "04", title: "Pausas, ritmo y comprensión", summary: "Las pausas no son espacios vacíos: le dan al cerebro tiempo para organizar.", paragraphs: ["Usa un punto cuando termine una idea, no solo cuando una oración sea larga. Las enumeraciones suenan más claras si cada elemento ocupa una línea o está separado por punto y coma.", "Si vas a escuchar mientras caminas o haces una tarea repetitiva, reduce la densidad: una idea principal por párrafo y palabras conocidas. Guarda las definiciones complejas para un momento de atención plena."], practice: "Práctica: toma un párrafo denso y reescríbelo con tres pausas deliberadas." },
    { id: "preguntas-ia", number: "05", title: "Preguntar a una IA con intención", summary: "Una buena pregunta no busca una respuesta perfecta; define el trabajo que necesitas hacer.", paragraphs: ["Da contexto, objetivo y límite. En vez de «explícame historia», prueba «explícame este periodo para una presentación de cinco minutos y dame tres ideas que pueda verificar». El resultado será más fácil de evaluar.", "Conserva tu criterio. Pide fuentes cuando haya datos, contrasta afirmaciones importantes y corrige el tono hasta que el texto sea realmente tuyo."], practice: "Práctica: transforma una pregunta amplia en una petición con contexto, formato y un criterio de verificación." },
    { id: "habito", number: "06", title: "Un hábito de aprendizaje que sí cabe en tu día", summary: "La constancia nace de una unidad pequeña que puedes repetir, no de una sesión heroica.", paragraphs: ["Elige una franja concreta: diez minutos después del desayuno, al volver a casa o antes de dormir. Une ese momento a una acción sencilla: escuchar un audio corto, escribir una nota o responder una pregunta.", "Al final de la semana, no midas solo cuánto consumiste. Pregunta qué idea usaste, explicaste o conectaste con otra. El aprendizaje se vuelve visible cuando sale de la pantalla."], practice: "Práctica: diseña una rutina de diez minutos para tres días y define qué evidencia guardarás de cada sesión." },
  ],
  en: [
    { id: "voz-clara", number: "01", title: "How to prepare text that sounds clear", summary: "Voice begins before you press the button: in the way each sentence is arranged.", paragraphs: ["Text meant to be heard needs breathing room. Split a long idea into phrases you can say in one breath and start a new line when you want a change of pace.", "Read the first paragraph softly before generating it. If you cannot say it without rushing, simplify a word or move a comma. That small revision often improves audio more than extra decoration."], practice: "Practice: take 120 words from a note and turn them into three short paragraphs before creating audio." },
    { id: "estudio-audio", number: "02", title: "A short method for studying with audio", summary: "Listening works better when a question and a pause sit behind it.", paragraphs: ["Before turning a topic into audio, write one concrete question: “What is the difference between…?” or “How do these two ideas connect?” That gives your attention a direction.", "Listen once without notes. On the second listen, pause after each block and write one sentence in your own words. Then notice which part you still could not explain to someone else."], practice: "Practice: create audio for one concept, listen twice and write a question the audio did not solve." },
    { id: "resumen-honesto", number: "03", title: "Summarize without losing what matters", summary: "A useful summary does not shrink everything; it keeps the relationship between ideas.", paragraphs: ["Start by separating thesis, reasons and examples. The thesis says what is being argued; reasons explain why; examples make an idea tangible. They do not carry the same weight in a summary.", "When turning a summary into audio, open with the thesis and end with an application question. The text becomes an invitation to think rather than a list."], practice: "Practice: summarize an article in one thesis, two reasons and one example; then add a final question." },
    { id: "ritmo", number: "04", title: "Pauses, pace and understanding", summary: "Pauses are not empty space: they give your mind time to organize.", paragraphs: ["Use a full stop when an idea ends, not only when a sentence is long. Lists sound clearer when each item has its own line or is separated with semicolons.", "If you will listen while walking or doing a repetitive task, reduce density: one main idea per paragraph and familiar words. Save complex definitions for a time of full attention."], practice: "Practice: take a dense paragraph and rewrite it with three deliberate pauses." },
    { id: "preguntas-ia", number: "05", title: "Ask an AI with intention", summary: "A good question does not seek a perfect answer; it defines the work you need to do.", paragraphs: ["Give context, a goal and a limit. Instead of “explain history,” try “explain this period for a five-minute presentation and give me three ideas I can verify.” The result becomes easier to assess.", "Keep your judgment. Ask for sources when facts matter, cross-check important claims and revise the tone until the text is genuinely yours."], practice: "Practice: turn one broad question into a request with context, format and a verification criterion." },
    { id: "habito", number: "06", title: "A learning habit that fits your day", summary: "Consistency begins with a small unit you can repeat, not a heroic session.", paragraphs: ["Choose a concrete window: ten minutes after breakfast, on the way home or before sleep. Pair it with one simple action: listen to short audio, write a note or answer a question.", "At the end of the week, do not measure only how much you consumed. Ask which idea you used, explained or connected to another. Learning becomes visible when it leaves the screen."], practice: "Practice: design a ten-minute routine for three days and choose what evidence you will keep from each session." },
  ],
  ru: [
    { id: "voz-clara", number: "01", title: "Как подготовить текст, который звучит ясно", summary: "Голос начинается до нажатия кнопки — со способа построить каждую фразу.", paragraphs: ["Тексту для прослушивания нужен воздух. Разделяйте длинную мысль на фразы, которые можно произнести на одном дыхании, и начинайте новую строку, когда хотите изменить ритм.", "Прочитайте первый абзац вслух перед генерацией. Если его трудно произнести без спешки, упростите слово или переставьте запятую. Такая небольшая правка часто улучшает аудио сильнее, чем украшения."], practice: "Практика: возьмите 120 слов из заметки и превратите их в три коротких абзаца перед созданием аудио." },
    { id: "estudio-audio", number: "02", title: "Короткий метод учёбы с аудио", summary: "Слушание работает лучше, когда за ним стоит вопрос и пауза.", paragraphs: ["До превращения темы в аудио запишите один конкретный вопрос: «В чём разница между…?» или «Как связаны эти две идеи?». Это задаёт направление вниманию.", "Один раз прослушайте без заметок. Во второй раз остановитесь после каждого блока и запишите одну фразу своими словами. Затем отметьте то, что вы всё ещё не смогли бы объяснить другому человеку."], practice: "Практика: создайте аудио об одном понятии, прослушайте его дважды и запишите вопрос, на который оно не ответило." },
    { id: "resumen-honesto", number: "03", title: "Как кратко изложить, не потеряв главное", summary: "Полезное резюме не уменьшает всё подряд; оно сохраняет связь идей.", paragraphs: ["Сначала отделите тезис, причины и примеры. Тезис говорит, что утверждается; причины объясняют почему; примеры делают мысль наглядной. В резюме у них разный вес.", "Превращая резюме в аудио, начните с тезиса и закончите вопросом о применении. Тогда текст станет не списком, а приглашением подумать."], practice: "Практика: сведите статью к тезису, двум причинам и примеру, затем добавьте финальный вопрос." },
    { id: "ritmo", number: "04", title: "Паузы, темп и понимание", summary: "Паузы — не пустота: они дают мозгу время упорядочить смысл.", paragraphs: ["Ставьте точку, когда заканчивается мысль, а не только когда предложение стало длинным. Перечни звучат яснее, если каждый пункт занимает отдельную строку или разделён точкой с запятой.", "Если вы слушаете во время прогулки или повторяющейся работы, уменьшайте плотность: одна главная идея на абзац и знакомые слова. Сложные определения оставьте для времени полного внимания."], practice: "Практика: возьмите плотный абзац и перепишите его с тремя осознанными паузами." },
    { id: "preguntas-ia", number: "05", title: "Как осмысленно спрашивать ИИ", summary: "Хороший вопрос не ищет идеального ответа; он определяет нужную вам работу.", paragraphs: ["Дайте контекст, цель и ограничение. Вместо «объясни историю» попробуйте: «объясни этот период для пятиминутной презентации и дай три идеи, которые я смогу проверить». Так результат проще оценить.", "Сохраняйте собственное суждение. Просите источники, когда важны факты, проверяйте существенные утверждения и меняйте тон, пока текст не станет по-настоящему вашим."], practice: "Практика: превратите широкий вопрос в запрос с контекстом, форматом и критерием проверки." },
    { id: "habito", number: "06", title: "Учебная привычка, которая помещается в день", summary: "Постоянство начинается с маленького повторяемого шага, а не с героической сессии.", paragraphs: ["Выберите конкретное время: десять минут после завтрака, по возвращении домой или перед сном. Соедините его с простым действием: короткое аудио, заметка или ответ на вопрос.", "В конце недели измеряйте не только объём потреблённого. Спросите, какую мысль вы применили, объяснили или связали с другой. Учёба становится видимой, когда выходит за пределы экрана."], practice: "Практика: составьте десятиминутный план на три дня и решите, какое свидетельство каждой сессии сохраните." },
  ],
};

const UI_COPY: Record<AppLanguage, { guidesEyebrow: string; guidesTitle: string; guidesIntro: string; read: string; close: string; practice: string; sustainabilityTitle: string; sustainability: string; legal: string; back: string; facebook: string }> = {
  es: { guidesEyebrow: "LECTURAS ORIGINALES", guidesTitle: "Pequeñas guías para aprender con intención", guidesIntro: "Seis textos breves, escritos para que puedas convertir una idea en una práctica concreta.", read: "Leer guía", close: "Cerrar guía", practice: "Práctica breve", sustainabilityTitle: "Cómo se sostiene este espacio", sustainability: "Edu AI se está preparando para una monetización responsable. No hay anuncios activos ni pagos obligatorios en este momento.", legal: "Información del sitio", back: "Volver al estudio", facebook: "Seguir en Facebook" },
  en: { guidesEyebrow: "ORIGINAL READS", guidesTitle: "Small guides for intentional learning", guidesIntro: "Six short texts written to help you turn an idea into a concrete practice.", read: "Read guide", close: "Close guide", practice: "Short practice", sustainabilityTitle: "How this space is sustained", sustainability: "Edu AI is preparing for responsible monetization. There are no active ads or required payments at this time.", legal: "Site information", back: "Back to the studio", facebook: "Follow on Facebook" },
  ru: { guidesEyebrow: "ОРИГИНАЛЬНЫЕ ТЕКСТЫ", guidesTitle: "Небольшие руководства для осмысленной учёбы", guidesIntro: "Шесть коротких текстов, помогающих превратить идею в конкретную практику.", read: "Открыть руководство", close: "Закрыть руководство", practice: "Короткая практика", sustainabilityTitle: "Как поддерживается это пространство", sustainability: "Edu AI готовится к ответственной монетизации. Сейчас здесь нет активной рекламы и обязательных платежей.", legal: "Информация о сайте", back: "Вернуться в студию", facebook: "Подписаться в Facebook" },
};

export function publicPageFromHash(hash: string): PublicPageId | null {
  const value = hash.replace(/^#/, "");
  return value === "privacy" || value === "terms" || value === "about" || value === "contact" ? value : null;
}

export function EditorialGuides({ language }: { language: AppLanguage }) {
  const [openGuide, setOpenGuide] = useState<string | null>(null);
  const copy = UI_COPY[language];
  return <section className="editorial-guides" id="guides" aria-labelledby="guides-title">
    <div className="editorial-guides-heading"><div><p className="overline">{copy.guidesEyebrow}</p><h2 id="guides-title">{copy.guidesTitle}</h2><p>{copy.guidesIntro}</p></div><BookOpen aria-hidden="true" /></div>
    <div className="guide-grid">{GUIDES[language].map(guide => {
      const isOpen = guide.id === openGuide;
      return <article className={`guide-card ${isOpen ? "open" : ""}`} key={guide.id}>
        <div className="guide-card-top"><span>{guide.number}</span><Sparkles size={15} aria-hidden="true" /></div>
        <h3>{guide.title}</h3><p>{guide.summary}</p>
        <button type="button" className="guide-toggle" onClick={() => setOpenGuide(isOpen ? null : guide.id)} aria-expanded={isOpen} aria-controls={`guide-${guide.id}`}>
          {isOpen ? copy.close : copy.read}<ChevronDown size={15} aria-hidden="true" />
        </button>
        {isOpen && <div id={`guide-${guide.id}`} className="guide-detail"><p>{guide.paragraphs[0]}</p><p>{guide.paragraphs[1]}</p><div><strong>{copy.practice}</strong><span>{guide.practice}</span></div></div>}
      </article>;
    })}</div>
    <aside className="sustainability-note"><HeartHandshake size={19} aria-hidden="true" /><div><strong>{copy.sustainabilityTitle}</strong><p>{copy.sustainability}</p></div></aside>
  </section>;
}

export function PublicFooter({ language, onNavigate }: { language: AppLanguage; onNavigate: (page: PublicPageId) => void }) {
  const copy = UI_COPY[language];
  return <footer className="public-footer"><div className="public-footer-brand"><span><img src="https://edusearch-9qua9exp.manus.space/manus-storage/edu-ai-origen-mark_85743c02.png" alt="" /></span><div><strong>Edu AI</strong><small>textoavoz.xyz</small></div></div><div className="public-footer-links" aria-label={copy.legal}><button onClick={() => onNavigate("about")}>{language === "es" ? "Acerca de" : language === "ru" ? "О проекте" : "About"}</button><button onClick={() => onNavigate("privacy")}>{language === "es" ? "Privacidad" : language === "ru" ? "Конфиденциальность" : "Privacy"}</button><button onClick={() => onNavigate("terms")}>{language === "es" ? "Términos" : language === "ru" ? "Условия" : "Terms"}</button><button onClick={() => onNavigate("contact")}>{language === "es" ? "Contacto" : language === "ru" ? "Контакты" : "Contact"}</button></div><a className="public-footer-social" href={FACEBOOK_URL} target="_self" aria-label={copy.facebook} title={copy.facebook}><FacebookGlyph /></a></footer>;
}

export function PublicInfoPage({ page, language, onBack }: { page: PublicPageId; language: AppLanguage; onBack: () => void }) {
  const copy = PAGE_COPY[language][page];
  const ui = UI_COPY[language];
  const icon = page === "privacy" ? <ShieldCheck aria-hidden="true" /> : page === "terms" ? <Scale aria-hidden="true" /> : page === "about" ? <Sparkles aria-hidden="true" /> : <Mail aria-hidden="true" />;
  return <main className="public-page-shell"><section className="public-page"><button className="public-back" onClick={onBack}><span>←</span>{ui.back}</button><header><span className="public-page-icon">{icon}</span><p className="overline">{copy.eyebrow}</p><h1>{copy.title}</h1><p className="public-page-intro">{copy.intro}</p><small>{copy.updated}</small></header><div className="public-page-sections">{copy.sections.map(section => <section key={section.heading}><h2>{section.heading}</h2>{section.body.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</section>)}</div>{page === "contact" && <a className="public-contact-link" href={FACEBOOK_URL} target="_self" aria-label={ui.facebook} title={ui.facebook}><FacebookGlyph /></a>}</section></main>;
}
