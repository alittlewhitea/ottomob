import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { amazingSmmApi, type AmazingSmmService } from "@/lib/api/amazingSmm";
import { getMysqlPool } from "@/lib/db/mysql";

export type SmmPlatform =
  | "Instagram"
  | "TikTok"
  | "YouTube"
  | "Facebook"
  | "Telegram"
  | "Twitter/X";

export type SmmService = {
  id: number;
  externalServiceId: number | null;
  categoryId: number;
  platform: SmmPlatform;
  name: string;
  serviceType: string | null;
  rate: number;
  minQuantity: number;
  maxQuantity: number;
  quantityStep: number;
  refillSupported: boolean;
  cancelSupported: boolean;
};

type ServiceRow = RowDataPacket & {
  id: number;
  external_service_id: number | null;
  category_id: number;
  platform: SmmPlatform;
  name: string;
  service_type: string | null;
  rate: string;
  min_quantity: number;
  max_quantity: number;
  quantity_step: number;
  refill_supported: 0 | 1;
  cancel_supported: 0 | 1;
};

type SelectedService = {
  externalServiceId: number;
  categorySlug: string;
  categoryName: string;
  platform: SmmPlatform;
  name: string;
  serviceType: string;
  rate: number;
  minQuantity: number;
  maxQuantity: number;
  quantityStep: number;
  refillSupported: boolean;
  cancelSupported: boolean;
  raw: AmazingSmmService;
};

const platformMatchers: Array<[SmmPlatform, RegExp]> = [
  ["Instagram", /\b(instagram|ig|reels)\b/i],
  ["TikTok", /\b(tiktok|tik tok)\b/i],
  ["YouTube", /\b(youtube|yt|shorts|subscriber)\b/i],
  ["Facebook", /\b(facebook|fb)\b/i],
  ["Telegram", /\b(telegram|tg)\b/i],
  ["Twitter/X", /\b(twitter|x\.com|tweet)\b/i],
];

const categoryMatchers = [
  { slug: "followers", name: "Followers", pattern: /\b(followers|members|subscribers)\b/i, min: 500 },
  { slug: "likes", name: "Likes", pattern: /\b(likes|reactions)\b/i, min: 100 },
  { slug: "views", name: "Views", pattern: /\b(views|watch)\b/i, min: 500 },
  { slug: "comments", name: "Comments", pattern: /\b(comments|replies)\b/i, min: 10 },
  { slug: "shares", name: "Shares", pattern: /\b(shares|reposts|retweets)\b/i, min: 50 },
  { slug: "saves", name: "Saves", pattern: /\b(saves|bookmarks)\b/i, min: 50 },
  { slug: "impressions", name: "Impressions", pattern: /\b(impressions|reach)\b/i, min: 500 },
];

function isGuaranteedRecommendedService(service: AmazingSmmService) {
  return (
    /with\s+guarantee/i.test(service.category) &&
    service.name.includes("\u2b50")
  );
}

function mapService(row: ServiceRow): SmmService {
  return {
    id: row.id,
    externalServiceId: row.external_service_id,
    categoryId: row.category_id,
    platform: row.platform,
    name: row.name,
    serviceType: row.service_type,
    rate: Number(row.rate),
    minQuantity: row.min_quantity,
    maxQuantity: row.max_quantity,
    quantityStep: row.quantity_step,
    refillSupported: Boolean(row.refill_supported),
    cancelSupported: Boolean(row.cancel_supported),
  };
}

function detectPlatform(service: AmazingSmmService): SmmPlatform | null {
  const haystack = `${service.category} ${service.name}`;
  return platformMatchers.find(([, pattern]) => pattern.test(haystack))?.[0] ?? null;
}

function detectCategory(service: AmazingSmmService) {
  const haystack = `${service.category} ${service.name} ${service.type}`;
  return categoryMatchers.find((category) => category.pattern.test(haystack)) ?? null;
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120)
    .replace(/-$/g, "");
}

