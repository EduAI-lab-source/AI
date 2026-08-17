import { Copy, Eye, Link2, ShieldCheck, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import type { AppLanguage } from "@/lib/i18n";

type Note = { id: string; content: string; createdAt: number };

type NotebookSharePanelProps = { language: AppLanguage; notes: Note[]; accountConnected: boolean };

const words = {
  es: { title: "Compartir cuaderno", detail: "Revisa exactamente qué ideas saldrán de Edu AI. El enlace vence y puedes revocarlo cuando quieras.", signIn: "Conecta una cuenta para crear enlaces revocables.", preview: "Vista previa del contenido", days: "Vence en", create: "Crear enlace temporal", empty: "Guarda al menos una nota antes de crear un enlace.", copy: "Copiar enlace", copied: "Enlace copiado", active: "Enlaces activos", revoke: "Revocar", revoked: "Revocado", noLinks: "Aún no has compartido ningún cuaderno.", privacy: "Solo se comparte el cuaderno mostrado abajo; las conversaciones y preferencias quedan privadas.", one: "1 día", seven: "7 días", thirty: "30 días" },
  en: { title: "Share notebook", detail: "Review exactly which ideas will leave Edu AI. The link expires and you can revoke it at any time.", signIn: "Connect an account to create revocable links.", preview: "Content preview", days: "Expires in", create: "Create temporary link", empty: "Save at least one note before creating a link.", copy: "Copy link", copied: "Link copied", active: "Active links", revoke: "Revoke", revoked: "Revoked", noLinks: "You have not shared a notebook yet.", privacy: "Only the notebook shown below is shared; conversations and preferences remain private.", one: "1 day", seven: "7 days", thirty: "30 days" },
  ru: { title: "Поделиться блокнотом", detail: "Проверьте, какие именно идеи покинут Edu AI. Ссылка истекает, и её можно отозвать в любой момент.", signIn: "Подключите аккаунт, чтобы создавать отзывные ссылки.", preview: "Предпросмотр содержимого", days: "Истекает через", create: "Создать временную ссылку", empty: "Сохраните хотя бы одну заметку перед созданием ссылки.", copy: "Копировать ссылку", copied: "Ссылка скопирована", active: "Активные ссылки", revoke: "Отозвать", revoked: "Отозвана", noLinks: "Вы ещё не поделились блокнотом.", privacy: "Передаётся только показанный ниже блокнот; беседы и настройки остаются приватными.", one: "1 день", seven: "7 дней", thirty: "30 дней" },
} as const;

export function NotebookSharePanel({ language, notes, accountConnected }: NotebookSharePanelProps) {
  const copy = words[language];
  const [days, setDays] = useState(7);
  const [lastUrl, setLastUrl] = useState("");
  const [didCopy, setDidCopy] = useState(false);
  const sharing = trpc.sharing.create.useMutation();
  const revoke = trpc.sharing.revoke.useMutation();
  const links = trpc.sharing.list.useQuery(undefined, { enabled: accountConnected, refetchOnWindowFocus: false });
  const preview = useMemo(() => notes.map(note => note.content.trim()).filter(Boolean), [notes]);
  const makeLink = async () => {
    if (!preview.length) return;
    const result = await sharing.mutateAsync({ title: `${language === "es" ? "Cuaderno de Edu AI" : language === "ru" ? "Блокнот Edu AI" : "Edu AI notebook"} · ${preview.length}`, snapshot: JSON.stringify({ version: 1, notes: notes.map(({ content, createdAt }) => ({ content, createdAt })) }), expiresInDays: days });
    const url = `https://textoavoz.xyz/#share=${result.token}`;
    setLastUrl(url);
    await links.refetch();
  };
  const copyLink = async (url: string) => { await navigator.clipboard?.writeText(url); setDidCopy(true); window.setTimeout(() => setDidCopy(false), 1800); };
  return <section className="notebook-share" aria-label={copy.title}>
    <div className="notebook-share-heading"><div><p className="book-kicker">{copy.title.toUpperCase()}</p><h4>{copy.title}</h4><p>{copy.detail}</p></div><Link2 size={20} /></div>
    {!accountConnected ? <p className="notebook-share-lock"><ShieldCheck size={15} />{copy.signIn}</p> : <>
      <details className="share-preview" open><summary><Eye size={15} />{copy.preview} <span>{preview.length}</span></summary><div>{preview.length ? preview.map((note, index) => <p key={`${index}-${note.slice(0, 12)}`}>{note}</p>) : <p>{copy.empty}</p>}</div></details>
      <label className="share-expiry">{copy.days}<select value={days} onChange={event => setDays(Number(event.target.value))}><option value={1}>{copy.one}</option><option value={7}>{copy.seven}</option><option value={30}>{copy.thirty}</option></select></label>
      <button className="share-create" onClick={makeLink} disabled={!preview.length || sharing.isPending}><Link2 size={15} />{copy.create}</button>
      <p className="share-privacy"><ShieldCheck size={14} />{copy.privacy}</p>
      {lastUrl && <div className="share-created"><input value={lastUrl} readOnly aria-label={copy.copy} /><button onClick={() => copyLink(lastUrl)}><Copy size={15} />{didCopy ? copy.copied : copy.copy}</button></div>}
      <div className="share-link-list"><h5>{copy.active}</h5>{links.data?.length ? links.data.map(link => { const url = `https://textoavoz.xyz/#share=${link.token}`; const inactive = Boolean(link.revokedAt) || (link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now()); return <article key={link.id}><div><strong>{link.title}</strong><small>{inactive ? copy.revoked : new Date(link.expiresAt!).toLocaleDateString(language === "es" ? "es" : language)}</small></div>{inactive ? <span>{copy.revoked}</span> : <div><button onClick={() => copyLink(url)} aria-label={copy.copy}><Copy size={14} /></button><button onClick={async () => { await revoke.mutateAsync({ id: link.id }); await links.refetch(); }} aria-label={copy.revoke}><Trash2 size={14} /></button></div>}</article>; }) : <p>{copy.noLinks}</p>}</div>
    </>}
  </section>;
}
