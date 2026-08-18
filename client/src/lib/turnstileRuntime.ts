export const TURNSTILE_SITE_KEY = "0x4AAAAAAETqwiLxMqt1tqRo";
export const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export type TurnstileWidgetOptions = {
  sitekey: string;
  action?: string;
  appearance?: "always" | "execute" | "interaction-only";
  callback: (token: string) => void;
  "error-callback": () => void;
  "expired-callback": () => void;
};

export type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileWidgetOptions) => string;
  reset: (widgetId?: string) => void;
  remove?: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let turnstileLoader: Promise<TurnstileApi> | null = null;

export function loadTurnstile() {
  if (typeof window === "undefined") return Promise.reject(new Error("Turnstile necesita un navegador."));
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (turnstileLoader) return turnstileLoader;

  turnstileLoader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.dataset.eduAiTurnstile = "true";
    script.onload = () => window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile no se pudo iniciar."));
    script.onerror = () => reject(new Error("Turnstile no se pudo cargar."));
    document.head.appendChild(script);
  });
  return turnstileLoader;
}
