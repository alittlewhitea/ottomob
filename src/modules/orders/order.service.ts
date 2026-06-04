export type OrderStatus = "pending" | "processing" | "completed" | "partial" | "canceled";

export type Order = {
  id: number;
  userId: number;
  serviceId: number;
  link: string;
  quantity: number;
  status: OrderStatus;
};

export const orderService = {
  // Later: create local order, submit to AmazingSMM, sync status, and store API order id.
  async findById(_id: number): Promise<Order | null> {
    return null;
  },
};
