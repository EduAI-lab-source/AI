import type { AppLanguage } from "@/lib/i18n";
import { type MonetizationPlacement, canServeAdvertising } from "@/lib/monetization";

type AdPlacementProps = {
  placement: MonetizationPlacement;
  language: AppLanguage;
};

const labels: Record<AppLanguage, Record<MonetizationPlacement, string>> = {
  es: { studio: "Espacio publicitario del estudio", guides: "Espacio publicitario de las guías", footer: "Espacio publicitario del pie de página" },
  en: { studio: "Studio advertising space", guides: "Guide advertising space", footer: "Footer advertising space" },
  ru: { studio: "Рекламное место студии", guides: "Рекламное место руководств", footer: "Рекламное место внизу страницы" },
};

/**
 * A deliberately inert placement. No advertiser script or creative is emitted
 * until an approved publisher ID and a consent-aware delivery configuration exist.
 */
export function AdPlacement({ placement, language }: AdPlacementProps) {
  if (!canServeAdvertising()) {
    return <div className="ad-placement ad-placement-inactive" data-ad-placement={placement} aria-hidden="true" hidden />;
  }

  return <aside className="ad-placement" data-ad-placement={placement} aria-label={labels[language][placement]} />;
}
