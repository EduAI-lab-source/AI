import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");
const source = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), "utf8");

describe("experiencia pública de Edu AI", () => {
  it("no muestra ni inicia el acceso externo desde la pantalla principal", () => {
    const home = source("client/src/pages/Home.tsx");

    expect(home).not.toContain("useAuth");
    expect(home).not.toContain("startLogin");
    expect(home).not.toContain("Guardar con cuenta");
    expect(home).not.toContain("account-entry");
  });

  it("usa un emblema integrado como marca coherente sin depender de archivos externos", () => {
    const home = source("client/src/pages/Home.tsx");

    expect(home).toContain('import { EduAiMark } from "@/components/EduAiMark"');
    expect(home).toContain("<EduAiMark />");
    expect(home).not.toContain("manus-storage");
    expect(home).toContain('className="identity-orb"');
    expect(home).toContain('className="header-mark"');
    expect(home).toContain("<TextToSpeechStudio");
  });

  it("conserva la copia cifrada privada y no ofrece sincronización o enlaces dependientes de cuenta", () => {
    const studio = source("client/src/components/LearningStudio.tsx");

    expect(studio).toContain("trpc.workspace.sync.useMutation()");
    expect(studio).not.toContain("accountConnected");
    expect(studio).not.toContain("accountWorkspaceSync");
    expect(studio).not.toContain("NotebookSharePanel");
    expect(studio).not.toContain("Conectar cuenta");
  });

  it("ofrece contenido editorial y páginas de confianza sin activar anuncios todavía", () => {
    const home = source("client/src/pages/Home.tsx");
    const trustContent = source("client/src/components/PublicTrustContent.tsx");

    expect(home).toContain("<EditorialGuides");
    expect(home).toContain("<PublicFooter");
    expect(trustContent).toContain('privacy: {');
    expect(trustContent).toContain('terms: {');
    expect(trustContent).toContain('about: {');
    expect(trustContent).toContain('contact: {');
    expect(trustContent).toContain('id: "voz-clara"');
    expect(trustContent).toContain('id: "habito"');
    expect(trustContent).not.toContain("adsbygoogle");
  });

  it("mantiene el perfil oficial de Facebook accesible en la misma pestaña con apertura nativa y ruta de respaldo móvil", () => {
    const home = source("client/src/pages/Home.tsx");
    const trustContent = source("client/src/components/PublicTrustContent.tsx");

    expect(home).toContain('href="https://www.facebook.com/EduardovipJ" target="_self"');
    expect(trustContent).toContain('const FACEBOOK_URL = "https://www.facebook.com/EduardovipJ/"');
    expect(trustContent).toContain("FACEBOOK_ANDROID_INTENT");
    expect(trustContent).toContain("browser_fallback_url=");
    expect(trustContent).toContain('href={FACEBOOK_URL} target="_self" onClick={openFacebook}');
    expect(trustContent).toContain('className="public-facebook-fallback"');
    expect(trustContent).not.toContain('target="_blank"');
    expect(trustContent).not.toContain("window.open(");
  });

  it("retira por completo la referencia temporal de Warframe del cierre público", () => {
    const home = source("client/src/pages/Home.tsx");
    const styles = source("client/src/index.css");

    expect(home).not.toContain("Dormir no da platinos, joven. El Hombre del Muro no te lo perdonará. Si es contigo, Coquí God.");
    expect(home).not.toContain('className="warframe-footer-reference"');
    expect(styles).not.toContain(".warframe-footer-reference");
  });

  it("mantiene una dirección cromática vibrante y una pulsación táctil móvil más contenida", () => {
    const styles = source("client/src/index.css");

    expect(styles).toContain("Dirección cromática vibrante");
    expect(styles).toContain("linear-gradient(120deg, #6044da, #8b42dc)");
    expect(styles).toContain("edu-ambient-pulse-mobile");
    expect(styles).toContain("circle 3.25rem at var(--ambient-x)");
    expect(styles).toContain("circle 9rem at var(--ambient-x)");
    expect(styles).toContain("El móvil mantiene la misma dirección índigo/violeta");
    expect(styles).toContain("#2c176a 0%, #23307d 57%, #0c6574 100%");
  });

});
