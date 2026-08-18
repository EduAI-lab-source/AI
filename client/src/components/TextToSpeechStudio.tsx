import { Download, FileAudio, LoaderCircle, Play, Sparkles, Volume2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AppLanguage } from "@/lib/i18n";
import { TTS_DAILY_CHARACTER_LIMIT, TTS_MAX_CHARACTERS, getTtsApiUrl, getTtsError, getTtsVisitorId, normalizeTtsText } from "@/lib/ttsRuntime";

type Voice = { id: string; name: string; note: string };

const VOICES: Record<AppLanguage, Voice[]> = {
  es: [
    { id: "aquila", name: "Aquila", note: "Clara y cercana" }, { id: "celeste", name: "Celeste", note: "Suave y serena" },
    { id: "nestor", name: "Néstor", note: "Profunda y pausada" }, { id: "diana", name: "Diana", note: "Luminosa y expresiva" },
    { id: "javier", name: "Javier", note: "Dinámica y directa" }, { id: "selena", name: "Selena", note: "Cálida y envolvente" },
  ],
  en: [
    { id: "aquila", name: "Aquila", note: "Clear and close" }, { id: "celeste", name: "Celeste", note: "Soft and calm" },
    { id: "nestor", name: "Néstor", note: "Deep and measured" }, { id: "diana", name: "Diana", note: "Bright and expressive" },
    { id: "javier", name: "Javier", note: "Dynamic and direct" }, { id: "selena", name: "Selena", note: "Warm and immersive" },
  ],
  ru: [
    { id: "aquila", name: "Aquila", note: "Ясный и близкий" }, { id: "celeste", name: "Celeste", note: "Мягкий и спокойный" },
    { id: "nestor", name: "Néstor", note: "Глубокий и размеренный" }, { id: "diana", name: "Diana", note: "Светлый и выразительный" },
    { id: "javier", name: "Javier", note: "Динамичный и прямой" }, { id: "selena", name: "Selena", note: "Тёплый и обволакивающий" },
  ],
};

const STUDIO_COPY: Record<AppLanguage, { eyebrow: string; title: string; emphasis: string; description: string; textarea: string; voice: string; generate: string; generating: string; daily: string; privacy: string; ready: string; download: string; useResponse: string; errorFallback: string }> = {
  es: { eyebrow: "TEXTO A VOZ · ESTUDIO ABIERTO", title: "Dale una voz", emphasis: "a tus ideas.", description: "Escribe, elige una voz y descarga un audio breve con una interpretación natural. Sin cuenta y sin anuncios entre tú y tu texto.", textarea: "Escribe el texto que quieres escuchar…", voice: "Elige una voz", generate: "Crear audio", generating: "Preparando la voz…", daily: "Hasta 3 audios al día · 650 caracteres por audio · 1.950 en total", privacy: "El texto se procesa para crear el audio y no se guarda como una biblioteca pública.", ready: "Tu audio está listo", download: "Descargar MP3", useResponse: "Usar la última respuesta de Edu AI", errorFallback: "No pudimos crear el audio esta vez. Inténtalo de nuevo en un momento." },
  en: { eyebrow: "TEXT TO SPEECH · OPEN STUDIO", title: "Give your ideas", emphasis: "a voice.", description: "Write, choose a voice, and download a short audio with a natural delivery. No account and no ads between you and your text.", textarea: "Write the text you want to hear…", voice: "Choose a voice", generate: "Create audio", generating: "Preparing the voice…", daily: "Up to 3 audios a day · 650 characters each · 1,950 total", privacy: "Your text is processed to create the audio and is not stored as a public library.", ready: "Your audio is ready", download: "Download MP3", useResponse: "Use Edu AI’s latest reply", errorFallback: "We could not create the audio this time. Try again in a moment." },
  ru: { eyebrow: "ТЕКСТ В РЕЧЬ · ОТКРЫТАЯ СТУДИЯ", title: "Дайте своим идеям", emphasis: "голос.", description: "Напишите текст, выберите голос и скачайте короткое аудио с естественным звучанием. Без аккаунта и рекламы между вами и текстом.", textarea: "Введите текст, который хотите услышать…", voice: "Выберите голос", generate: "Создать аудио", generating: "Готовим голос…", daily: "До 3 аудио в день · до 650 символов каждое · всего 1 950", privacy: "Текст обрабатывается для создания аудио и не хранится как публичная библиотека.", ready: "Аудио готово", download: "Скачать MP3", useResponse: "Использовать последний ответ Edu AI", errorFallback: "Не удалось создать аудио. Повторите попытку через мгновение." },
};

