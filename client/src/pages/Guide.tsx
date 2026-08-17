import { ArrowLeft, Bot, CheckCircle2, Compass, ExternalLink, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "wouter";

const steps = [
  { icon: Search, title: "Define tu objetivo", text: "Busca por tarea o categoría: diseñar, traducir, automatizar, programar, estudiar o crear un video." },
  { icon: Compass, title: "Abre las fichas", text: "Cada ficha explica para qué sirve la herramienta, sus puntos fuertes, sus límites, casos de uso y su plan gratuito." },
  { icon: Bot, title: "Pregunta a Edu AI", text: "Pide recomendaciones, compara opciones y aclara tu nivel de experiencia o presupuesto para recibir una orientación más útil." },
  { icon: CheckCircle2, title: "Verifica antes de elegir", text: "Usa el enlace oficial para confirmar precios, disponibilidad, derechos de uso y condiciones vigentes antes de contratar." },
];

export default function Guide() {
  return (
    <main className="guide-page">
      <header className="detail-nav"><Link href="/" className="back-link"><ArrowLeft size={17} /> Volver al directorio</Link><Link href="/" className="brand-mini"><span>e</span> Edu AI</Link></header>
      <section className="guide-hero"><div className="eyebrow eyebrow-light"><Sparkles size={14} /> Guía de uso</div><h1>Elige tecnología con <span>criterio.</span></h1><p>Edu AI no pretende reemplazar tu juicio: organiza información útil para que puedas explorar herramientas de IA con más claridad y menos ruido.</p></section>
      <section className="guide-steps">{steps.map(({ icon: Icon, title, text }, index) => <article key={title}><span className="guide-number">0{index + 1}</span><Icon size={21} /><h2>{title}</h2><p>{text}</p></article>)}</section>
      <section className="guide-notes"><div><ShieldCheck size={21} /><h2>Cómo trabaja Edu AI</h2><p>Edu AI tiene una identidad y un tono propios. En la versión estática analiza el catálogo local para recomendar y comparar, sin enviar claves privadas al navegador. Puede recordar una conversación breve mientras navegas por la página.</p></div><div><ExternalLink size={21} /><h2>Información responsable</h2><p>Los proveedores actualizan sus planes y funciones con frecuencia. Por eso se muestran enlaces oficiales y se evita inventar puntuaciones, reseñas o condiciones que no puedan verificarse.</p></div></section>
      <section className="guide-cta"><div><span className="eyebrow eyebrow-light">Listo para explorar</span><h2>Cuéntale a Edu AI qué quieres lograr.</h2></div><Link href="/" className="official-button">Ir al catálogo <ArrowLeft className="rotate-180" size={17} /></Link></section>
    </main>
  );
}
