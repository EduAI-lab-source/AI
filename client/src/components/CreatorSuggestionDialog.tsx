import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { submitCreatorSuggestion } from "@/lib/creatorSuggestions";
import type { AppLanguage } from "@/lib/i18n";
import { HeartHandshake, LoaderCircle, Send } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

const copyFor = (language: AppLanguage) => language === "ru"
  ? { title: "Отправить предложение создателю", detail: "Ваше сообщение будет отправлено приватно. Адрес получателя не отображается.", name: "Ваше имя", message: "Ваша идея или предложение", send: "Отправить предложение", sent: "Спасибо. Ваше предложение отправлено.", offline: "Подключитесь к интернету, чтобы отправить предложение.", privacy: "Не указывайте пароли, коды или личные данные." }
  : language === "en"
    ? { title: "Send a suggestion to the creator", detail: "Your message is sent privately. The recipient address is never shown.", name: "Your name", message: "Your idea or suggestion", send: "Send suggestion", sent: "Thank you. Your suggestion was sent.", offline: "Reconnect to the internet to send your suggestion.", privacy: "Do not include passwords, codes, or sensitive personal data." }
    : { title: "Enviar sugerencia al creador", detail: "Tu mensaje se envía de forma privada. El correo destinatario nunca se muestra.", name: "Tu nombre", message: "Tu idea o sugerencia", send: "Enviar sugerencia", sent: "Gracias. Tu sugerencia fue enviada.", offline: "Recupera la conexión para enviar tu sugerencia.", privacy: "No incluyas contraseñas, códigos ni datos personales sensibles." };

export function CreatorSuggestionDialog({ open, onOpenChange, language, networkAvailable }: { open: boolean; onOpenChange: (open: boolean) => void; language: AppLanguage; networkAvailable: boolean }) {
  const copy = copyFor(language);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => { if (!open) { setStatus("idle"); setError(""); } }, [open]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!networkAvailable || status === "sending") return;
    setStatus("sending");
    setError("");
    try {
      await submitCreatorSuggestion({ name: name.trim(), message: message.trim(), website });
      setStatus("sent");
      setName("");
      setMessage("");
    } catch (reason) {
      setStatus("error");
      setError(reason instanceof Error ? reason.message : "No pudimos enviar tu sugerencia. Inténtalo de nuevo.");
    }
  };

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="creator-suggestion-dialog"><DialogHeader><span className="creator-suggestion-icon"><HeartHandshake size={19} /></span><DialogTitle>{copy.title}</DialogTitle><DialogDescription>{copy.detail}</DialogDescription></DialogHeader><form onSubmit={submit} className="creator-suggestion-form"><label>{copy.name}<input value={name} onChange={event => setName(event.target.value)} minLength={2} maxLength={80} autoComplete="name" required disabled={!networkAvailable || status === "sending"} /></label><label>{copy.message}<textarea value={message} onChange={event => setMessage(event.target.value)} minLength={8} maxLength={1200} required disabled={!networkAvailable || status === "sending"} /></label><label className="creator-suggestion-honeypot" aria-hidden="true">Website<input value={website} onChange={event => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" /></label><p className="creator-suggestion-privacy">{copy.privacy}</p>{!networkAvailable && <p className="creator-suggestion-error">{copy.offline}</p>}{status === "sent" && <p className="creator-suggestion-success">{copy.sent}</p>}{status === "error" && <p className="creator-suggestion-error">{error}</p>}<DialogFooter><button type="submit" className="creator-suggestion-submit" disabled={!networkAvailable || status === "sending"}>{status === "sending" ? <LoaderCircle className="creator-suggestion-spinner" size={16} /> : <Send size={16} />}{copy.send}</button></DialogFooter></form></DialogContent></Dialog>;
}
