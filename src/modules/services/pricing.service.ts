import type { SmmService } from "@/modules/services/catalog.service";

export type PriceTier = {
  quantity: number;
  price: number;
  label: string;
};

const priceTierRules: Array<{
  pattern: RegExp;
  tiers: PriceTier[];
}> = [
  {
    pattern: /\b(followers|members|subscribers)\b/i,
    tiers: [
      { quantity: 500, price: 4.99, label: "500" },
      { quantity: 1000, price: 7.99, label: "1,000" },
    ],
  },
];

export function getPriceTiersForService(service: Pick<SmmService, "name" | "minQuantity" | "maxQuantity">) {
  const rule = priceTierRules.find((item) => item.pattern.test(service.name));

  if (!rule) {
    return [];
  }

  return rule.tiers.filter(
    (tier) => tier.quantity >= service.minQuantity && tier.quantity <= service.maxQuantity,
  );
}

export function getPublicStartingPrice(service: Pick<SmmService, "name" | "rate" | "minQuantity" | "maxQuantity">) {
  const tiers = getPriceTiersForService(service);

  if (tiers.length) {
    return Math.min(...tiers.map((tier) => tier.price));
  }

  return Number(((service.rate * service.minQuantity) / 1000).toFixed(4));
}

export function calculatePublicCharge(
  service: Pick<SmmService, "name" | "rate" | "minQuantity" | "maxQuantity">,
  quantity: number,
) {
  const tier = getPriceTiersForService(service).find((item) => item.quantity === quantity);

  if (tier) {
    return tier.price;
  }

  return Number(((service.rate * quantity) / 1000).toFixed(4));
}

export function isValidPublicQuantity(
  service: Pick<SmmService, "name" | "minQuantity" | "maxQuantity" | "quantityStep">,
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
