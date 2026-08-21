export type AmbientPosition = { x: number; y: number };
export type AmbientPointerMode = "follow" | "pulse";

const clamp = (value: number) => Math.min(100, Math.max(0, value));

export function getAmbientPosition(clientX: number, clientY: number, bounds: Pick<DOMRect, "left" | "top" | "width" | "height">): AmbientPosition {
  const safeWidth = Math.max(bounds.width, 1);
  const safeHeight = Math.max(bounds.height, 1);
  return {
    x: clamp(Math.round(((clientX - bounds.left) / safeWidth) * 100)),
    y: clamp(Math.round(((clientY - bounds.top) / safeHeight) * 100)),
  };
}

export function getAmbientPointerMode(pointerType: string): AmbientPointerMode {
  return pointerType === "touch" ? "pulse" : "follow";
}
