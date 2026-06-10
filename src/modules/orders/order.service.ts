import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { amazingSmmApi } from "@/lib/api/amazingSmm";
import { appConfig } from "@/lib/config";
import { getMysqlPool } from "@/lib/db/mysql";
import { catalogService } from "@/modules/services/catalog.service";
import {
  calculatePublicCharge,
  isValidPublicQuantity,
} from "@/modules/services/pricing.service";

export type OrderStatus = "pending" | "processing" | "completed" | "partial" | "canceled" | "failed";

export type Order = {
  id: number;
  userId: number;
  serviceId: number;
  externalOrderId: number | null;
  serviceName: string;
  platform: string;
  link: string;
  quantity: number;
  charge: number;
  paymentStatus: "unpaid" | "paid" | "refunded";
  status: OrderStatus;
  createdAt: string;
};

type OrderRow = RowDataPacket & {
  id: number;
  user_id: number;
  service_id: number;
  external_order_id: number | null;
  service_name: string;
  platform: string;
  link: string;
  quantity: number;
  charge: string;
  payment_status: "unpaid" | "paid" | "refunded";
  status: OrderStatus;
  created_at: Date;
};

type UserBalanceRow = RowDataPacket & {
  id: number;
  balance: string;
};

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    userId: row.user_id,
    serviceId: row.service_id,
    externalOrderId: row.external_order_id,
    serviceName: row.service_name,
    platform: row.platform,
    link: row.link,
    quantity: row.quantity,
    charge: Number(row.charge),
    paymentStatus: row.payment_status,
    status: row.status,
    createdAt: row.created_at.toISOString(),
  };
}

async function refundFailedSupplierOrder(
  orderId: number,
  userId: number,
  charge: number,
  reason: string,
) {
  const connection = await getMysqlPool().getConnection();

  try {
    await connection.beginTransaction();
    const [orderRows] = await connection.query<(RowDataPacket & {
      id: number;
      payment_status: "unpaid" | "paid" | "refunded";
      status: OrderStatus;
    })[]>(
      "SELECT id, payment_status, status FROM orders WHERE id = ? AND user_id = ? FOR UPDATE",
      [orderId, userId],
    );
    const order = orderRows[0];

    if (!order || order.payment_status !== "paid") {
      await connection.commit();
      return;
    }

    const [userRows] = await connection.query<UserBalanceRow[]>(
      "SELECT id, balance FROM users WHERE id = ? FOR UPDATE",
      [userId],
    );
    const user = userRows[0];

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const balanceBefore = Number(user.balance);
    const balanceAfter = Number((balanceBefore + charge).toFixed(4));

    await connection.execute("UPDATE users SET balance = ? WHERE id = ?", [balanceAfter, userId]);
    await connection.execute(
      "UPDATE orders SET status = 'failed', payment_status = 'refunded' WHERE id = ?",
      [orderId],
    );
    await connection.execute(
      `INSERT INTO wallet_transactions
        (user_id, type, amount, balance_before, balance_after, reference_type, reference_id, description)
       VALUES (?, 'refund', ?, ?, ?, 'order', ?, ?)`,
      [
        userId,
        charge,
        balanceBefore,
        balanceAfter,
        orderId,
        `Refund for failed supplier order #${orderId}: ${reason.slice(0, 120)}`,
      ],
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function debitUserBalanceForOrder(
  connection: PoolConnection,
  userId: number,
  charge: number,
) {
  const [userRows] = await connection.query<UserBalanceRow[]>(
    "SELECT id, balance FROM users WHERE id = ? FOR UPDATE",
    [userId],
  );
  const user = userRows[0];

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const balanceBefore = Number(user.balance);

  if (balanceBefore < charge) {
    throw new Error("INSUFFICIENT_BALANCE");
  }

  const balanceAfter = Number((balanceBefore - charge).toFixed(4));
  await connection.execute("UPDATE users SET balance = ? WHERE id = ?", [balanceAfter, userId]);

  return {
    balanceBefore,
    balanceAfter,
  };
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

    if (!service.externalServiceId) {
      throw new Error("SERVICE_NOT_ORDERABLE");
    }

    if (!isValidPublicQuantity(service, input.quantity)) {
      throw new Error("INVALID_QUANTITY");
    }

    const charge = calculatePublicCharge(service, input.quantity);
    const connection = await getMysqlPool().getConnection();
    let orderId = 0;

    try {
      await connection.beginTransaction();
      const { balanceBefore, balanceAfter } = await debitUserBalanceForOrder(
        connection,
        input.userId,
        charge,
      );
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO orders (user_id, service_id, link, quantity, charge, payment_status, status)
         VALUES (?, ?, ?, ?, ?, 'paid', 'pending')`,
        [input.userId, input.serviceId, input.link, input.quantity, charge],
      );
      orderId = result.insertId;

      await connection.execute(
        `INSERT INTO wallet_transactions
          (user_id, type, amount, balance_before, balance_after, reference_type, reference_id, description)
         VALUES (?, 'order_debit', ?, ?, ?, 'order', ?, ?)`,
        [
          input.userId,
          -charge,
          balanceBefore,
          balanceAfter,
          orderId,
          `Order #${orderId}`,
        ],
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const order = await this.findById(orderId, input.userId);
    if (!order) {
      throw new Error("ORDER_CREATE_FAILED");
    }

    if (!appConfig.amazingSmm.apiKey) {
      await refundFailedSupplierOrder(
        order.id,
        input.userId,
        charge,
        "AmazingSMM API key is not configured",
      );
      throw new Error("SUPPLIER_NOT_CONFIGURED");
    }

    try {
      const supplierOrder = await amazingSmmApi.createOrder(
        service.externalServiceId,
        input.link,
        input.quantity,
      );

      if ("error" in supplierOrder) {
        await refundFailedSupplierOrder(order.id, input.userId, charge, supplierOrder.error);
        throw new Error("SUPPLIER_ORDER_FAILED");
      }

      await getMysqlPool().execute(
        "UPDATE orders SET external_order_id = ?, status = 'processing' WHERE id = ?",
        [supplierOrder.order, order.id],
      );

      const submittedOrder = await this.findById(order.id, input.userId);
      if (!submittedOrder) {
        throw new Error("ORDER_CREATE_FAILED");
      }

      return submittedOrder;
    } catch (error) {
      if (error instanceof Error && error.message === "SUPPLIER_ORDER_FAILED") {
        throw error;
      }

      await refundFailedSupplierOrder(
        order.id,
        input.userId,
        charge,
        error instanceof Error ? error.message : "Unknown supplier error",
      );
      throw new Error("SUPPLIER_ORDER_FAILED");
    }
  },
};
