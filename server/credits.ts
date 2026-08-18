export const CREDIT_CHECKOUT_ENABLED = false;

export const CREDIT_PACKAGES = [
  { id: "voice-30", credits: 30, label: "30.000 caracteres de voz" },
  { id: "voice-60", credits: 60, label: "60.000 caracteres de voz" },
  { id: "voice-120", credits: 120, label: "120.000 caracteres de voz" },
] as const;

export function getCreditReadiness() {
  return {
    checkoutEnabled: CREDIT_CHECKOUT_ENABLED,
    unit: "1 crédito = 1.000 caracteres de voz",
    packages: CREDIT_PACKAGES,
    message: "Los créditos están en preparación. No hay cobros ni canjes activos.",
  } as const;
}
