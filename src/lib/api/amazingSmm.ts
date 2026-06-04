import { appConfig } from "@/lib/config";

type AmazingSmmAction =
  | "services"
  | "add"
  | "status"
  | "balance";

export type AmazingSmmService = {
  service: number;
  name: string;
  type: string;
  category: string;
  rate: string;
  min: string;
  max: string;
  refill: boolean;
  cancel: boolean;
};

async function requestAmazingSmm<T>(
  action: AmazingSmmAction,
  payload: Record<string, string | number> = {},
): Promise<T> {
  // Reserved for later stages. AmazingSMM expects form-style API requests with
  // a key, action, and action-specific fields such as service, link, quantity,
  // or order id. Do not call this from the static homepage yet.
  const body = new URLSearchParams({
    key: appConfig.amazingSmm.apiKey,
    action,
    ...Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, String(value)])),
  });

  const response = await fetch(appConfig.amazingSmm.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`AmazingSMM API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const amazingSmmApi = {
  listServices: () => requestAmazingSmm<AmazingSmmService[]>("services"),
  createOrder: <T>(serviceId: number, link: string, quantity: number) =>
    requestAmazingSmm<T>("add", { service: serviceId, link, quantity }),
  getOrderStatus: <T>(orderId: number) => requestAmazingSmm<T>("status", { order: orderId }),
  getBalance: <T>() => requestAmazingSmm<T>("balance"),
};
