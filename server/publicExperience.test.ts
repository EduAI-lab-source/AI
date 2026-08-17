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

  it("conserva la copia cifrada privada y no ofrece sincronización o enlaces dependientes de cuenta", () => {
    const studio = source("client/src/components/LearningStudio.tsx");

    expect(studio).toContain("trpc.workspace.sync.useMutation()");
    expect(studio).not.toContain("accountConnected");
    expect(studio).not.toContain("accountWorkspaceSync");
    expect(studio).not.toContain("NotebookSharePanel");
    expect(studio).not.toContain("Conectar cuenta");
  });
});
