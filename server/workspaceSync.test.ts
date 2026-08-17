import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

const syncId = "v".repeat(48);

function createCaller(headers: Record<string, string> = {}) {
  return appRouter.createCaller({
    req: { headers, ip: "127.0.0.1" },
    res: { clearCookie: () => undefined },
    user: null,
  } as any);
}

function createAccountCaller(headers: Record<string, string> = {}) {
  return appRouter.createCaller({
    req: { headers, ip: "127.0.0.1" },
    res: { clearCookie: () => undefined },
    user: { id: 999_999, openId: "test-account-workspace" },
  } as any);
}

describe("sincronización cifrada del espacio de aprendizaje", () => {
  it("rechaza solicitudes que no pasan por el gateway privado", async () => {
    await expect(createCaller().workspace.sync({ action: "get", syncId })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("valida que los identificadores de sincronización sean impredecibles y con formato seguro", async () => {
    await expect(
      createCaller().workspace.sync({ action: "get", syncId: "identificador-corto" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("no permite guardar una instantánea sin contenido cifrado", async () => {
    const configuredSecret = process.env.EDU_AI_GATEWAY_SECRET;
    expect(configuredSecret).toBeTruthy();

    await expect(
      createCaller({ "x-gateway-secret": configuredSecret! }).workspace.sync({ action: "put", syncId })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("requiere una sesión autenticada para acceder a la copia asociada a cuenta", async () => {
    await expect(createCaller().workspace.accountSync({ action: "get" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("mantiene la puerta del gateway y valida el contenido antes de tocar datos de cuenta", async () => {
    const configuredSecret = process.env.EDU_AI_GATEWAY_SECRET;
    expect(configuredSecret).toBeTruthy();

    await expect(createAccountCaller().workspace.accountSync({ action: "get" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      createAccountCaller({ "x-gateway-secret": configuredSecret! }).workspace.accountSync({ action: "put" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
