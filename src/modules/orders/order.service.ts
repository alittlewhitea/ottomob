import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getMysqlPool } from "@/lib/db/mysql";
import { catalogService } from "@/modules/services/catalog.service";

export type OrderStatus = "pending" | "processing" | "completed" | "partial" | "canceled" | "failed";

export type Order = {
  id: number;
  userId: number;
  serviceId: number;
  serviceName: string;
  platform: string;
  link: string;
  quantity: number;
  charge: number;
  status: OrderStatus;
  createdAt: string;
};

type OrderRow = RowDataPacket & {
  id: number;
  user_id: number;
  service_id: number;
  service_name: string;
  platform: string;
  link: string;
  quantity: number;
  charge: string;
  status: OrderStatus;
  created_at: Date;
};

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    userId: row.user_id,
    serviceId: row.service_id,
    serviceName: row.service_name,
    platform: row.platform,
    link: row.link,
    quantity: row.quantity,
    charge: Number(row.charge),
    status: row.status,
    createdAt: row.created_at.toISOString(),
  };
}

export function calculateOrderCharge(rate: number, quantity: number) {
  return Number(((rate * quantity) / 1000).toFixed(4));
}

function isValidQuantity(quantity: number, min: number, max: number, step: number) {
  return quantity >= min && quantity <= max && (quantity - min) % step === 0;
}

export const orderService = {
  async findById(id: number, userId?: number): Promise<Order | null> {
    const params: number[] = [id];
    let sql = `
      SELECT orders.*, services.name AS service_name, services.platform
      FROM orders
      INNER JOIN services ON services.id = orders.service_id
      WHERE orders.id = ?
    `;

    if (userId) {
      sql += " AND orders.user_id = ?";
      params.push(userId);
    }

    sql += " LIMIT 1";
    const [rows] = await getMysqlPool().query<OrderRow[]>(sql, params);
    return rows[0] ? mapOrder(rows[0]) : null;
  },

  async listForUser(userId: number, limit = 12): Promise<Order[]> {
    const [rows] = await getMysqlPool().query<OrderRow[]>(
      `SELECT orders.*, services.name AS service_name, services.platform
       FROM orders
       INNER JOIN services ON services.id = orders.service_id
       WHERE orders.user_id = ?
       ORDER BY orders.created_at DESC
       LIMIT ?`,
      [userId, limit],
    );

    return rows.map(mapOrder);
  },

  async createLocalOrder(input: {
    userId: number;
    serviceId: number;
    link: string;
    quantity: number;
  }): Promise<Order> {
    const service = await catalogService.findById(input.serviceId);

    if (!service) {
      throw new Error("SERVICE_NOT_FOUND");
    }

    if (
      !isValidQuantity(
        input.quantity,
        service.minQuantity,
        service.maxQuantity,
        service.quantityStep,
      )
    ) {
      throw new Error("INVALID_QUANTITY");
    }

    const charge = calculateOrderCharge(service.rate, input.quantity);
    const [result] = await getMysqlPool().execute<ResultSetHeader>(
      `INSERT INTO orders (user_id, service_id, link, quantity, charge, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [input.userId, input.serviceId, input.link, input.quantity, charge],
    );

    const order = await this.findById(result.insertId, input.userId);
    if (!order) {
      throw new Error("ORDER_CREATE_FAILED");
    }

    return order;
  },
};
