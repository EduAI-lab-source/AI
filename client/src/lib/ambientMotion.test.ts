import { describe, expect, it } from "vitest";
import { getAmbientPosition } from "./ambientMotion";

describe("fondo ambiental reactivo", () => {
  const bounds = { left: 100, top: 50, width: 400, height: 200 };

  it("convierte la posición del puntero a coordenadas porcentuales del espacio", () => {
    expect(getAmbientPosition(300, 150, bounds)).toEqual({ x: 50, y: 50 });
  });

  it("mantiene el resplandor dentro del área aunque el gesto salga del contenedor", () => {
    expect(getAmbientPosition(-20, 500, bounds)).toEqual({ x: 0, y: 100 });
  });
});