const DEFAULT_TEXT: Record<AppLanguage, string> = {
  es: "Una idea que se escucha también puede encontrar su camino.",
  en: "An idea that is heard can also find its way.",
  ru: "Идея, которую слышат, тоже может найти свой путь.",
};

export function TextToSpeechStudio({ language, latestAssistantMessage }: { language: AppLanguage; latestAssistantMessage?: string }) {
  const copy = STUDIO_COPY[language];
  const voices = VOICES[language];
  const [text, setText] = useState(() => DEFAULT_TEXT[language]);
  const [speaker, setSpeaker] = useState("aquila");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const cleanText = useMemo(() => normalizeTtsText(text), [text]);
  const selectedVoice = voices.find(voice => voice.id === speaker) ?? voices[0];

  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);
  useEffect(() => { if (!voices.some(voice => voice.id === speaker)) setSpeaker("aquila"); }, [speaker, voices]);

  const useLatestResponse = () => {
    if (!latestAssistantMessage) return;
    setText(latestAssistantMessage.slice(0, TTS_MAX_CHARACTERS));
    setStatus("");
  };

  const generateAudio = async () => {
    if (!cleanText || cleanText.length > TTS_MAX_CHARACTERS || isGenerating) return;
    const visitorId = getTtsVisitorId();
    if (!visitorId) { setStatus(copy.errorFallback); return; }
    setIsGenerating(true);
    setStatus("");
    try {
      const response = await fetch(getTtsApiUrl(), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: cleanText, speaker, visitorId }),
      });
      if (!response.ok) throw new Error(await getTtsError(response));
      const audio = await response.blob();
      const nextUrl = URL.createObjectURL(audio);
      setAudioUrl(current => { if (current) URL.revokeObjectURL(current); return nextUrl; });
      const remainingHeader = Number(response.headers.get("x-edu-ai-characters-left"));
      if (Number.isFinite(remainingHeader)) setRemaining(remainingHeader);
    } catch (error) {
      setStatus(error instanceof Error && error.message ? error.message : copy.errorFallback);
    } finally {
      setIsGenerating(false);
    }
  };

  return <section className="tts-studio" aria-labelledby="tts-title">
    <div className="tts-intro">
      <p className="tts-overline"><Sparkles size={13} /> {copy.eyebrow}</p>
      <h2 id="tts-title">{copy.title}<br /><em>{copy.emphasis}</em></h2>
      <p>{copy.description}</p>
      {latestAssistantMessage && <button className="tts-use-response" onClick={useLatestResponse}><FileAudio size={14} />{copy.useResponse}</button>}
    </div>
    <div className="tts-workbench">
      <div className="tts-workbench-top"><label htmlFor="tts-text">{copy.textarea}</label><span>{cleanText.length}/{TTS_MAX_CHARACTERS}</span></div>
      <textarea id="tts-text" value={text} maxLength={TTS_MAX_CHARACTERS} onChange={event => setText(event.target.value)} placeholder={copy.textarea} />
      <div className="tts-voices" role="radiogroup" aria-label={copy.voice}>
        <p><Volume2 size={14} />{copy.voice}</p>
        <div>{voices.map(voice => <button key={voice.id} type="button" role="radio" aria-checked={speaker === voice.id} className={speaker === voice.id ? "active" : ""} onClick={() => setSpeaker(voice.id)}><strong>{voice.name}</strong><small>{voice.note}</small></button>)}</div>
      </div>
      <div className="tts-actions">
        <button className="tts-generate" onClick={generateAudio} disabled={isGenerating || !cleanText}><span>{isGenerating ? <LoaderCircle className="tts-spinner" size={17} /> : <Play size={17} fill="currentColor" />}</span>{isGenerating ? copy.generating : copy.generate}</button>
        <p>{copy.daily}{remaining !== null ? ` · ${remaining}/${TTS_DAILY_CHARACTER_LIMIT}` : ""}</p>
      </div>
      {status && <p className="tts-status" role="status">{status}</p>}
      {audioUrl && <div className="tts-result"><div><span><Volume2 size={17} /></span><p><strong>{copy.ready}</strong><small>{selectedVoice.name} · MP3</small></p></div><audio controls src={audioUrl} /><a href={audioUrl} download={`edu-ai-${selectedVoice.id}.mp3`}><Download size={16} />{copy.download}</a></div>}
      <p className="tts-privacy">{copy.privacy}</p>
    </div>
  </section>;
}
