import type { SmmService } from "@/modules/services/catalog.service";

export type PriceTier = {
  quantity: number;
  price: number;
  label: string;
};

const PUBLIC_PRICE_MARKUP = 1.5;

const priceTierRules: Array<{
  pattern: RegExp;
  tiers: Array<Omit<PriceTier, "price">>;
}> = [
  {
    pattern: /\b(followers|members|subscribers)\b/i,
    tiers: [
      { quantity: 500, label: "500" },
      { quantity: 1000, label: "1,000" },
    ],
  },
];

function calculateMarkedUpCharge(rate: number, quantity: number) {
  return Number((((rate * quantity) / 1000) * PUBLIC_PRICE_MARKUP).toFixed(4));
}

export function getPriceTiersForService(service: Pick<SmmService, "name" | "rate" | "minQuantity" | "maxQuantity">) {
  const rule = priceTierRules.find((item) => item.pattern.test(service.name));

  if (!rule) {
    return [];
  }

  return rule.tiers.filter(
    (tier) => tier.quantity >= service.minQuantity && tier.quantity <= service.maxQuantity,
  ).map((tier) => ({
    ...tier,
    price: calculateMarkedUpCharge(service.rate, tier.quantity),
  }));
}

export function getPublicStartingPrice(service: Pick<SmmService, "name" | "rate" | "minQuantity" | "maxQuantity">) {
  const tiers = getPriceTiersForService(service);

  if (tiers.length) {
    return Math.min(...tiers.map((tier) => tier.price));
  }

  return calculateMarkedUpCharge(service.rate, service.minQuantity);
}

export function calculatePublicCharge(
  service: Pick<SmmService, "name" | "rate" | "minQuantity" | "maxQuantity">,
  quantity: number,
) {
  const tier = getPriceTiersForService(service).find((item) => item.quantity === quantity);

  if (tier) {
    return tier.price;
  }

  return calculateMarkedUpCharge(service.rate, quantity);
}

export function isValidPublicQuantity(
  service: Pick<SmmService, "name" | "rate" | "minQuantity" | "maxQuantity" | "quantityStep">,
  quantity: number,
) {
  const tiers = getPriceTiersForService(service);

  if (tiers.length) {
    return tiers.some((tier) => tier.quantity === quantity);
  }

  return (
    quantity >= service.minQuantity &&
    quantity <= service.maxQuantity &&
    (quantity - service.minQuantity) % service.quantityStep === 0
  );
}
