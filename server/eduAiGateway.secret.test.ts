import { createServer } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hasValidEduAiGateway } from "./eduAiGateway";

const configuredSecret = process.env.EDU_AI_GATEWAY_SECRET;
let server: ReturnType<typeof createServer>;
let endpoint: string;

describe("clave configurada del gateway de Edu AI", () => {
  beforeAll(async () => {
    expect(configuredSecret).toMatch(/^[a-f0-9]{64}$/);
    server = createServer((req, res) => {
      const isAuthorized = hasValidEduAiGateway(req.headers, configuredSecret);
      res.writeHead(isAuthorized ? 204 : 403).end();
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("No fue posible iniciar la prueba del gateway");
    endpoint = `http://127.0.0.1:${address.port}/gateway-health`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("autoriza una solicitud de endpoint que presenta la clave configurada", async () => {
    const response = await fetch(endpoint, {
      headers: { "x-gateway-secret": configuredSecret! },
    });

    expect(response.status).toBe(204);
  });
});