function normalizeSupplierCategory(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function selectLowestPricedServices(rawServices: AmazingSmmService[]) {
  const selected = new Map<string, SelectedService>();

  for (const raw of rawServices) {
    if (!isGuaranteedRecommendedService(raw)) {
      continue;
    }

    const platform = detectPlatform(raw);
    const category = detectCategory(raw);
    const rate = Number(raw.rate);
    const maxQuantity = Number(raw.max);

    if (!platform || !category || !Number.isFinite(rate) || !Number.isFinite(maxQuantity)) {
      continue;
    }

    const minQuantity = Math.max(Number(raw.min) || 0, category.min);
    const quantityStep = category.min;

    if (maxQuantity < minQuantity) {
      continue;
    }

    const supplierCategory = raw.category.trim();
    const categorySlug = toSlug(supplierCategory);
    const key = normalizeSupplierCategory(supplierCategory);
    const candidate: SelectedService = {
      externalServiceId: Number(raw.service),
      categorySlug,
      categoryName: supplierCategory,
      platform,
      name: raw.name,
      serviceType: raw.type,
      rate,
      minQuantity,
      maxQuantity,
      quantityStep,
      refillSupported: Boolean(raw.refill),
      cancelSupported: Boolean(raw.cancel),
      raw,
    };
    const existing = selected.get(key);

    if (!existing || candidate.rate < existing.rate) {
      selected.set(key, candidate);
    }
  }

  return Array.from(selected.values()).sort((a, b) =>
    `${a.platform} ${a.categoryName}`.localeCompare(`${b.platform} ${b.categoryName}`),
  );
}

export const catalogService = {
  async listFeatured(): Promise<SmmService[]> {
    const [rows] = await getMysqlPool().query<ServiceRow[]>(
      "SELECT * FROM services WHERE is_active = 1 ORDER BY platform, rate ASC LIMIT 24",
    );
    return rows.map(mapService);
  },

  async listByPlatform(platform?: string): Promise<SmmService[]> {
    const params: string[] = [];
    let sql = "SELECT * FROM services WHERE is_active = 1";

    if (platform) {
      sql += " AND platform = ?";
      params.push(platform);
    }

    sql += " ORDER BY platform, name";
    const [rows] = await getMysqlPool().query<ServiceRow[]>(sql, params);
    return rows.map(mapService);
  },

  async findById(id: number): Promise<SmmService | null> {
    const [rows] = await getMysqlPool().query<ServiceRow[]>(
      "SELECT * FROM services WHERE id = ? AND is_active = 1 LIMIT 1",
      [id],
    );
    return rows[0] ? mapService(rows[0]) : null;
  },

  async syncFromAmazingSmm() {
    const rawServices = await amazingSmmApi.listServices();
    const selectedServices = selectLowestPricedServices(rawServices);
    const pool = getMysqlPool();
    let upserted = 0;

    if (selectedServices.length) {
      await pool.execute("UPDATE services SET is_active = 0");
    }

    for (const service of selectedServices) {
      const [categoryResult] = await pool.execute<ResultSetHeader>(
        `INSERT INTO service_categories (platform, slug, name, min_quantity_step)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           platform = VALUES(platform),
           name = VALUES(name),
           min_quantity_step = VALUES(min_quantity_step)`,
        [service.platform, service.categorySlug, service.categoryName, service.quantityStep],
      );

      let categoryId = categoryResult.insertId;
      if (!categoryId) {
        const [categoryRows] = await pool.query<(RowDataPacket & { id: number })[]>(
          "SELECT id FROM service_categories WHERE slug = ? LIMIT 1",
          [service.categorySlug],
        );
        categoryId = categoryRows[0]?.id;
      }

      await pool.execute(
        `INSERT INTO services
          (external_service_id, category_id, platform, name, service_type, rate, min_quantity,
           max_quantity, quantity_step, refill_supported, cancel_supported, raw_payload)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           category_id = VALUES(category_id),
           platform = VALUES(platform),
           name = VALUES(name),
           service_type = VALUES(service_type),
           rate = VALUES(rate),
           min_quantity = VALUES(min_quantity),
           max_quantity = VALUES(max_quantity),
           quantity_step = VALUES(quantity_step),
           refill_supported = VALUES(refill_supported),
           cancel_supported = VALUES(cancel_supported),
           raw_payload = VALUES(raw_payload),
           is_active = 1`,
        [
          service.externalServiceId,
          categoryId,
          service.platform,
          service.name,
          service.serviceType,
          service.rate,
          service.minQuantity,
          service.maxQuantity,
          service.quantityStep,
          service.refillSupported ? 1 : 0,
          service.cancelSupported ? 1 : 0,
          JSON.stringify(service.raw),
        ],
      );
      upserted += 1;
    }

    return {
      received: rawServices.length,
      selected: selectedServices.length,
      upserted,
    };
  },
};
