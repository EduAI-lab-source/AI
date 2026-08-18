import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");
const source = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), "utf8");

describe("activos SEO de Edu AI", () => {
  it("describe la función pública de texto a voz con metadatos canónicos", () => {
    const html = source("client/index.html");

    expect(html).toContain("Texto a voz gratis en español: crea y descarga MP3 | Edu AI");
    expect(html).toContain('rel="canonical" href="https://textoavoz.xyz/"');
    expect(html).toContain('name="description" content="Convierte texto en una voz natural en español y descarga tu MP3.');
    expect(html).toContain('"@type": "WebSite"');
    expect(html).toContain('"@type": "WebApplication"');
    expect(html).toContain('"isAccessibleForFree": true');
  });

  it("publica rutas de rastreo coherentes con el dominio oficial", () => {
    const robots = source("client/public/robots.txt");
    const sitemap = source("client/public/sitemap.xml");

    expect(robots).toContain("Sitemap: https://textoavoz.xyz/sitemap.xml");
    expect(sitemap).toContain("https://textoavoz.xyz/");
    expect(sitemap).toContain("<urlset");
  });

  it("actualiza los títulos dinámicos sin ocultar el uso real de la herramienta", () => {
    const i18n = source("client/src/lib/i18n.ts");

    expect(i18n).toContain("Texto a voz gratis en español: crea y descarga MP3 | Edu AI");
    expect(i18n).toContain("Free Spanish Text to Speech: Create and Download MP3 | Edu AI");
    expect(i18n).toContain("Текст в речь на испанском: создайте и скачайте MP3 | Edu AI");
  });
});
